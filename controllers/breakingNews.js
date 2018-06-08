/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var BreakingNewsItem = require('../models/BreakingNewsItem.js').getModel();
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
module.exports.newBreakingNewsItem = function(req, res, next) {
   if(req.body.breakingNewsItem) {
      winston.debug("Saving new breaking news item ...");

      //count the amount of breaking news items
      BreakingNewsItem.count({}).then(function(count) {
         var breakingNewsItemJSON = req.body.breakingNewsItem;

         var breakingNewsItem = new BreakingNewsItem();
         breakingNewsItem.headline = breakingNewsItemJSON.headline;
         breakingNewsItem.headlineIcon = breakingNewsItemJSON.headlineIcon;
         breakingNewsItem.title = breakingNewsItemJSON.title;
         breakingNewsItem.date = breakingNewsItemJSON.date;
         breakingNewsItem.views = breakingNewsItemJSON.views;
         breakingNewsItem.type = breakingNewsItemJSON.type;
         breakingNewsItem.imageFile = breakingNewsItemJSON.imageFile;
         breakingNewsItem.access = breakingNewsItemJSON.access;
         breakingNewsItem.order = count + 1;
         breakingNewsItem.views = 0;
         breakingNewsItem.save(function(err, savedBreakingNewsItem) {
            if(!err) {
               winston.verbose("New breaking news item saved.");
               Utils.sendJSONresponse(res, 200, { message: 'new breaking news item saved', id: savedBreakingNewsItem._id });
            } else {
               winston.error("Error while saving the new breaking news item, err = [%s]", err);
               Utils.next(400, err, next);
            }
         });
      }).catch(function(err) {
         winston.error("Error while saving the new breaking news item (counting the amount of breaking news items), err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined breaking news item' });
   }
}

module.exports.editBreakingNewsItem = function(req, res, next) {
   if(req.body.breakingNewsItem) {
      var breakingNewsItemJSON = req.body.breakingNewsItem;

      BreakingNewsItem.findById({ _id: breakingNewsItemJSON.id }).then( function(breakingNewsItem) {
         if(breakingNewsItem) {

            breakingNewsItem.headline = breakingNewsItemJSON.headline;
            breakingNewsItem.headlineIcon = breakingNewsItemJSON.headlineIcon;
            breakingNewsItem.title = breakingNewsItemJSON.title;
            breakingNewsItem.date = breakingNewsItemJSON.date;
            breakingNewsItem.type = breakingNewsItemJSON.type;
            breakingNewsItem.imageFile = breakingNewsItemJSON.imageFile;
            breakingNewsItem.access = breakingNewsItemJSON.access;

            winston.debug("Saving breaking news item ...");

            breakingNewsItem.save(function(err, savedBreakingNewsItem) {
               if(!err) {
                  winston.verbose("Breaking news item saved.");
                  Utils.sendJSONresponse(res, 200, { message: 'breaking news item saved', id: savedBreakingNewsItem._id });
               } else {
                  winston.error("Error while saving the breaking news item, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'breaking news item not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined breaking news item' });
   }
}

module.exports.getBreakingNewsItem = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.breakingNewsItemId) {
      var breakingNewsItemId = req.params.breakingNewsItemId;
      var breakingNewsItem = null;
      var order = null;

      BreakingNewsItem.findById({ _id: breakingNewsItemId }).then( function(retrivedBreakingNewsItem) {
         if(retrivedBreakingNewsItem) {
            var breakingNewsItemToSend = {
              'id': retrivedBreakingNewsItem._id,
              'headline': retrivedBreakingNewsItem.headline,
              'headlineIcon': retrivedBreakingNewsItem.headlineIcon,
              'title': retrivedBreakingNewsItem.title,
              'date': retrivedBreakingNewsItem.date,
              'views': retrivedBreakingNewsItem.views,
              'imageFileURL': camaraApiConfig.BreakingNews.s3BreakingNews.urlBase + "/" + retrivedBreakingNewsItem.imageFile,
              'imageFile' : retrivedBreakingNewsItem.imageFile,
              'access': retrivedBreakingNewsItem.access,
              'order': retrivedBreakingNewsItem.order,
              'type': retrivedBreakingNewsItem.type
            };
            Utils.sendJSONresponse(res, 200, { "breakingNewsItem" : breakingNewsItemToSend });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'breaking news item not found' });
         }
      }).catch(function(err) {
         winston.error("Error while getting the breaking news item, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined breaking news item id' });
   }
}

module.exports.getBreakingNewsItems = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");
   BreakingNewsItem.find({}).sort({ order: 'asc' }).then(function(breakingNewsItems) {
      if(breakingNewsItems) {
         var breakingNewsItemsToSend = [];
         var i;

         for(i = 0; i < breakingNewsItems.length; i++) {
            var retrivedBreakingNewsItem = breakingNewsItems[i];
            var breakingNewsItemToSend = {
              'id': retrivedBreakingNewsItem._id,
              'headline': retrivedBreakingNewsItem.headline,
              'headlineIcon': retrivedBreakingNewsItem.headlineIcon,
              'title': retrivedBreakingNewsItem.title,
              'date': retrivedBreakingNewsItem.date,
              'views': retrivedBreakingNewsItem.views,
              'imageFileURL': camaraApiConfig.BreakingNews.s3BreakingNews.urlBase + "/" + retrivedBreakingNewsItem.imageFile,
              'imageFile' : retrivedBreakingNewsItem.imageFile,
              'access': retrivedBreakingNewsItem.access,
              'order': retrivedBreakingNewsItem.order,
              'type': retrivedBreakingNewsItem.type
           };
           breakingNewsItemsToSend.push(breakingNewsItemToSend);
         }
         Utils.sendJSONresponse(res, 200, { 'breakingNewsItems' : breakingNewsItemsToSend });
      } else {
         Utils.sendJSONresponse(res, 200, { 'breakingNewsItems' : [] });
      }
   });
}

module.exports.uploadBreakingNewsItemImage = function(req, res, next) {
   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No files were uploaded.' });
   } else {
      var breakingNewsImageFile = req.files.file;
      var uuid = req.params.uuid;
      if(!uuid) {
         Utils.sendJSONresponse(res, 400, { message: 'uuid required.' });
         return;
      }
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //use the uuid as the file name
      var fileName = uuid;
      var fileNameParts = _.split(breakingNewsImageFile.name, '.');
      if (fileNameParts.length > 1) {
         //append the extension file
         fileName +=  "." + fileNameParts[fileNameParts.length - 1];
      }
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.BreakingNews.s3BreakingNews.s3Bucket,
                          camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + fileName,
                          breakingNewsImageFile.data,
                          breakingNewsImageFile.data.length,
                          breakingNewsImageFile.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'file uploaded', 'filename': fileName });
         } else {
            winston.error("Error while uploading image file of the breaking news item, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.deleteBreakingNewsItemImage = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.fileName) {
      var breakingNewsImageFile = req.params.fileName;
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //send the file to S3 server
      s3Client.removeObject( camaraApiConfig.BreakingNews.s3BreakingNews.s3Bucket,
                             camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + breakingNewsImageFile,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'the file of the breaking news item was removed', 'filename': breakingNewsImageFile });
         } else {
            winston.error("Error while removing the file of the breaking news item was removed, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined file name of the breaking news item' });
   }
}

module.exports.moveBreakingNewsItemUp = function(req, res, next) {
   if(req.params.breakingNewsItemId) {
      var breakingNewsItemId = req.params.breakingNewsItemId;
      var breakingNewsItem = null;
      var order = null;

      BreakingNewsItem.findById({ _id: breakingNewsItemId }).then( function(retrivedBreakingNewsItem) {
         breakingNewsItem = retrivedBreakingNewsItem;
         if (breakingNewsItem) {
            order = breakingNewsItem.order;
            if(order > 1) {
               //get the upper breaking news item
               return BreakingNewsItem.findOne({ "order" : order - 1 });
            } else {
               return null;
            }
         } else {
            return null;
         }
      }).then(function(aboveBreakingNewsItem) {
         if(breakingNewsItem) {
            if(aboveBreakingNewsItem) {
               return BreakingNewsItem.bulkWrite([
                  {
                     updateOne: {
                        filter: { '_id': aboveBreakingNewsItem._id },
                        update: { 'order': order}
                     },
                 },{
                     updateOne: {
                        filter: { '_id': breakingNewsItem._id },
                        update: { 'order': order - 1}
                    }
                 }]);
            } else {
               return 1;
            }
         } else {
            return -1; //sign that the breaking news item was not found
         }
      }).then(function(result) {
         if(result === -1) {
            Utils.sendJSONresponse(res, 400, { message: 'breaking news item not found' });
         } else if(result === 1) {
            Utils.sendJSONresponse(res, 200, { message: 'the breaking news item was kept in the same order' });
         } else {
            Utils.sendJSONresponse(res, 200, { 'message': 'the breaking news item was moved up' });
         }
      }).catch(function(err) {
         winston.error("Error while moving the breaking news item to up, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined breaking news item id' });
   }
}

module.exports.moveBreakingNewsItemDown = function(req, res, next) {
   if(req.params.breakingNewsItemId) {
      var breakingNewsItemId = req.params.breakingNewsItemId;
      var breakingNewsItem = null;
      var order = null;

      BreakingNewsItem.findById({ _id: breakingNewsItemId }).then( function(retrivedBreakingNewsItem) {
         breakingNewsItem = retrivedBreakingNewsItem;
         if (breakingNewsItem) {
            order = breakingNewsItem.order;
            //get the below breaking news item
            return BreakingNewsItem.findOne({ "order" : order + 1 });
         } else {
            return null;
         }
      }).then(function(belowBreakingNewsItem) {
         if(breakingNewsItem) {
            if(belowBreakingNewsItem) {
               return BreakingNewsItem.bulkWrite([
                  {
                     updateOne: {
                        filter: { '_id': belowBreakingNewsItem._id },
                        update: { 'order': order}
                     },
                 },{
                     updateOne: {
                        filter: { '_id': breakingNewsItem._id },
                        update: { 'order': order + 1}
                    }
                 }]);
            } else {
               return 1;
            }
         } else {
            return -1; //sign that the breaking news item was not found
         }
      }).then(function(result) {
         if(result === -1) {
            Utils.sendJSONresponse(res, 400, { message: 'breaking news item not found' });
         } else if(result === 1) {
            Utils.sendJSONresponse(res, 200, { message: 'the breaking news item was kept in the same order' });
         } else {
            Utils.sendJSONresponse(res, 200, { 'message': 'the breaking news item was moved down' });
         }
      }).catch(function(err) {
         winston.error("Error while moving the breaking news item to up, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined breaking news item id' });
   }
}

module.exports.removeBreakingNewsItem = function(req, res, next) {
   if(req.params.breakingNewsItemId) {
      var breakingNewsItemId = req.params.breakingNewsItemId;

      BreakingNewsItem.findById({ _id: breakingNewsItemId }).then(function(breakingNewsItemToBeRemoved) {
         if(breakingNewsItemToBeRemoved) {
            return breakingNewsItemToBeRemoved.remove();
         } else {
            return null;
         }
      }).then(function(removedBreakingNewsItem) {
         if(removedBreakingNewsItem) {
            return BreakingNewsItem.find({ order: { $gt: removedBreakingNewsItem.order } });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'breaking news item not found' });
            return -1; //sign that the breaking news item was not found
         }
      }).then(function(breakingNewsItemsToBeMoved) {
         if(breakingNewsItemsToBeMoved !== -1) { //the breaking news items was not found
            if(breakingNewsItemsToBeMoved) {
               var commands = [];
               breakingNewsItemsToBeMoved.forEach(function(breakingNewsItemToBeMoved) {
                  commands.push({   'updateOne': {
                                       'filter': { '_id': breakingNewsItemToBeMoved._id },
                                       'update': { 'order': breakingNewsItemToBeMoved.order - 1 }
                                    }
                                });
               });
               BreakingNewsItem.bulkWrite(commands);
            }
            winston.verbose("Breaking news item removed.");
            Utils.sendJSONresponse(res, 200, { message: 'breaking news item removed' });
         }
      }).catch(function(err) {
         winston.error("Error while deleting the breaking news item, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined breaking news item id' });
   }
}
