/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var urlDownloadImage = "http://www.camarasorocaba.sp.gov.br/arquivos/fotos_noticias/";

var config = require('config');
var winston = require('winston');
var uuidModule = require('uuid');
var _ = require('lodash');
var _requestService = require('request');
var Minio = require('minio');
var MySQLDatabase = require('./MySQLDatabase');
var createUserScript = require('./createUser');
var NewsItemModule = require('../models/NewsItem.js');
var NewsItem = NewsItemModule.getModel();
var htmlToText = require('html-to-text');
var Jimp = require('jimp');
var fs = require("fs");

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');

var queryGetNews  = "SELECT n.cod_noticia as cod_noticia, " +
                    "       n.tit_noticia as tit_noticia, " +
                    "       n.dat_noticia as dat_noticia, " +
                    "       n.txt_noticia as txt_noticia, " +
                    "       n.str_foto as str_foto, " +
                    "       txt_chamada as txt_chamada " +             
                    "FROM   tb_noticia n " +
                    "WHERE  YEAR(dat_noticia) >= 2019 ";
/*****************************************************************************/
var _getContentType = function(extension) {
   if (extension) {
      if (extension.toLowerCase() === 'gif') {
         return "image/gif";
      } else if(extension.toLowerCase() === 'jpe') {
         return "image/jpeg";
      } else if(extension.toLowerCase() === 'jpeg') {
         return "image/jpeg";
      } else if(extension.toLowerCase() === 'jpg') {
         return "image/jpeg";
      } else if(extension.toLowerCase() === 'bmp') {
         return "image/bmp";
      } else {
         console.log("Content-type not found in the table, extension = [" + extension + "]")
         return "image/jpeg";
      }
   }
}
/*****************************************************************************/
var _putFile = function(fileBuffer, contentType, extension, width, height) {
   return new Promise(function(resolve, reject) {
      //convert buffer to Jimp image format
      Jimp.read(fileBuffer, function (err, image) {
         if(!err) {
           // do stuff with the image (if no exception)
           image.resize(width, height);

           image.getBuffer( image.getMIME(), function(err, resizedImageBuffer) {
              if (!err) {
                 var s3Client = new Minio.Client(config.CamaraApi.S3Configuration);
                 var fileName = uuidModule.v4() + "." + extension;
                 //send the file to S3 server
                 s3Client.putObject(  config.CamaraApi.News.s3Thumbnails.s3Bucket,
                                      config.CamaraApi.News.s3Thumbnails.s3Folder + "/" + fileName,
                                      resizedImageBuffer,
                                      resizedImageBuffer.length,
                                      image.getMIME()).then(function(etag) {
                                         resolve(fileName);
                                      }).catch(function (err) {
                                         reject(err);
                                      });
              } else {
                 winston.error("Error while resizing the image, err = [%s]", err);
                 reject(err);
              }
           });
         } else {
            winston.error("Error while converting image to Jimp image format, err = [%s]", err);
            reject(err);
         }
      });
   });
}
/*****************************************************************************/
var _getFileBuffer = function(strFoto) {
  return new Promise(function(resolve, reject) {
     var chuncks = [];
     _requestService
           .get(urlDownloadImage + strFoto)
           .on('data', function(chunk) {
              chuncks.push(chunk)
           }).on('end', function() {
              var buffer = Buffer.concat(chuncks);
              resolve(buffer);
           }).on('error', function(error) {
              reject(error);
           });
  });
}
//*****************************************************************************
var _migrate = async function(connection, newsItems) {
   var k;
   var newsItem;
   var fileBuffer;
   var extension;
   var contentType;
   var fileNameParts;
   var thumbnailFile;
   var total;
   var progress;
   var lastProgress = -1;
   var hasThumbnail = false;
   var thumbnailUrl = "";

   try {
      if (newsItems) {
         total = newsItems.length;
         for (k = 0; k < newsItems.length; k++) {
            if (newsItems[k].cod_noticia === 1173) { //drop agenda news
               continue;
            }
            if (newsItems[k].str_foto) {
               //get file buffer
               fileBuffer = await _getFileBuffer(newsItems[k].str_foto);
               fileNameParts = _.split(newsItems[k].str_foto, '.');
               extension = "";
               if (fileNameParts.length > 1) {
                  //append the extension file
                  extension = fileNameParts[fileNameParts.length - 1];
               }
               contentType = _getContentType(extension);
               thumbnailFile = await _putFile(fileBuffer, contentType, extension, config.CamaraApi.News.s3Thumbnails.width, config.CamaraApi.News.s3Thumbnails.height);
               hasThumbnail = true;
               thumbnailUrl = config.CamaraApi.News.s3Thumbnails.urlBase + "/" + thumbnailFile;
            } else {
               fileBuffer = fs.readFileSync("./migration/brasao.jpg", { flag: 'r' });
               extension = "jpg";
               contentType = _getContentType(extension);
               thumbnailFile = await _putFile(fileBuffer, contentType, extension, config.CamaraApi.News.s3Thumbnails.width, config.CamaraApi.News.s3Thumbnails.height);
               hasThumbnail = false;
            }

            newsItem = new NewsItem();
            newsItem.title = newsItems[k].tit_noticia;
            newsItem.headline = htmlToText.fromString(newsItems[k].txt_chamada);
            newsItem.views = 0;
            newsItem.publish = true;
            newsItem.publicationDate = newsItems[k].dat_noticia;
            newsItem.thumbnailFile = thumbnailFile;
            newsItem.creationDate = new Date();
            newsItem.changedDate = null;
            //set font-size to 18px
            newsItems[k].txt_noticia = newsItems[k].txt_noticia ? newsItems[k].txt_noticia.replace(/font\-size\:[\s0-9\.a-z]*\;/g, "font-size: 18px;") : "";
            newsItems[k].txt_noticia = newsItems[k].txt_noticia ? newsItems[k].txt_noticia.replace(/FONT\-SIZE\:[\s0-9\.a-z]*\;/g, "font-size: 18px;") : "";
            if (hasThumbnail) {
               newsItem.body = "<div><img src=\"" + thumbnailUrl + "\" style=\"margin: 30px 0px 10px 10px;\" width=\"200\" height=\"129\" align=\"right\" class=\"fr-dii fr-fir\"></div>" + newsItems[k].txt_noticia;
            } else {
               newsItem.body = newsItems[k].txt_noticia;
            }

            await newsItem.save();
            //show progress
            progress = Math.round(k / total * 100);
            if (progress % 1 === 0 && lastProgress !== progress) {
               console.log(progress + "%");
               lastProgress = progress;
            }
         }
      }
   } catch(error) {
      console.log("Error while migrating news items, err = [" + error + "].");
   }
}
/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.run = async function () {
   winston.info("************migrateNews");
   var connectionPool = MySQLDatabase.createConnectionPool({
            "host": "camarasorocaba.sp.gov.br",
            "user": "admin",
            "password": "PnbdpC725",
            "database": "noticia",
            "queueLimit": 50,
            "connectionLimit": 50
   });

   var connection;
   var filesCount;
   return MySQLDatabase
            .openConnection(connectionPool).then(function(pconnection) {
               connection = pconnection;
               return MySQLDatabase.query(connection, queryGetNews);
            }).then(function(newsItems) {
               return _migrate(connection, newsItems);
            }).catch(function(error) {
               console.log("Error while migrating news items, err = [" + error + "].");
            });
}
