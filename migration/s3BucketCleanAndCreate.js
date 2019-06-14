/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var Minio = require('minio');
var config = require('config');
var _ = require('lodash');

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/

/*****************************************************************************
********************************* PRIVATE ************************************
******************************************************************************/
var _createS3Bucket = async function(done) {
   //remove s3 bucket
   var camaraApiConfig = config.get("CamaraApi");
   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   console.log("Creating s3 bucket ...");
   return new Promise(function(resolve, reject) {
      //send the file to S3 server
      s3Client
      .bucketExists(camaraApiConfig.PublicFiles.s3Files.s3Bucket)
      .then(function() {
         console.log("S3 bucket already exists.");
         resolve(true);
         return true;
      }).catch(function() {
         return s3Client
                .makeBucket( camaraApiConfig.PublicFiles.s3Files.s3Bucket, 'us-east-1' );
      }).then(function(notContinue) {
         if(notContinue !== true) {
            console.log("S3 bucket created.");
            resolve(true);
         }
      }).catch(function(err) {
         console.log("Error while creating s3 bucket in SampleDataLoader, err = [" + err + "]");
         reject(err);
      });
   });
}

var _cleanS3Bucket = async function(done) {
   //remove s3 bucket
   var camaraApiConfig = config.get("CamaraApi");
   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   var i;
   console.log("Cleaning s3 bucket ...");
   return new Promise(function(resolve, reject) {
      s3Client
      .bucketExists(camaraApiConfig.PublicFiles.s3Files.s3Bucket)
      .then(function() {
         //clean s3 bucket
         var listObjectsStream = s3Client.listObjects( camaraApiConfig.PublicFiles.s3Files.s3Bucket, '', true );
         var s3Objects = [];

         listObjectsStream.on('data', function(obj) {
            s3Objects.push(obj.name);
         });

         listObjectsStream.on('error', function(err) {
            console.log("Error while cleaning s3 bucket in SampleDataLoader, err = [" + err + "]");
            reject(err);
         });

         listObjectsStream.on('end', async function() {
            for (i = 0; i < s3Objects.length; i++) {
               await s3Client.removeObject(camaraApiConfig.PublicFiles.s3Files.s3Bucket, s3Objects[i]);
            }
            console.log("S3 bucket cleaned.");
            resolve(true);
         })
      }).catch(function() {
         //the bucket doesn't exist, then nothing to be cleared
         console.log("S3 bucket doesn't exist.");
         resolve(true);
      });
   });
}

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.createS3Bucket = _createS3Bucket;
module.exports.cleanS3Bucket = _cleanS3Bucket;
