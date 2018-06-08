/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var winston = require('winston');
var config = require('config');
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
var _io;
var _imageProcessingNSSetup = function(_imageProcessingNS) {
   _imageProcessingNS.on('connection', function(socket) {
      //************************************************************************
      //*************** resizeNewsThumbnail service ****************************
      //************************************************************************
      socket.on('resizeNewsThumbnail', function(params, done) {
         winston.verbose("Resize of the news item thumbnail was requested, fileName = [%s]", params.fileName);
         var camaraApiConfig = config.get("CamaraApi");
         ImageProcessingService
            .resizeImage( camaraApiConfig.News.s3Thumbnails.s3Folder + "/" + params.fileName,
                          camaraApiConfig.News.s3Thumbnails.width,
                          camaraApiConfig.News.s3Thumbnails.height, function(err) {
                             done(err);
                          });
      });
      //************************************************************************
      //***************** resizeBannerImage service ****************************
      //************************************************************************
      socket.on('resizeBannerImage', function(params, done) {
         winston.verbose("Resize of the banner image was requested, fileName = [%s]", params.fileName);
         var camaraApiConfig = config.get("CamaraApi");
         ImageProcessingService
            .resizeImage( camaraApiConfig.Banners.s3Banners.s3Folder + "/" + params.fileName,
                          camaraApiConfig.Banners.s3Banners.width,
                          camaraApiConfig.Banners.s3Banners.height, function(err) {
                             done(err);
                          });
      });
      //************************************************************************
      //*************** resizeBreakingNewsImage service ****************************
      //************************************************************************
      socket.on('resizeBreakingNewsImage', function(params, done) {
         winston.verbose("Resize of the breaking news news item image was requested, fileName = [%s]", params.fileName);
         var camaraApiConfig = config.get("CamaraApi");
         ImageProcessingService
            .resizeImage( camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + params.fileName,
                          camaraApiConfig.BreakingNews.s3BreakingNews.width,
                          camaraApiConfig.BreakingNews.s3BreakingNews.height, function(err) {
                             done(err);
                          });
      });
      //************************************************************************
      //*************** resizeFBreakingNewsImage service ****************************
      //************************************************************************
      socket.on('resizeFBreakingNewsImage', function(params, done) {
         winston.verbose("Resize of the fixed breaking news news item image was requested, fileName = [%s]", params.fileName);
         var camaraApiConfig = config.get("CamaraApi");
         ImageProcessingService
            .resizeImage( camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Folder + "/" + params.fileName,
                          params.width,
                          params.height,
                          function(err) {
                             done(err);
                          });
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
