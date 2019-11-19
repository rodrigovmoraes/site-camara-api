/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Banner = require('../models/Banner.js').getModel();
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
module.exports.newBanner = function(req, res, next) {
   if(req.body.banner) {
      winston.debug("Saving new banner ...");

      //count the amount of banners
      Banner.count({}).then(function(count) {
         var bannerJSON = req.body.banner;

         var banner = new Banner();
         banner.type = bannerJSON.type;
         banner.imageFile = bannerJSON.imageFile;
         banner.access = bannerJSON.access;
         banner.order = count + 1;
         banner.save(function(err, savedBanner) {
            if(!err) {
               winston.verbose("New banner saved.");
               Utils.sendJSONresponse(res, 200, { message: 'new banner saved', id: savedBanner._id });
            } else {
               winston.error("Error while saving the new banner, err = [%s]", err);
               Utils.next(400, err, next);
            }
         });
      }).catch(function(err) {
         winston.error("Error while saving the new banner (counting the amount of banners), err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined banner' });
   }
}

module.exports.editBanner = function(req, res, next) {
   if(req.body.banner) {
      var bannerJSON = req.body.banner;

      Banner.findById({ _id: bannerJSON.id }).then( function(banner) {
         if (banner) {
            var now = new Date();

            banner.type = bannerJSON.type;
            banner.imageFile = bannerJSON.imageFile;
            banner.access = bannerJSON.access;

            winston.debug("Saving banner ...");

            banner.save(function(err, savedBanner) {
               if(!err) {
                  winston.verbose("Banner saved.");
                  Utils.sendJSONresponse(res, 200, { message: 'banner saved', id: savedBanner._id });
               } else {
                  winston.error("Error while saving the banner, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'banner not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined banner' });
   }
}

module.exports.getBanner = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.bannerId) {
      var bannerId = req.params.bannerId;
      var banner = null;
      var order = null;

      Banner.findById({ _id: bannerId }).then( function(retrivedBanner) {
         if(retrivedBanner) {
            var bannerToSend = {
              'id': retrivedBanner._id,
              'imageFileURL': camaraApiConfig.Banners.s3Banners.urlBase + "/" + retrivedBanner.imageFile,
              'imageFile' : retrivedBanner.imageFile,
              'access': retrivedBanner.access,
              'order': retrivedBanner.order,
              'type': retrivedBanner.type
            };
            Utils.sendJSONresponse(res, 200, { "banner" : bannerToSend });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'banner not found' });
         }
      }).catch(function(err) {
         winston.error("Error while getting the banner, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined banner id' });
   }
}

module.exports.getBanners = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");
   Banner.find({}).sort({ order: 'asc' }).then(function(banners) {
      if(banners) {
         var bannersToSend = [];
         var i;
         for(i = 0; i < banners.length; i++) {
            var bannerToSend = {
              'id': banners[i]._id,
              'imageFileURL': camaraApiConfig.Banners.s3Banners.urlBase + "/" + banners[i].imageFile,
              'imageFile' : banners[i].imageFile,
              'access': banners[i].access,
              'order': banners[i].order,
              'type': banners[i].type
           };
           bannersToSend.push(bannerToSend);
         }
         Utils.sendJSONresponse(res, 200, { 'banners' : bannersToSend });
      } else {
         Utils.sendJSONresponse(res, 200, { 'banners' : [] });
      }
   });
}

module.exports.uploadBannerImage = function(req, res, next) {
   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No files were uploaded.' });
   } else {
      var bannerImageFile = req.files.file;
      var uuid = req.params.uuid;
      if(!uuid) {
         Utils.sendJSONresponse(res, 400, { message: 'uuid required.' });
         return;
      }
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //use the uuid as the file name
      var fileName = uuid;
      var fileNameParts = _.split(bannerImageFile.name, '.');
      if (fileNameParts.length > 1) {
         //append the extension file
         fileName +=  "." + fileNameParts[fileNameParts.length - 1];
      }
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.Banners.s3Banners.s3Bucket,
                          camaraApiConfig.Banners.s3Banners.s3Folder + "/" + fileName,
                          bannerImageFile.data,
                          bannerImageFile.data.length,
                          bannerImageFile.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'file uploaded', 'filename': fileName });
         } else {
            winston.error("Error while uploading image file of the banner, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.deleteBannerImage = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.fileName) {
      var bannerImageFile = req.params.fileName;
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //send the file to S3 server
      s3Client.removeObject( camaraApiConfig.Banners.s3Banners.s3Bucket,
                             camaraApiConfig.Banners.s3Banners.s3Folder + "/" + bannerImageFile,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'the file of the banner was removed', 'filename': bannerImageFile });
         } else {
            winston.error("Error while removing the file of the banner was removed, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined file name of the banner' });
   }
}

module.exports.moveBannerUp = function(req, res, next) {
   if(req.params.bannerId) {
      var bannerId = req.params.bannerId;
      var banner = null;
      var order = null;

      Banner.findById({ _id: bannerId }).then( function(retrivedBanner) {
         banner = retrivedBanner;
         if (banner) {
            order = banner.order;
            if(order > 1) {
               //get the upper banner
               return Banner.findOne({ "order" : order - 1 });
            } else {
               return null;
            }
         } else {
            return null;
         }
      }).then(function(aboveBanner) {
         if(banner) {
            if(aboveBanner) {
               return Banner.bulkWrite([
                  {
                     updateOne: {
                        filter: { '_id': aboveBanner._id },
                        update: { 'order': order}
                     },
                 },{
                     updateOne: {
                        filter: { '_id': banner._id },
                        update: { 'order': order - 1}
                    }
                 }]);
            } else {
               return 1;
            }
         } else {
            return -1; //sign that the banner was not found
         }
      }).then(function(result) {
         if(result === -1) {
            Utils.sendJSONresponse(res, 400, { message: 'banner not found' });
         } else if(result === 1) {
            Utils.sendJSONresponse(res, 200, { message: 'the banner was kept in the same order' });
         } else {
            Utils.sendJSONresponse(res, 200, { 'message': 'the banner was moved up' });
         }
      }).catch(function(err) {
         winston.error("Error while moving the banner to up, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined banner id' });
   }
}

module.exports.moveBannerDown = function(req, res, next) {
   if(req.params.bannerId) {
      var bannerId = req.params.bannerId;
      var banner = null;
      var order = null;

      Banner.findById({ _id: bannerId }).then( function(retrivedBanner) {
         banner = retrivedBanner;
         if (banner) {
            order = banner.order;
            //get the below banner
            return Banner.findOne({ "order" : order + 1 });
         } else {
            return null;
         }
      }).then(function(belowBanner) {
         if(banner) {
            if(belowBanner) {
               return Banner.bulkWrite([
                  {
                     updateOne: {
                        filter: { '_id': belowBanner._id },
                        update: { 'order': order}
                     },
                 },{
                     updateOne: {
                        filter: { '_id': banner._id },
                        update: { 'order': order + 1}
                    }
                 }]);
            } else {
               return 1;
            }
         } else {
            return -1; //sign that the banner was not found
         }
      }).then(function(result) {
         if(result === -1) {
            Utils.sendJSONresponse(res, 400, { message: 'banner not found' });
         } else if(result === 1) {
            Utils.sendJSONresponse(res, 200, { message: 'the banner was kept in the same order' });
         } else {
            Utils.sendJSONresponse(res, 200, { 'message': 'the banner was moved down' });
         }
      }).catch(function(err) {
         winston.error("Error while moving the banner to up, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined banner id' });
   }
}

module.exports.removeBanner = function(req, res, next) {
   if(req.params.bannerId) {
      var bannerId = req.params.bannerId;

      Banner.findById({ _id: bannerId }).then(function(bannerToBeRemoved) {
         if(bannerToBeRemoved) {
            return bannerToBeRemoved.remove();
         } else {
            return null;
         }
      }).then(function(removedBanner) {
         if(removedBanner) {
            return Banner.find({ order: { $gt: removedBanner.order } });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'banner not found' });
            return -1; //sign that the banner was not found
         }
      }).then(function(bannersToBeMoved) {
         if(bannersToBeMoved !== -1) { //the banner was not found
            if(bannersToBeMoved) {
               var commands = [];
               bannersToBeMoved.forEach(function(bannerToBeMoved) {
                  commands.push({   'updateOne': {
                                       'filter': { '_id': bannerToBeMoved._id },
                                       'update': { 'order': bannerToBeMoved.order - 1 }
                                    }
                                });
               });
               if (commands.length) {
                  Banner.bulkWrite(commands);
               }
            }
            winston.verbose("Banner removed.");
            Utils.sendJSONresponse(res, 200, { message: 'banner removed' });
         }
      }).catch(function(err) {
         winston.error("Error while deleting the banner, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined banner id' });
   }
}
