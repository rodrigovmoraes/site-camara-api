/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var NewsItemModule = require('../models/NewsItem.js');
var NewsItem = NewsItemModule.getModel();
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var Minio = require('minio');
var config = require('config');
var kue = require('kue');
var uuidModule = require('uuid');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.newNewsItem = function(req, res, next) {
   if(req.body.newsItem) {
      var newsItemJSON = req.body.newsItem;

      var newsItem = new NewsItem();
      var now = new Date();
      newsItem.title = newsItemJSON.title;
      newsItem.headline = newsItemJSON.headline;
      newsItem.publish = newsItemJSON.publish;
      newsItem.thumbnailFile = newsItemJSON.thumbnailFile;
      newsItem.enableFacebookComments = newsItemJSON.enableFacebookComments;
      newsItem.enableFacebookShareButton = newsItemJSON.enableFacebookShareButton;
      if (newsItemJSON.publish) {
         newsItem.publicationDate = newsItemJSON.publicationDate ? newsItemJSON.publicationDate : now;
      } else {
         newsItem.publicationDate = null;
      }
      newsItem.creationDate = now;
      newsItem.changedDate = null;
      newsItem.body = newsItemJSON.body;

      winston.debug("Saving news item ...");

      newsItem.save(function(err, newsItem) {
         if(!err) {
            winston.verbose("News item saved.");
            Utils.sendJSONresponse(res, 200, { message: 'news item saved', id: newsItem._id });
         } else {
            winston.error("Error while saving the news item, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined news item' });
   }
}

module.exports.editNewsItem = function(req, res, next) {
   if(req.body.newsItem) {
      var newsItemJSON = req.body.newsItem;

      NewsItem.findById({ _id: newsItemJSON.id }).then( function(newsItem) {
         if(newsItem) {
            var now = new Date();
            newsItem.title = newsItemJSON.title;
            newsItem.headline = newsItemJSON.headline;
            newsItem.publish = newsItemJSON.publish;
            newsItem.thumbnailFile = newsItemJSON.thumbnailFile;
            newsItem.enableFacebookComments = newsItemJSON.enableFacebookComments;
            newsItem.enableFacebookShareButton = newsItemJSON.enableFacebookShareButton;
            if (newsItemJSON.publish) {
               newsItem.publicationDate = newsItemJSON.publicationDate ? newsItemJSON.publicationDate : now;
            } else {
               newsItem.publicationDate = null;
            }
            newsItem.changedDate = now;
            newsItem.body = newsItemJSON.body;

            winston.debug("Saving news item ...");

            newsItem.save(function(err, newsItem) {
               if(!err) {
                  winston.verbose("News item saved.");
                  Utils.sendJSONresponse(res, 200, { message: 'news item saved', id: newsItem._id });
               } else {
                  winston.error("Error while saving the news item, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'news item not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined news item' });
   }
}

module.exports.removeNewsItem = function(req, res, next) {
   if(req.params.newsItemId) {
      var newsItemId = req.params.newsItemId;

      NewsItem.findById({ _id: newsItemId }).then( function(newsItem) {
         if(newsItem) {
            newsItem.remove().then(function(newsItem) {
               winston.verbose("News item removed.");
               Utils.sendJSONresponse(res, 200, { message: 'news item removed' });
            }).catch(function(err) {
               winston.error("Error while deleting the news item, err = [%s]", err);
               Utils.next(400, err, next);
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'news item not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined news item id' });
   }
}

module.exports.uploadWysiwygFileAttachment = function(req, res, next) {
   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No files were uploaded.' });
   } else {
      var wysiwygFileAttachment = req.files.file;
      var uuid = uuidModule.v4();
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //use the uuid as the file name
      var fileName = uuid;
      var fileNameParts = _.split(wysiwygFileAttachment.name, '.');
      if(fileNameParts.length > 1) {
         //append the extension file
         fileName +=  "." + fileNameParts[fileNameParts.length - 1];
      }
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.News.s3WysiwygFileAttachments.s3Bucket,
                          camaraApiConfig.News.s3WysiwygFileAttachments.s3Folder + "/" + fileName,
                          wysiwygFileAttachment.data,
                          wysiwygFileAttachment.data.length,
                          wysiwygFileAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file uploaded',
               'originalFilename': wysiwygFileAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.News.s3WysiwygFileAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading file of the news item, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadWysiwygFileImageAttachment = function(req, res, next) {
   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No image files were uploaded.' });
   } else {
      var wysiwygFileImageAttachment = req.files.file;
      var uuid = uuidModule.v4();
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //use the uuid as the file name
      var fileName = uuid;
      var fileNameParts = _.split(wysiwygFileImageAttachment.name, '.');
      if(fileNameParts.length > 1) {
         //append the extension file
         fileName +=  "." + fileNameParts[fileNameParts.length - 1];
      }
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.News.s3WysiwygFileImageAttachments.s3Bucket,
                          camaraApiConfig.News.s3WysiwygFileImageAttachments.s3Folder + "/" + fileName,
                          wysiwygFileImageAttachment.data,
                          wysiwygFileImageAttachment.data.length,
                          wysiwygFileImageAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file image uploaded',
               'originalFilename': wysiwygFileImageAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.News.s3WysiwygFileImageAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading file image of the news item, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadWysiwygFileVideoAttachment = function(req, res, next) {
   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No video files were uploaded.' });
   } else {
      var wysiwygFileVideoAttachment = req.files.file;
      var uuid = uuidModule.v4();
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //use the uuid as the file name
      var fileName = uuid;
      var fileNameParts = _.split(wysiwygFileVideoAttachment.name, '.');
      if(fileNameParts.length > 1) {
         //append the extension file
         fileName +=  "." + fileNameParts[fileNameParts.length - 1];
      }
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.News.s3WysiwygFileVideoAttachments.s3Bucket,
                          camaraApiConfig.News.s3WysiwygFileVideoAttachments.s3Folder + "/" + fileName,
                          wysiwygFileVideoAttachment.data,
                          wysiwygFileVideoAttachment.data.length,
                          wysiwygFileVideoAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file image uploaded',
               'originalFilename': wysiwygFileVideoAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.News.s3WysiwygFileVideoAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading file video of the news item, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadThumbnail = function(req, res, next) {
   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No files were uploaded.' });
   } else {
      var thumbnailFile = req.files.file;
      var uuid = req.params.uuid;
      if(!uuid) {
         Utils.sendJSONresponse(res, 400, { message: 'uuid required.' });
         return;
      }
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //use the uuid as the file name
      var fileName = uuid;
      var fileNameParts = _.split(thumbnailFile.name, '.');
      if(fileNameParts.length > 1) {
         //append the extension file
         fileName +=  "." + fileNameParts[fileNameParts.length - 1];
      }
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.News.s3Thumbnails.s3Bucket,
                          camaraApiConfig.News.s3Thumbnails.s3Folder + "/" + fileName,
                          thumbnailFile.data,
                          thumbnailFile.data.length,
                          thumbnailFile.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'file uploaded', 'filename': fileName });
         } else {
            winston.error("Error while uploading thumbnail file of the news item, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.deleteThumbnail = function(req, res, next) {
   if(req.params.fileName) {
      var thumbnailFile = req.params.fileName;
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //send the file to S3 server
      s3Client.removeObject( camaraApiConfig.News.s3Thumbnails.s3Bucket,
                             camaraApiConfig.News.s3Thumbnails.s3Folder + "/" + thumbnailFile,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'the file of the news item thumbnail was removed', 'filename': thumbnailFile });
         } else {
            winston.error("Error while removing the file of the news item thumbnail, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined file name of the news item thumbnail' });
   }
}

module.exports.getNews = function(req, res, next) {
   //pagination options
   var page = req.query.page ? parseInt(req.query.page) : 1;
   var pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
   var keywords = req.query.keywords ?  req.query.keywords : null;
   var date1 = req.query.date1 ?  req.query.date1 : null;
   var date2 = req.query.date2 ?  req.query.date2 : null;
   var publicationTypeFilter = req.query.publication ?  req.query.publication : "ALL";

   var _getTimeRemaining = function (newsItem) {
      if(newsItem.publicationDate) {
         var now = new Date();
         var remainingMilliseconds = newsItem.publicationDate.getTime() - now.getTime();
         if(remainingMilliseconds > 0) {
            var daysRemaining = Math.floor(remainingMilliseconds / (24 * 60 * 60 * 1000));
            remainingMilliseconds = remainingMilliseconds - daysRemaining * 24 * 60 * 60 * 1000;
            var hoursRemaining = Math.floor(remainingMilliseconds / (60 * 60 * 1000));
            remainingMilliseconds = remainingMilliseconds - hoursRemaining * 60 * 60 * 1000;
            var minutesRemaining = Math.ceil(remainingMilliseconds / (60 * 1000));
            return  {
               days: daysRemaining !== 0 ? daysRemaining : null,
               hours: hoursRemaining !== 0 ? hoursRemaining : null,
               minutes: minutesRemaining !== 0 ? minutesRemaining : null
            }
         } else {
            return null;
         }
      } else {
         return null;
      }
   }

   //filter options
   var filter = { };
   var filterAnd = [];
   var sortOptions = { publish: 1, publicationDate: -1, creationDate: -1, changedDate: -1 };
   filter['$and'] = filterAnd;

   var keywordsWords = [];
   var k;

   if (keywords) {
      filterAnd.push({ '$text': { '$search' : keywords } });
   }

   if(date1) {
      filterAnd.push({ 'publicationDate': { '$gte' : date1 } });
   }
   if(date2) {
      filterAnd.push({ 'publicationDate': { '$lte' : date2 } });
   }

   if(publicationTypeFilter) {
      var now = new Date();
      if (publicationTypeFilter === "ALL") {
         //do nothing
      } else if (publicationTypeFilter === "PUBLISHED") {
         //publication date must be before now
         filterAnd.push({ 'publish': true });
         filterAnd.push({ 'publicationDate': { '$lte' : now } });
      } else if (publicationTypeFilter === "TO_BE_PUBLISHED") {
         //publication date must be after now
         filterAnd.push({ 'publish': true });
         filterAnd.push({ 'publicationDate': { '$gte' : now } });
      } else if (publicationTypeFilter === "NOT_TO_BE_PUBLISHED") {
         //publication date must be marked as "NOT TO BE PUBLISHED"
         filterAnd.push({ 'publish': false });
      }
   }
   //if there is just one statement, then remove the "and" clausule
   if(filterAnd.length === 0) {
      filter = { };
   } else if(filterAnd.length === 1) {
      filter = filterAnd[0];
   }

   //id filter
   if(req.query.id) {
      filter = { _id : NewsItemModule.getMongoose().Types.ObjectId(req.query.id) }
   }
   NewsItem.count(filter).then(function(count) {
      if(count > 0) {
         if(page * pageSize - pageSize >= count) {
            page = Math.ceil(count / pageSize); //last page
         }
         return NewsItem.find(filter)
                 .sort(sortOptions)
                 .skip(page * pageSize - pageSize)
                 .limit(pageSize)
                 .then(function(news) {
                   var newsToSend = [];
                   var camaraApiConfig = config.get("CamaraApi");
                   var i;
                   for(i = 0; i < news.length; i++) {
                      var newsItem = {
                        'id': news[i]._id,
                        'title': news[i].title,
                        'headline': news[i].headline,
                        'publish': news[i].publish,
                        'publicationDate': news[i].publicationDate,
                        'thumbnailUrl': camaraApiConfig.News.s3Thumbnails.urlBase + "/" + news[i].thumbnailFile,
                        'creationDate': news[i].creationDate,
                        'changedDate': news[i].changedDate,
                        'views': news[i].views
                     };

                     //time remaining to the publication
                     newsItem.timeRemaining = _getTimeRemaining(newsItem);

                     newsToSend.push(newsItem);
                   }
                   return {
                      "news" : newsToSend,
                      "totalLength": count,
                      "page": page,
                      "pageSize": pageSize
                   };
                 });
      } else {
         return {
            "news" : [],
            "totalLength": 0,
            "page": 1,
            "pageSize": 1
         }
      }
   }).then(function(result) {
      Utils.sendJSONresponse(res, 200, result);
   }).catch(function(err) {
      winston.error("Error while getting news, err = [%s]", err);
      Utils.next(400, err, next);
   });
}

module.exports.getNewsItem = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.newsItemId) {
      NewsItem.findOne({ _id: NewsItemModule.getMongoose().Types.ObjectId(req.params.newsItemId) })
              .then( function(newsItem) {
         if(newsItem) {

            var newsItemToSend = {
                 '_id': newsItem._id,
                 'title': newsItem.title,
                 'headline': newsItem.headline,
                 'publish': newsItem.publish,
                 'publicationDate': newsItem.publicationDate,
                 'thumbnailFile': newsItem.thumbnailFile,
                 'thumbnailUrl': camaraApiConfig.News.s3Thumbnails.urlBase + "/" + newsItem.thumbnailFile,
                 'body': newsItem.body,
                 'creationDate': newsItem.creationDate,
                 'changedDate': newsItem.changedDate,
                 'views': newsItem.views,
                 'enableFacebookComments': newsItem.enableFacebookComments ? newsItem.enableFacebookComments : null,
                 'enableFacebookShareButton': newsItem.enableFacebookShareButton ? newsItem.enableFacebookShareButton : null
            };

            Utils.sendJSONresponse(res, 200, {
                "newsItem" : newsItemToSend
            });

         } else {
            Utils.sendJSONresponse(res, 404, { message: 'news item not found' });
         }
      }).catch(function(err) {
         winston.error("Error while getting news item, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined news item id' });
   }

}

module.exports.getIncrementNewsViews = function(req, res, next) {
   if(req.params.newsItemId) {
      NewsItem.findOne({ _id: req.params.newsItemId }).then( function(newsItem) {
         if(newsItem) {
            var views = newsItem.views;
            if(views && views > 0) {
               views = views + 1;
            } else {
               views = 1;
            }
            newsItem.views = views;
            newsItem.save(function(err, newsItemUpdate) {
               if(!err) {
                  winston.verbose("Views of the news item incremented.");
                  Utils.sendJSONresponse(res, 200, { message: 'views incremented', views: newsItemUpdate.views });
               } else {
                  winston.error("Error while incrementing views of the news item, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'news item not found' });
         }
      }).catch(function(err) {
         winston.error("Error while getting news item, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined news item id' });
   }

}
