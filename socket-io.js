/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var winston = require('winston');
var config = require('config');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var Util = require('./util/Utils.js');
var User = require('./models/User.js').getModel();
var ImageProcessingService = require('./services/ImageProcessingService.js');

/*****************************************************************************
********************************** CONFIG ************************************
******************************************************************************/
var camaraApiConfig = config.get("CamaraApi");
//log configuration
winston.setLevels(camaraApiConfig.Log.levels);
winston.addColors(camaraApiConfig.Log.levelsColors);
winston.configure({
    transports: [
      new (winston.transports.Console)({ colorize: true })
    ]
 });
winston.level = camaraApiConfig.Log.level;

/*****************************************************************************
********************************** PRIVATE ************************************
******************************************************************************/

//check if the user has the role
var _hasRole = async function(userId, roleName) {
   var _accessError = function() {
      throw Util.newUnauthorizedError();
   }

   var user = await User.findById(userId);

   if (user) {
      if(user.extendedRoles) {
         if(_.indexOf(user.extendedRoles, roleName) >= 0) {
            return true;
         } else {
            _accessError();
         }
      } else {
         _accessError();
      }
   } else {
      _accessError();
   }
}

var _io;
var _imageProcessingNSSetup = function(_imageProcessingNS) {
   _imageProcessingNS.on('connection', function(socket) {
      //************************************************************************
      //*************** resizeNewsThumbnail service ****************************
      //************************************************************************
      socket.on('resizeNewsThumbnail', async function(params, done) {
         winston.verbose("Resize of the news item thumbnail was requested, fileName = [%s]", params.fileName);
         var jwtToken = params.jwtToken;
         // check token
         try {
            if (jwtToken) {
               var decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET);
               //check privileges
               await _hasRole(decodedToken._id, 'WRITE_NEWS');
               //authentication ok
               var camaraApiConfig = config.get("CamaraApi");
               ImageProcessingService
                  .resizeImage( camaraApiConfig.News.s3Thumbnails.s3Folder + "/" + params.fileName,
                                camaraApiConfig.News.s3Thumbnails.width,
                                camaraApiConfig.News.s3Thumbnails.height, function(err) {
                                   done(err);
                                });
            } else {
               //token not found in soket parameters
               done({ message: "Token not found!" });
            }
         } catch(err) {
            // invalid token or user doesn't have the rights
            done({ message: err.message });
         }
      });

      //************************************************************************
      //***************** resizeBannerImage service ****************************
      //************************************************************************
      socket.on('resizeBannerImage', async function(params, done) {
         winston.verbose("Resize of the banner image was requested, fileName = [%s]", params.fileName);
         var jwtToken = params.jwtToken;
         // check token
         try {
            if (jwtToken) {
               var decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET);
               //check privileges
               await _hasRole(decodedToken._id, 'WRITE_BANNER');
               //authentication ok
               var camaraApiConfig = config.get("CamaraApi");
               ImageProcessingService
                  .resizeImage( camaraApiConfig.Banners.s3Banners.s3Folder + "/" + params.fileName,
                                camaraApiConfig.Banners.s3Banners.width,
                                camaraApiConfig.Banners.s3Banners.height, function(err) {
                                   done(err);
                                });
            } else {
               //token not found in soket parameters
               done({ message: "Token not found!" });
            }
         } catch(err) {
            // invalid token or user doesn't have the rights
            done({ message: err.message });
         }
      });

      //************************************************************************
      //*************** resizeBreakingNewsImage service ****************************
      //************************************************************************
      socket.on('resizeBreakingNewsImage', async function(params, done) {
         winston.verbose("Resize of the breaking news news item image was requested, fileName = [%s]", params.fileName);
         var jwtToken = params.jwtToken;
         // check token
         try {
            if (jwtToken) {
               var decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET);
               //check privileges
               await _hasRole(decodedToken._id, 'WRITE_BREAKINGNEWS');
               //authentication ok
               var camaraApiConfig = config.get("CamaraApi");
               ImageProcessingService
                  .resizeImage( camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + params.fileName,
                                camaraApiConfig.BreakingNews.s3BreakingNews.width,
                                camaraApiConfig.BreakingNews.s3BreakingNews.height, function(err) {
                                   done(err);
                                });
            } else {
               //token not found in soket parameters
               done({ message: "Token not found!" });
            }
         } catch(err) {
            // invalid token or user doesn't have the rights
            done({ message: err.message });
         }
      });
      //************************************************************************
      //*************** resizeFBreakingNewsImage service ****************************
      //************************************************************************
      socket.on('resizeFBreakingNewsImage', async function(params, done) {
         winston.verbose("Resize of the fixed breaking news news item image was requested, fileName = [%s]", params.fileName);
         var jwtToken = params.jwtToken;
         // check token
         try {
            if (jwtToken) {
               var decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET);
               //check privileges
               await _hasRole(decodedToken._id, 'WRITE_FIXED_BREAKINGNEWS');
               //authentication ok
               var camaraApiConfig = config.get("CamaraApi");
               ImageProcessingService
                  .resizeImage( camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Folder + "/" + params.fileName,
                                params.width,
                                params.height,
                                function(err) {
                                   done(err);
                                });
            } else {
               //token not found in soket parameters
               done({ message: "Token not found!" });
            }
         } catch(err) {
            // invalid token or user doesn't have the rights
            done({ message: err.message });
         }
      });
   });
}

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports = function(app) {
   _io = require('socket.io')(app);
   var _imageProcessingNS = _io.of("image-processing");
   _imageProcessingNSSetup(_imageProcessingNS);
   return _io;
}
