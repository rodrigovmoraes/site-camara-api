/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Minio = require('minio');
var config = require('config');
var uuidModule = require('uuid');
var LegislativePropositionModule = require('../models/LegislativeProposition.js');
var LegislativeProposition = LegislativePropositionModule.getModel();
var LegislativePropositionTypeModule = require('../models/LegislativePropositionType.js');
var LegislativePropositionType = LegislativePropositionTypeModule.getModel();
var LegislativePropositionTagModule = require('../models/LegislativePropositionTag.js');
var LegislativePropositionTag = LegislativePropositionTagModule.getModel();
var LegislativePropositionFileAttachmentModule = require('../models/LegislativePropositionFileAttachment.js');
var LegislativePropositionFileAttachment = LegislativePropositionFileAttachmentModule.getModel();
var LegislativePropositionRemovedModule = require('../models/LegislativePropositionRemoved.js');
var LegislativePropositionRemoved = LegislativePropositionRemovedModule.getModel();
var Utils = require('../util/Utils.js');
var _ = require('lodash');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.newLegislativeProposition = function(req, res, next) {
   if(!req.payload) {
      Utils.sendJSONresponse(res, 403, { message: 'you must be logged in' });
   } else if(req.body.legislativeProposition) {
      var legislativePropositionJSON = req.body.legislativeProposition;

      var legislativeProposition = new LegislativeProposition();
      var now = new Date();

      legislativeProposition.type = legislativePropositionJSON.type;
      legislativeProposition.number = legislativePropositionJSON.number;
      legislativeProposition.date = legislativePropositionJSON.date;
      var legislativePropositionDate = new Date(legislativeProposition.date);
      legislativeProposition.year = legislativePropositionDate.getFullYear();
      legislativeProposition.description = legislativePropositionJSON.description;
      legislativeProposition.text = legislativePropositionJSON.text;
      legislativeProposition.textAttachment = legislativePropositionJSON.textAttachment;
      legislativeProposition.tags = legislativePropositionJSON.tags;
      legislativeProposition.consolidatedText = legislativePropositionJSON.consolidatedText;
      legislativeProposition.consolidatedTextAttachment = legislativePropositionJSON.consolidatedTextAttachment;
      legislativeProposition.relationships = legislativePropositionJSON.relationships;
      legislativeProposition.fileAttachments = legislativePropositionJSON.fileAttachments;
      legislativeProposition.consolidatedFileAttachments = legislativePropositionJSON.consolidatedFileAttachments;
      legislativeProposition.legislativeProcessId = legislativePropositionJSON.legislativeProcessId ? legislativePropositionJSON.legislativeProcessId : null;
      legislativeProposition.creationDate = now;
      legislativeProposition.changedDate = null;
      legislativeProposition.creationUser = req.payload._id;
      legislativeProposition.changeUser = null;

      winston.debug("Saving legislative proposition ...");

      legislativeProposition.save(function(err, legislativeProposition) {
         if(!err) {
            winston.verbose("LegislativeProposition saved.");
            Utils.sendJSONresponse(res, 200, { message: 'legislative proposition saved',
                                               id: legislativeProposition._id });
         } else {
            winston.error("Error while saving the legislative proposition, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition' });
   }
}

module.exports.editLegislativeProposition = function(req, res, next) {
   if(!req.payload) {
      Utils.sendJSONresponse(res, 403, { message: 'you must be logged in' });
   } else if(req.body.legislativeProposition) {
      var legislativePropositionJSON = req.body.legislativeProposition;

      LegislativeProposition
               .findById({ _id: legislativePropositionJSON.id })
               .then( function(legislativeProposition) {
         if(legislativeProposition) {
            legislativeProposition.date = legislativePropositionJSON.date;
            var legislativePropositionDate = new Date(legislativeProposition.date);
            legislativeProposition.year = legislativePropositionDate.getFullYear();
            legislativeProposition.description = legislativePropositionJSON.description;
            legislativeProposition.text = legislativePropositionJSON.text;
            legislativeProposition.textAttachment = legislativePropositionJSON.textAttachment;
            legislativeProposition.tags = legislativePropositionJSON.tags;
            legislativeProposition.consolidatedText = legislativePropositionJSON.consolidatedText;
            legislativeProposition.consolidatedTextAttachment = legislativePropositionJSON.consolidatedTextAttachment;
            legislativeProposition.legislativeProcessId = legislativePropositionJSON.legislativeProcessId ? legislativePropositionJSON.legislativeProcessId : null;
            legislativeProposition.relationships = legislativePropositionJSON.relationships;
            legislativeProposition.fileAttachments = legislativePropositionJSON.fileAttachments;
            legislativeProposition.consolidatedFileAttachments = legislativePropositionJSON.consolidatedFileAttachments;
            legislativeProposition.legislativePropositionId = legislativePropositionJSON.legislativeProcessId ? legislativePropositionJSON.legislativeProcessId : null;
            legislativeProposition.changedDate = new Date();
            legislativeProposition.changeUser = req.payload._id;

            winston.debug("Saving legislative proposition ...");

            legislativeProposition.save(function(err, savedLegislativeProposition) {
               if(!err) {
                  winston.verbose("LegislativeProposition saved.");
                  Utils.sendJSONresponse(res, 200, { message: 'legislative proposition saved', id: legislativeProposition._id });
               } else {
                  winston.error("Error while saving the legislative proposition, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'legislative proposition not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition' });
   }
}

module.exports.removeLegislativeProposition = function(req, res, next) {
   if(!req.payload) {
      Utils.sendJSONresponse(res, 403, { message: 'you must be logged in' });
   } else if(req.params.legislativePropositionId) {
      var legislativePropositionId = req.params.legislativePropositionId;
      LegislativeProposition
               .findById({ _id: legislativePropositionId })
               .then( function(legislativeProposition) {
         if (legislativeProposition) {
            var legislativePropositionRemoved = new LegislativePropositionRemoved();

            legislativePropositionRemoved.legislativePropositionId = legislativeProposition._id;
            legislativePropositionRemoved.type = legislativeProposition.type;
            legislativePropositionRemoved.number = legislativeProposition.number;
            legislativePropositionRemoved.date = legislativeProposition.date;
            legislativePropositionRemoved.year = legislativeProposition.year;
            legislativePropositionRemoved.description = legislativeProposition.description;
            legislativePropositionRemoved.text = legislativeProposition.text;
            legislativePropositionRemoved.textAttachment = legislativeProposition.textAttachment;
            legislativePropositionRemoved.tags = legislativeProposition.tags;
            legislativePropositionRemoved.consolidatedText = legislativeProposition.consolidatedText;
            legislativePropositionRemoved.consolidatedTextAttachment = legislativeProposition.consolidatedTextAttachment;
            legislativePropositionRemoved.relationships = legislativeProposition.relationships;
            legislativePropositionRemoved.fileAttachments = legislativeProposition.fileAttachments;
            legislativePropositionRemoved.consolidatedFileAttachments = legislativeProposition.consolidatedFileAttachments;
            legislativePropositionRemoved.creationDate = legislativeProposition.creationDate;
            legislativePropositionRemoved.creationUser = legislativeProposition.creationUser;
            legislativePropositionRemoved.changedDate = legislativeProposition.changedDate;
            legislativePropositionRemoved.changeUser = legislativeProposition.changeUser;
            legislativePropositionRemoved.removeDate = new Date();
            legislativePropositionRemoved.removeUser = req.payload._id;

            winston.debug("Saving legislative proposition ...");

            legislativePropositionRemoved
               .save()
               .then(function(savedLegislativeProposition) {
                  return legislativeProposition.remove();
               }).then(function(removedLegislativePropositiond) {
                  winston.verbose("LegislativeProposition removed.");
                  Utils.sendJSONresponse(res, 200, { message: 'legislative proposition removed', id: legislativeProposition._id });
               }).catch(function(err) {
                  winston.error("Error while removing the legislative proposition, err = [%s]", err);
                  Utils.next(400, err, next);
               });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'legislative proposition not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition id' });
   }
}

module.exports.getLegislativePropositions = function(req, res, next) {
   //pagination options
   var page = req.query.page ? parseInt(req.query.page) : 1;
   var pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
   var keywords = req.query.keywords ?  req.query.keywords : null;
   var number = req.query.number ?  parseInt(req.query.number) : null;
   var year = req.query.year ?  parseInt(req.query.year) : null;
   var date1 = req.query.date1 ?  req.query.date1 : null;
   var date2 = req.query.date2 ?  req.query.date2 : null;
   var type = req.query.type ?  req.query.type : null;
   var tag = req.query.tag ?  req.query.tag : null;
   var sortField = req.query.sort ?  req.query.sort : null;
   var sortDirection = req.query.sortDirection ?  req.query.sortDirection : 1;
   var sortOptions = { date: -1,
                       creationDate: -1,
                       changedDate: -1 }

   //filter options
   var filter = { };
   var filterAnd = [];
   var k;

   filter['$and'] = filterAnd;

   if (keywords) {
      filterAnd.push({ '$text': { '$search' : keywords } });
   }
   if(number && number > 0) {
      filterAnd.push({ 'number': number });
   }
   if(year && year > 0) {
      filterAnd.push({ 'year': year });
   }
   if(date1) {
      filterAnd.push({ 'date': { '$gte' : date1 } });
   }
   if(date2) {
      filterAnd.push({ 'date': { '$lte' : date2 } });
   }
   if(type) {
      filterAnd.push({ 'type' : LegislativePropositionTypeModule.getMongoose().Types.ObjectId(type) });
   }
   if(tag) {
      filterAnd.push({ 'tags' : { "$in" : [ LegislativePropositionTagModule.getMongoose().Types.ObjectId(tag) ]} });
   }
   //set sort options
   if(sortField) {
      if(sortField === 'number') {
         sortOptions = { 'number': sortDirection,
                         'creationDate': sortDirection };
      } else if(sortField === 'date') {
         sortOptions = { 'date': sortDirection,
                         'creationDate': sortDirection,
                         'changedDate': sortDirection };
      } else if(sortField === 'changedDate') {
         sortOptions = { 'changedDate': sortDirection,
                         'date': sortDirection,
                         'creationDate': sortDirection };
      } else if(sortField === 'type') {
         sortOptions = { 'type': sortDirection,
                         'creationDate': sortDirection };
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
      filter = { _id : LegislativePropositionModule.getMongoose().Types.ObjectId(req.query.id) }
   }

   var typesMap = {};

   LegislativePropositionType.find({}).then(function(types) {
      if (types) {
         var i;
         for(i = 0; i < types.length; i++) {
            var type = types[i];
            typesMap[type._id] = type.description;
         }
      }
      return LegislativeProposition.count(filter);
   }).then(function(count) {
      if(count > 0) {
         if(page * pageSize - pageSize >= count) {
            page = Math.ceil(count / pageSize); //last page
         }
         //set sort by text search score if keywords was used in the request
         if(keywords) {
            sortOptions = _.merge({ score: { $meta : "textScore" } }, sortOptions);
         }
         return LegislativeProposition.find(filter, { score : { $meta: "textScore" } })
                 .sort(sortOptions)
                 .skip(page * pageSize - pageSize)
                 .limit(pageSize)
                 .then(function(legislativePropositions) {
                      var returnLegislativePropositions = [];
                      if(legislativePropositions) {
                         var i;
                         for(i = 0; i < legislativePropositions.length; i++) {
                            var legislativeProposition = legislativePropositions[i];
                            returnLegislativePropositions.push({
                               '_id' : legislativeProposition._id,
                               'number' : legislativeProposition.number,
                               'year' : legislativeProposition.year,
                               'description' : legislativeProposition.description,
                               'date' : legislativeProposition.date,
                               'creationDate' : legislativeProposition.creationDate,
                               'changedDate' : legislativeProposition.changedDate,
                               'typeId' : legislativeProposition.type,
                               'typeDescription' : typesMap[legislativeProposition.type] ? typesMap[legislativeProposition.type] : ''
                            });
                         }
                      }

                      return {
                         "legislativePropositions" : returnLegislativePropositions,
                         "totalLength": count,
                         "page": page,
                         "pageSize": pageSize
                      };
                 });
      } else {
         return {
            "legislativePropositions" : [],
            "totalLength": 0,
            "page": 1,
            "pageSize": 1
         }
      }
   }).then(function(result) {
      Utils.sendJSONresponse(res, 200, result);
   }).catch(function(err) {
      winston.error("Error while getting legislative propositions, err = [%s]", err);
      Utils.next(400, err, next);
   });
}

module.exports.getLegislativeProposition = function(req, res, next) {
   var search;
   if (req.params.legislativePropositionId) {
      LegislativeProposition.findOne({ _id: LegislativePropositionModule.getMongoose().Types.ObjectId(req.params.legislativePropositionId) })
               .populate({
                   path: 'relationships.type'
               })
               .populate({
                   path: 'relationships.otherLegislativeProposition'
               })
               .populate({
                   path: 'type'
               })
               .populate({
                   path: 'tags'
               })
               .populate({
                   path: 'fileAttachments'
               })
               .populate({
                   path: 'consolidatedFileAttachments'
               })
               .then( function(legislativeProposition) {
                  if(legislativeProposition) {
                     Utils.sendJSONresponse(res, 200, {
                         "legislativeProposition" : legislativeProposition
                     });
                  } else {
                     Utils.sendJSONresponse(res, 400, { message: 'legislative proposition not found' });
                  }
               }).catch(function(err) {
                  winston.error("Error while getting legislative proposition, err = [%s]", err);
                  Utils.next(400, err, next);
               });
   } else if (req.query.number && req.query.typeCode) {
      LegislativePropositionType
         .findOne({ code: req.query.typeCode })
         .then(function(legislativePropositionType) {
            if (legislativePropositionType) {
               LegislativeProposition
                  .findOne({ number: req.query.number,type: legislativePropositionType })
                  .populate({
                      path: 'relationships.type'
                  })
                  .populate({
                      path: 'relationships.otherLegislativeProposition'
                  })
                  .populate({
                      path: 'type'
                  })
                  .populate({
                      path: 'tags'
                  })
                  .populate({
                      path: 'fileAttachments'
                  })
                  .populate({
                      path: 'consolidatedFileAttachments'
                  })
                  .then( function(legislativeProposition) {
                     if(legislativeProposition) {
                        Utils.sendJSONresponse(res, 200, {
                            "legislativeProposition" : legislativeProposition
                        });
                     } else {
                        Utils.sendJSONresponse(res, 400, { message: 'legislative proposition not found' });
                     }
                  });
            } else {
               Utils.sendJSONresponse(res, 400, { message: 'legislative proposition type not found' });
            }
         });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition id' });
   }
}

module.exports.uploadWysiwygTextFileAttachment = function(req, res, next) {
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
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3WysiwygTextFileAttachments.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3WysiwygTextFileAttachments.s3Folder + "/" + fileName,
                          wysiwygFileAttachment.data,
                          wysiwygFileAttachment.data.length,
                          wysiwygFileAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file uploaded',
               'originalFilename': wysiwygFileAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.LegislativeProposition.s3WysiwygTextFileAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading wysiwyg file attachment of the legislative proposition text, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadWysiwygTextFileImageAttachment = function(req, res, next) {
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
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3WysiwygTextFileImageAttachments.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3WysiwygTextFileImageAttachments.s3Folder + "/" + fileName,
                          wysiwygFileImageAttachment.data,
                          wysiwygFileImageAttachment.data.length,
                          wysiwygFileImageAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file image uploaded',
               'originalFilename': wysiwygFileImageAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.LegislativeProposition.s3WysiwygTextFileImageAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading wysiwyg file image attachment of the legislative proposition text, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadWysiwygTextAttachmentFileAttachment = function(req, res, next) {
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
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3WysiwygTextAttachmentFileAttachments.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3WysiwygTextAttachmentFileAttachments.s3Folder + "/" + fileName,
                          wysiwygFileAttachment.data,
                          wysiwygFileAttachment.data.length,
                          wysiwygFileAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file uploaded',
               'originalFilename': wysiwygFileAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.LegislativeProposition.s3WysiwygTextAttachmentFileAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading wysiwyg file attachment of the legislative proposition text attachment, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadWysiwygTextAttachmentFileImageAttachment = function(req, res, next) {
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
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3WysiwygTextAttachmentFileImageAttachments.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3WysiwygTextAttachmentFileImageAttachments.s3Folder + "/" + fileName,
                          wysiwygFileImageAttachment.data,
                          wysiwygFileImageAttachment.data.length,
                          wysiwygFileImageAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file image uploaded',
               'originalFilename': wysiwygFileImageAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.LegislativeProposition.s3WysiwygTextAttachmentFileImageAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading wysiwyg file image attachment of the legislative proposition text attachment, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadWysiwygConsolidatedTextFileAttachment = function(req, res, next) {
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
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextFileAttachments.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextFileAttachments.s3Folder + "/" + fileName,
                          wysiwygFileAttachment.data,
                          wysiwygFileAttachment.data.length,
                          wysiwygFileAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file uploaded',
               'originalFilename': wysiwygFileAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextFileAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading wysiwyg file attachment of the legislative proposition consolidated text, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadWysiwygConsolidatedTextFileImageAttachment = function(req, res, next) {
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
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextFileImageAttachments.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextFileImageAttachments.s3Folder + "/" + fileName,
                          wysiwygFileImageAttachment.data,
                          wysiwygFileImageAttachment.data.length,
                          wysiwygFileImageAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file image uploaded',
               'originalFilename': wysiwygFileImageAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextFileImageAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading wysiwyg file image attachment of the legislative proposition consolidated text, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadWysiwygConsolidatedTextAttachmentFileAttachment = function(req, res, next) {
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
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextAttachmentFileAttachments.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextAttachmentFileAttachments.s3Folder + "/" + fileName,
                          wysiwygFileAttachment.data,
                          wysiwygFileAttachment.data.length,
                          wysiwygFileAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file uploaded',
               'originalFilename': wysiwygFileAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextAttachmentFileAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading wysiwyg file attachment of the legislative proposition consolidated text attachment, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadWysiwygConsolidatedTextAttachmentFileImageAttachment = function(req, res, next) {
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
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextAttachmentFileImageAttachments.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextAttachmentFileImageAttachments.s3Folder + "/" + fileName,
                          wysiwygFileImageAttachment.data,
                          wysiwygFileImageAttachment.data.length,
                          wysiwygFileImageAttachment.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, {
               'message': 'file image uploaded',
               'originalFilename': wysiwygFileImageAttachment.name,
               'filename': fileName,
               'link': camaraApiConfig.LegislativeProposition.s3WysiwygConsolidatedTextAttachmentFileImageAttachments.urlBase + "/" + fileName
            });
         } else {
            winston.error("Error while uploading wysiwyg file image attachment of the legislative proposition consolidated text attachment, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.getLegislativePropositionByNumber = function(req, res, next) {
   if(req.params.legislativePropositionTypeId) {
      if(req.params.number) {
         var legislativePropositionTypeId = req.params.legislativePropositionTypeId;
         var number = req.params.number;
         LegislativeProposition
            .findOne({ 'type': LegislativePropositionTypeModule.getMongoose().Types.ObjectId(legislativePropositionTypeId),
                       'number': number })
            .then(function(legislativeProposition) {
                  if(legislativeProposition) {
                     Utils.sendJSONresponse(res, 200, {
                        'legislativeProposition': legislativeProposition
                     });
                  } else {
                     Utils.sendJSONresponse(res, 200, {
                        'legislativeProposition': null
                     });
                  }
            }).catch(function(err) {
               winston.error("Error while getting legislative proposition by number, err = [%s]", err);
               Utils.next(400, err, next);
            });
      } else {
         Utils.sendJSONresponse(res, 400, { message: 'undefined number' });
      }
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition type id' });
   }
}

module.exports.checkUniqueNumber = function(req, res, next) {
   if(req.params.legislativePropositionTypeId) {
      if(req.params.number) {
         var legislativePropositionTypeId = req.params.legislativePropositionTypeId;
         var number = req.params.number;
         LegislativeProposition
            .count({ 'type': LegislativePropositionTypeModule.getMongoose().Types.ObjectId(legislativePropositionTypeId),
                     'number': number })
            .exec()
            .then(function(result) {
               if(result > 0) {
                     Utils.sendJSONresponse(res, 200, { exists: true });
               } else {
                     Utils.sendJSONresponse(res, 200, { exists: false });
               }
            }).catch(function(err) {
               winston.error("Error while checking unique number, err = [%s]", err);
               Utils.next(400, err, next);
            });
      } else {
         Utils.sendJSONresponse(res, 400, { message: 'undefined number' });
      }
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition type id' });
   }
}

module.exports.getNextNumberOfTheType = function(req, res, next) {
   if(req.params.legislativePropositionTypeId) {
      var legislativePropositionTypeId = req.params.legislativePropositionTypeId;

      LegislativeProposition
         .aggregate([
           { $match : { 'type' : LegislativePropositionTypeModule.getMongoose().Types.ObjectId(legislativePropositionTypeId) } },
           {
               $group:
               {
                    _id: "$type",
                    maxNumber: { $max: "$number" }
               }
           }
         ])
         .then(function(result) {
               if(result.length > 0) {
                     Utils.sendJSONresponse(res, 200, { 'nextNumber': result[0].maxNumber + 1 });
               } else {
                     Utils.sendJSONresponse(res, 200, { 'nextNumber': 1 });
               }
      });

   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition type id' });
   }
}

module.exports.newAttachmentFile = function(req, res, next) {
   if(req.body.legislativePropositionAttachment) {
      var legislativePropositionAttachmentJSON = req.body.legislativePropositionAttachment;

      var legislativePropositionAttachment = new LegislativePropositionFileAttachment();

      legislativePropositionAttachment.file = legislativePropositionAttachmentJSON.file;
      legislativePropositionAttachment.originalFilename = legislativePropositionAttachmentJSON.originalFilename;
      legislativePropositionAttachment.contentType = legislativePropositionAttachmentJSON.contentType;
      legislativePropositionAttachment.legislativeProposition = legislativePropositionAttachmentJSON.legislativeProposition;
      legislativePropositionAttachment.consolidatedFileAttachment = legislativePropositionAttachmentJSON.consolidatedFileAttachment;

      winston.debug("Saving legislative proposition file attachment...");

      legislativePropositionAttachment.save(function(err, savedLegislativePropositionAttachment) {
         if(!err) {
            winston.verbose("Legislative proposition file attachment saved.");
            Utils.sendJSONresponse(res, 200, { message: 'legislative proposition file attachment  saved',
                                               id: savedLegislativePropositionAttachment._id });
         } else {
            winston.error("Error while saving the legislative proposition file attachment, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition file attachment ' });
   }
}

module.exports.uploadAttachmentFile = function(req, res, next) {
   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No files were uploaded.' });
   } else {
      var attachmentFile = req.files.file;
      var uuid = req.params.uuid;
      if(!uuid) {
         Utils.sendJSONresponse(res, 400, { message: 'uuid required.' });
         return;
      }
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //use the uuid as the file name
      var fileName = uuid;
      var fileNameParts = _.split(attachmentFile.name, '.');
      if (fileNameParts.length > 1) {
         //append the extension file
         fileName +=  "." + fileNameParts[fileNameParts.length - 1];
      }
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3LegislativePropositionAttachment.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3LegislativePropositionAttachment.s3Folder + "/" + fileName,
                          attachmentFile.data,
                          attachmentFile.data.length,
                          attachmentFile.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'file uploaded',
                                               'filename': fileName,
                                               'contentType': attachmentFile.mimetype
                                             });
         } else {
            winston.error("Error while uploading file of the legislative proposition attachment, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.uploadConsolidatedAttachmentFile = function(req, res, next) {
   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No files were uploaded.' });
   } else {
      var attachmentFile = req.files.file;
      var uuid = req.params.uuid;
      if(!uuid) {
         Utils.sendJSONresponse(res, 400, { message: 'uuid required.' });
         return;
      }
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //use the uuid as the file name
      var fileName = uuid;
      var fileNameParts = _.split(attachmentFile.name, '.');
      if (fileNameParts.length > 1) {
         //append the extension file
         fileName +=  "." + fileNameParts[fileNameParts.length - 1];
      }
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3LegislativePropositionConsolidatedAttachment.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3LegislativePropositionConsolidatedAttachment.s3Folder + "/" + fileName,
                          attachmentFile.data,
                          attachmentFile.data.length,
                          attachmentFile.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'file uploaded',
                                               'filename': fileName,
                                               'contentType': attachmentFile.mimetype
                                             });
         } else {
            winston.error("Error while uploading file of the legislative proposition consolidated attachment, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.downloadLegislativePropositionFileAttachment = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.legislativePropositionFileAttachmentId) {
      LegislativePropositionFileAttachment
            .findOne({ _id: LegislativePropositionFileAttachmentModule.getMongoose().Types.ObjectId(req.params.legislativePropositionFileAttachmentId) })
            .then( function(legislativePropositionFileAttachment) {
               if(legislativePropositionFileAttachment) {
                  var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
                  s3Client.getObject( legislativePropositionFileAttachment.consolidatedFileAttachment
                                                ? camaraApiConfig.LegislativeProposition.s3LegislativePropositionConsolidatedAttachment.s3Bucket
                                                : camaraApiConfig.LegislativeProposition.s3LegislativePropositionAttachment.s3Bucket,
                                                legislativePropositionFileAttachment.consolidatedFileAttachment
                                                       ? camaraApiConfig.LegislativeProposition.s3LegislativePropositionConsolidatedAttachment.s3Folder + "/" + legislativePropositionFileAttachment.file
                                                       : camaraApiConfig.LegislativeProposition.s3LegislativePropositionAttachment.s3Folder + "/" + legislativePropositionFileAttachment.file,

                  function(err, dataStream) {
                     if (!err) {
                        res.set({
                          'Content-Type': legislativePropositionFileAttachment.contentType,
                          'Content-Length': dataStream.headers['content-length'],
                          'Content-Disposition': 'inline; filename="' + legislativePropositionFileAttachment.originalFilename + '"'
                        });
                        var buffers = [];
                        var bufferLength = 0;
                        dataStream.on('data', function(chunk) {
                           buffers.push(chunk);
                           bufferLength += chunk.length;
                        });
                        dataStream.on('end', function() {
                           var dataFile = Buffer.concat(buffers, bufferLength);
                           res.send(dataFile);
                        });
                        dataStream.on('error', function(err) {
                           winston.error("Error while downloading proposition file attachment, err = [%s]", err);
                        });
                     } else {
                        winston.error("Error while downloading proposition file attachment , err = [%s]", err);
                        Utils.next(400, err, next);
                     }
                  });
               } else {
                  Utils.sendJSONresponse(res, 400, { message: 'proposition file attachment not found' });
               }
            }).catch(function(err) {
               winston.error("Error while downloading proposition file attachment [getting proposition file attachment object], err = [%s]", err);
               Utils.next(400, err, next);
            });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined proposition file attachment id' });
   }
}

module.exports.deleteFileAttachment = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.legislativePropositionFileAttachmentId) {
      LegislativePropositionFileAttachment
            .findOne({ _id: LegislativePropositionFileAttachmentModule.getMongoose().Types.ObjectId(req.params.legislativePropositionFileAttachmentId) })
            .then( function(legislativePropositionFileAttachment) {
               if(legislativePropositionFileAttachment) {
                  var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
                  //send the file to S3 server
                  s3Client.removeObject( legislativePropositionFileAttachment.consolidatedFileAttachment
                                                ? camaraApiConfig.LegislativeProposition.s3LegislativePropositionConsolidatedAttachment.s3Bucket
                                                : camaraApiConfig.LegislativeProposition.s3LegislativePropositionAttachment.s3Bucket,
                                         legislativePropositionFileAttachment.consolidatedFileAttachment
                                                ? camaraApiConfig.LegislativeProposition.s3LegislativePropositionConsolidatedAttachment.s3Folder + "/" + legislativePropositionFileAttachment.file
                                                : camaraApiConfig.LegislativeProposition.s3LegislativePropositionAttachment.s3Folder + "/" + legislativePropositionFileAttachment.file,
                  function(err, etag) {
                     if(!err) {
                        Utils.sendJSONresponse(res, 200, { 'message': 'the file of the proposition file attachment was removed', 'filename': legislativePropositionFileAttachment.file });
                     } else {
                        winston.error("Error while removing the file of the proposition file attachment, err = [%s]", err);
                        Utils.next(400, err, next);
                     }
                  });
               } else {
                  Utils.sendJSONresponse(res, 400, { message: 'proposition file attachment not found' });
               }
            }).catch(function(err) {
               winston.error("Error while downloading proposition file attachment [getting proposition file attachment object], err = [%s]", err);
               Utils.next(400, err, next);
            });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined proposition file attachment id' });
   }
}
