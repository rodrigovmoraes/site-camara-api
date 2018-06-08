/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var winston = require('winston');
var config = require('config');
var kue = require('kue');
var Minio = require('minio');
var Jimp = require('jimp');

/*****************************************************************************
*********************************** PRIVATE **********************************
******************************************************************************/
var _queue = null;
var _camaraApiConfig = config.get("CamaraApi");
var _initialized = false;

/*****************************************************************************
************************************ JOBS ************************************
******************************************************************************/

//********* imageProcessingResize job
var _imageProcessingResizeJob = function(job, done) {
   var s3Client = new Minio.Client(_camaraApiConfig.S3Configuration);
   var s3Path = job.data.s3Path;
   var width = job.data.width;
   var height = job.data.height;

   winston.verbose('Image processing Job received: s3Path=[%s], width=[%s], height=[%s]', s3Path, width, height);

   var s3Client = new Minio.Client(_camaraApiConfig.S3Configuration);
   s3Client.getObject( _camaraApiConfig.News.s3Thumbnails.s3Bucket,
                       s3Path,
   function(err, dataStream) {
       if (err) {
          winston.error("Error while getting file from S3 file for resizing process, err = [%s]", err);
          done(err);
       } else {
          var buffers = [];
          var bufferLength = 0;
          dataStream.on('data', function(chunk) {
             buffers.push(chunk);
             bufferLength += chunk.length;
          });
          dataStream.on('end', function() {
             var imageBuffer = Buffer.concat(buffers, bufferLength);
             //convert buffer to Jimp image format
             Jimp.read(imageBuffer, function (err, image) {
                if(!err) {
                  // do stuff with the image (if no exception)
                  image.resize(width, height);

                  image.getBuffer( image.getMIME(), function(err, resizedImageBuffer) {
                     if(!err) {
                        //send the resized image to S3 server
                        s3Client = new Minio.Client(_camaraApiConfig.S3Configuration);
                        s3Client.putObject( _camaraApiConfig.News.s3Thumbnails.s3Bucket,
                                            s3Path,
                                            resizedImageBuffer,
                                            resizedImageBuffer.length,
                                            image.getMIME(),
                        function(err, etag) {
                          if(!err) {
                             winston.debug("Resized image sent to S3 server, s3Path = [%s]", s3Path);
                             done();
                          } else {
                             winston.error("Error while sending resized image to S3 server, err = [%s]", err);
                             done(err);
                          }
                        });
                     } else {
                        winston.error("Error while resizing the image, err = [%s]", err);
                        done(err);
                     }
                  });
                } else {
                   winston.error("Error while converting file from S3 file to Jimp image format, err = [%s]", err);
                   done(err);
                }
             });
             dataStream.on('error', function(err) {
                winston.error("Error while getting file from S3 file for resize process, err = [%s]", err);
                done(err);
             });
          });
       }
   });
}
/*****************************************************************************
*********************************** SETUP QUEUE*******************************
******************************************************************************/
var _setupQueue = function(pqueue) {

   //********* imageProcessingResize job
   pqueue.process('imageProcessingResize', function(job, done) {
         _imageProcessingResizeJob(job, done);
   });

   pqueue.on('error', function( err ) {
      winston.error("Kue error, err = [%s]", err);
   });

   winston.info('JOBs processor started.');
};

/*****************************************************************************
********************************** CONFIG ************************************
******************************************************************************/
if(!_initialized) {
   _initialized = true;

   //log configuration
   winston.setLevels(_camaraApiConfig.Log.levels);
   winston.addColors(_camaraApiConfig.Log.levelsColors);
   winston.configure({
       transports: [
         new (winston.transports.Console)({ colorize: true })
       ]
    });
   winston.level = _camaraApiConfig.Log.level;
   //Kue job processor configuration
   try {
      _queue = kue.createQueue( {
         prefix: _camaraApiConfig.Kue.prefix,
         redis: _camaraApiConfig.Kue.Redis
      });
   } catch(err) {
      _queue = null;
      winston.error("Error while creating queue jobs, err=[%s]", err);
   }

   if(_queue) {
      _setupQueue(_queue);
   }
}//END - if(initialized)

module.exports = _queue;
