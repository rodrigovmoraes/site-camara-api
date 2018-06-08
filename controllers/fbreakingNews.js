/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var FBreakingNewsItem = require('../models/FBreakingNewsItem.js').getModel();
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var Minio = require('minio');
var config = require('config');
var kue = require('kue');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.editFBreakingNewsItem = function(req, res, next) {
   if(req.body.fbreakingNewsItem) {
      var fbreakingNewsItemJSON = req.body.fbreakingNewsItem;

      FBreakingNewsItem.findById({ _id: fbreakingNewsItemJSON.id }).then( function(fbreakingNewsItem) {
         if(fbreakingNewsItem) {

            fbreakingNewsItem.headline = fbreakingNewsItemJSON.headline;
            fbreakingNewsItem.headlineIcon = fbreakingNewsItemJSON.headlineIcon;
            fbreakingNewsItem.title = fbreakingNewsItemJSON.title;
            fbreakingNewsItem.date = fbreakingNewsItemJSON.date;
            fbreakingNewsItem.type = fbreakingNewsItemJSON.type;
            fbreakingNewsItem.imageFile = fbreakingNewsItemJSON.imageFile;
            fbreakingNewsItem.access = fbreakingNewsItemJSON.access;
            fbreakingNewsItem.deleted = false;

            winston.debug("Saving fixed breaking news item ...");

            fbreakingNewsItem.save(function(err, savedFBreakingNewsItem) {
               if(!err) {
                  winston.verbose("Breaking fixed news item saved.");
                  Utils.sendJSONresponse(res, 200, { message: 'breaking fixed news item saved', id: savedFBreakingNewsItem._id });
               } else {
                  winston.error("Error while saving the fixed breaking news item, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'fixed breaking news item not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined fixed breaking news item' });
   }
}

module.exports.getFBreakingNewsItem = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.fbreakingNewsItemId) {
      var fbreakingNewsItemId = req.params.fbreakingNewsItemId;
      var fbreakingNewsItem = null;
      var order = null;

      FBreakingNewsItem.findById({ _id: fbreakingNewsItemId }).then( function(retrivedFBreakingNewsItem) {
         if(retrivedFBreakingNewsItem) {
            var fbreakingNewsItemToSend = {
              'id': retrivedFBreakingNewsItem._id,
              'headline': retrivedFBreakingNewsItem.headline,
              'headlineIcon': retrivedFBreakingNewsItem.headlineIcon,
              'title': retrivedFBreakingNewsItem.title,
              'date': retrivedFBreakingNewsItem.date,
              'views': retrivedFBreakingNewsItem.views,
              'imageFileURL': camaraApiConfig.FBreakingNews.s3FBreakingNews.urlBase + "/" + retrivedFBreakingNewsItem.imageFile,
              'imageFile' : retrivedFBreakingNewsItem.imageFile,
              'access': retrivedFBreakingNewsItem.access,
              'order': retrivedFBreakingNewsItem.order,
              'type': retrivedFBreakingNewsItem.type,
              'deleted': retrivedFBreakingNewsItem.deleted
            };
            Utils.sendJSONresponse(res, 200, { "fbreakingNewsItem" : fbreakingNewsItemToSend });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'fixed breaking news item not found' });
         }
      }).catch(function(err) {
         winston.error("Error while getting the fixed breaking news item, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined fixed breaking news item id' });
   }
}

module.exports.getFBreakingNewsItems = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");
   FBreakingNewsItem.find({}).sort({ order: 'asc' }).then(function(fbreakingNewsItems) {
      if(fbreakingNewsItems) {
         var fbreakingNewsItemsToSend = [];
         var i;

         for(i = 0; i < fbreakingNewsItems.length; i++) {
            var retrivedFBreakingNewsItem = fbreakingNewsItems[i];
            var fbreakingNewsItemToSend = {
              'id': retrivedFBreakingNewsItem._id,
              'headline': retrivedFBreakingNewsItem.headline,
              'headlineIcon': retrivedFBreakingNewsItem.headlineIcon,
              'title': retrivedFBreakingNewsItem.title,
              'date': retrivedFBreakingNewsItem.date,
              'views': retrivedFBreakingNewsItem.views,
              'imageFileURL': camaraApiConfig.FBreakingNews.s3FBreakingNews.urlBase + "/" + retrivedFBreakingNewsItem.imageFile,
              'imageFile' : retrivedFBreakingNewsItem.imageFile,
              'access': retrivedFBreakingNewsItem.access,
              'order': retrivedFBreakingNewsItem.order,
              'type': retrivedFBreakingNewsItem.type,
              'deleted': retrivedFBreakingNewsItem.deleted
           };
           fbreakingNewsItemsToSend.push(fbreakingNewsItemToSend);
         }
         Utils.sendJSONresponse(res, 200, { 'fbreakingNewsItems' : fbreakingNewsItemsToSend });
      } else {
         Utils.sendJSONresponse(res, 200, { 'fbreakingNewsItems' : [] });
      }
   });
}

module.exports.uploadFBreakingNewsItemImage = function(req, res, next) {
   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No files were uploaded.' });
   } else {
      var fbreakingNewsImageFile = req.files.file;
      var uuid = req.params.uuid;
      if(!uuid) {
         Utils.sendJSONresponse(res, 400, { message: 'uuid required.' });
         return;
      }
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //use the uuid as the file name
      var fileName = uuid;
      var fileNameParts = _.split(fbreakingNewsImageFile.name, '.');
      if (fileNameParts.length > 1) {
         //append the extension file
         fileName +=  "." + fileNameParts[fileNameParts.length - 1];
      }
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Bucket,
                          camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Folder + "/" + fileName,
                          fbreakingNewsImageFile.data,
                          fbreakingNewsImageFile.data.length,
                          fbreakingNewsImageFile.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'file uploaded', 'filename': fileName });
         } else {
            winston.error("Error while uploading image file of the fixed breaking news item, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.deleteFBreakingNewsItemImage = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.fileName) {
      var fbreakingNewsImageFile = req.params.fileName;
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //send the file to S3 server
      s3Client.removeObject( camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Bucket,
                             camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Folder + "/" + fbreakingNewsImageFile,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'the file of the fixed breaking news item was removed', 'filename': fbreakingNewsImageFile });
         } else {
            winston.error("Error while removing the file of the fixed breaking news item was removed, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined file name of the fixed breaking news item' });
   }
}

module.exports.removeFBreakingNewsItem = function(req, res, next) {
   if(req.params.fbreakingNewsItemId) {
      var fbreakingNewsItemId = req.params.fbreakingNewsItemId;

      FBreakingNewsItem.findById({ _id: fbreakingNewsItemId }).then(function(fbreakingNewsItemToBeRemoved) {
         if (fbreakingNewsItemToBeRemoved) {
            fbreakingNewsItemToBeRemoved.deleted = true;

            winston.debug("Saving fixed breaking news item (setting as deleted) ...");

            fbreakingNewsItemToBeRemoved.save(function(err, savedFBreakingNewsItem) {
               if(!err) {
                  winston.verbose("Breaking fixed news item saved (set as deleted).");
                  Utils.sendJSONresponse(res, 200, { message: 'breaking fixed news item saved (set deleted)', id: savedFBreakingNewsItem._id });
               } else {
                  winston.error("Error while saving the fixed breaking news item (setting as deleted), err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            return null;
         }
      }).catch(function(err) {
         winston.error("Error while saving the fixed breaking news item (setting as deleted), err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined fixed breaking news item id' });
   }
}
