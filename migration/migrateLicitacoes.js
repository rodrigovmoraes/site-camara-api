/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var urlDownloadLicitacaoEventFile = "http://www.camarasorocaba.sp.gov.br/sitecamara/licitacao/downloadarquivoevento";

var config = require('config');
var winston = require('winston');
var uuidModule = require('uuid');
var _ = require('lodash');
var _requestService = require('request');
var Minio = require('minio');
var MySQLDatabase = require('./MySQLDatabase');
var createUserScript = require('./createUser');
var LicitacaoModule = require('../models/Licitacao.js');
var Licitacao = LicitacaoModule.getModel();
var LicitacaoCategoryModule = require('../models/LicitacaoCategory.js');
var LicitacaoCategory = LicitacaoCategoryModule.getModel();
var LicitacaoEventModule = require('../models/LicitacaoEvent.js');
var LicitacaoEvent = LicitacaoEventModule.getModel();
var fs = require("fs");

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');
var licitacaoCategoryMap = {};

var queryLicitacaoCategories = "SELECT cod_modalidade, " +
                               "       desc_modalidade " +
                               "FROM   tb_modalidade ";

var queryLicitacaoEvents = "SELECT  cod_evento, " +
                           "        desc_evento, " +
                           "        dat_evento, " +
                           "        str_arquivo, " +
                           "        cod_modalidade, " +
                           "        num_licitacao, " +
                           "        int_anolicitacao " +
                           "FROM    tb_evento " +
                           "WHERE   num_licitacao = ? " +
                           "AND     int_anolicitacao = ? " +
                           "AND     cod_modalidade = ? " +
                           "ORDER   BY  dat_evento ASC ";

var queryLicitacoes = "SELECT  num_licitacao, " +
                      "        cod_modalidade, " +
                      "        int_anolicitacao, " +
                      "        txt_objetolicitacao " +
                      "FROM    tb_licitacao ";
//*****************************************************************************
var _getContentType = function(extension) {
   if (extension) {
      if (extension.toLowerCase() === 'txt') {
         return "text/plain";
      } else if(extension.toLowerCase() === 'pdf') {
         return "application/pdf";
      } else if(extension.toLowerCase() === 'doc') {
         return "application/msword";
      } else if(extension.toLowerCase() === 'docx') {
         return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if(extension.toLowerCase() === 'xls') {
         return "application/vnd.ms-excel";
      } else if(extension.toLowerCase() === 'xlsx') {
         return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if(extension.toLowerCase() === 'zip') {
         return "application/zip";
      } else if(extension.toLowerCase() === 'jpg') {
         return "image/jpeg";
      } else if(extension.toLowerCase() === 'png') {
         return "image/png";
      } else {
         console.log("Content-type not found in the table, extension = [" + extension + "]")
         return "application/octet-stream";
      }
   }
}
//*****************************************************************************
var _getFileName = function(contentDisposition) {

   function _replaceAll(str, from, to){
       var pos = str.indexOf(from);
       while (pos > -1){
   		str = str.replace(from, to);
   		pos = str.indexOf(from);
   	 }
       return (str);
   }

   var tokens = _.split(contentDisposition, ';');
   var i;
   var token;
   var key;
   var value;
   var keyValue;
   //search filename
   for (i = 0; i < tokens.length; i++) {
      token = tokens[i].trim();
      keyValue = _.split(token, '=');
      if(keyValue.length > 1) {
         key = keyValue[0].trim().toLowerCase();
         value = keyValue[1].trim();
         if (key === 'filename') {
            return _replaceAll(value, "\"", "");
         }
      }

   }
}
//*****************************************************************************
var _getFileBuffer = function (eventCode, licitacaoNum, licitacaoCategoryCode, licitacaoYear) {
  var result = {};
  return new Promise(function(resolve, reject) {
     var chuncks = [];
     _requestService
           .post(urlDownloadLicitacaoEventFile, {
               form: {
                  codigoEvento: eventCode,
                  codigoModalidade: licitacaoCategoryCode,
                  numeroLicitacao: licitacaoNum,
                  anoLicitacao: licitacaoYear
               }
            }).on('response', function(response) {
               var contentDisposition = response.headers['content-disposition'];
               result.fileName = _getFileName(contentDisposition);
            }).on('data', function(chunk) {
               chuncks.push(chunk)
            }).on('end', function() {
               var buffer = Buffer.concat(chuncks);
               result.buffer = buffer;
               resolve(result);
            }).on('error', function(error) {
               reject(error);
            });
  });
}
//*****************************************************************************
var _putFileAttachment = function (fileName, fileData, fileLength, contentType) {
   var camaraApiConfig = config.get("CamaraApi");

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //use the uuid as the file name
   return new Promise(function(resolve, reject) {
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Bucket,
                          camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Folder + "/" + fileName,
                          fileData,
                          fileLength,
                          contentType,
      function (err, etag) {
         if (!err) {
            resolve({
               'fileName': fileName,
               'contentType': contentType
            });
         } else {
            console.log("Error while uploading licitacao event file, err = [" + err + "]");
            reject(err);
         }
      });
   });
}
//*****************************************************************************
var _insertLicitacaoCategory = async function (fromMysqlDatabaseLicitacaoCategory) {

   var licitacaoCategory = new LicitacaoCategory();
   licitacaoCategory.description = fromMysqlDatabaseLicitacaoCategory.desc_modalidade;
   return licitacaoCategory.save();
}
//*****************************************************************************
var _insertLicitacaoCategories = async function (licitacaoCategories) {
   var licitacaoCategory;

   console.log("Migrating licitacao categories ...");
   if (licitacaoCategories) {
      var k;
      try {
         for (k = 0; k < licitacaoCategories.length; k++) {
            licitacaoCategory = await _insertLicitacaoCategory(licitacaoCategories[k]);
            licitacaoCategoryMap[licitacaoCategories[k].cod_modalidade] = licitacaoCategory;
         }
         console.log("Licitacao categories migrated.");
         return Promise.resolve(true);
      } catch(error) {
         console.log("Error while migrating licitacao categories, err = [" + error + "].");
         return Promise.reject(error);
      }
   }
}
//*****************************************************************************
var _insertLicitacao = async function (connection, fromMysqlDatabaseLicitacao) {
   var licitacaoCategory = licitacaoCategoryMap[fromMysqlDatabaseLicitacao.cod_modalidade];
   var savedLicitacao;
   var licitacao;

   if (licitacaoCategory) {
      licitacao = new Licitacao();
      licitacao.number = fromMysqlDatabaseLicitacao.num_licitacao;
      licitacao.year = fromMysqlDatabaseLicitacao.int_anolicitacao
      licitacao.description = fromMysqlDatabaseLicitacao.txt_objetolicitacao;
      licitacao.creationDate = new Date();
      licitacao.publicationDate = new Date();
      licitacao.changedDate = null;
      licitacao.state = 1
      licitacao.category = licitacaoCategoryMap[fromMysqlDatabaseLicitacao.cod_modalidade]
      licitacao.events = []
      return  licitacao
              .save()
              .then(function(psavedLicitacao) {
                 savedLicitacao = psavedLicitacao;
                 return MySQLDatabase.query( connection,
                                             queryLicitacaoEvents,
                                             [ fromMysqlDatabaseLicitacao.num_licitacao,
                                               fromMysqlDatabaseLicitacao.int_anolicitacao,
                                               fromMysqlDatabaseLicitacao.cod_modalidade ]);
              }).then(function(licitacaoEvents) {
                 return _insertLicitacaoEvents(savedLicitacao, licitacaoEvents);
              }).then(function(licitacaoEvents) {
                 if (licitacaoEvents && licitacaoEvents.length > 0) {
                    savedLicitacao.publicationDate = licitacaoEvents[0].date;
                    savedLicitacao.events = licitacaoEvents;
                    return savedLicitacao.save();
                 }
              });
   } else {
      return Promise.reject(new Error("Licitacao category not found, category code = " + fromMysqlDatabaseLicitacao.cod_modalidade + ", licitacaoNum = " + fromMysqlDatabaseLicitacao.num_licitacao + ", licitacoYear = " + int_anolicitacao));
   }
}
//*****************************************************************************
var _insertLicitacoes = async function (connection, licitacoes) {
   var licitacao;

   console.log("Migrating licitacoes ...");
   if (licitacoes) {
      var k;
      try {
         for (k = 0; k < licitacoes.length; k++) {
            licitacao = await _insertLicitacao(connection, licitacoes[k]);
         }
         console.log("Licitacoes migrated.");
         return Promise.resolve(true);
      } catch(error) {
         console.log("Error while migrating licitacoes, err = [" + error + "].");
         return Promise.reject(error);
      }
   }
}
//*****************************************************************************
var _insertLicitacaoEvent = async function(licitacao, fromMysqlDatabaseLicitacaoEvent, fileName, contentType) {
   var licitacaoEvent = new LicitacaoEvent();
   licitacaoEvent.description = fromMysqlDatabaseLicitacaoEvent.desc_evento;
   licitacaoEvent.date = fromMysqlDatabaseLicitacaoEvent.dat_evento;
   licitacaoEvent.creationDate = new Date();
   licitacaoEvent.changedDate = null;
   licitacaoEvent.file = fileName;
   licitacaoEvent.originalFilename = fileName;
   licitacaoEvent.contentType = contentType;
   licitacaoEvent.licitacao = licitacao;
   return licitacaoEvent.save();
}
//*****************************************************************************
var _insertLicitacaoEvents = async function(licitacao, fromMysqlDatabaseLicitacaoEvents) {
   var licitacaoEvent;
   var licitacaoEvents = [];
   var fileBuffer;
   var k;
   var getFileResult;
   var fileNameParts;
   var extension;
   var contentType;
   var fileName;

   try {
      if (fromMysqlDatabaseLicitacaoEvents) {
         for (k = 0; k < fromMysqlDatabaseLicitacaoEvents.length; k++) {
            getFileResult = await _getFileBuffer( fromMysqlDatabaseLicitacaoEvents[k].cod_evento,
                                                  fromMysqlDatabaseLicitacaoEvents[k].num_licitacao,
                                                  fromMysqlDatabaseLicitacaoEvents[k].cod_modalidade,
                                                  fromMysqlDatabaseLicitacaoEvents[k].int_anolicitacao);
            fileNameParts = _.split(getFileResult.fileName, '.');
            if (fileNameParts.length > 1) {
               //append the extension file
               extension = fileNameParts[fileNameParts.length - 1];
            } else {
               extension = "";
            }
            if (extension) {
               contentType = _getContentType(extension);
               fileName = uuidModule.v4() + "." + extension;
               if (getFileResult && getFileResult.buffer && getFileResult.buffer.length > 0) {
                  await _putFileAttachment(fileName, getFileResult.buffer, getFileResult.buffer.length, contentType);
               }
            } else {
               console.log("File problem, cod_evento = [" +  fromMysqlDatabaseLicitacaoEvents[k].cod_evento + "], num_licitacao = [" + fromMysqlDatabaseLicitacaoEvents[k].num_licitacao + "], ano = [" + fromMysqlDatabaseLicitacaoEvents[k].int_anolicitacao + "], categoria = [" + fromMysqlDatabaseLicitacaoEvents[k].cod_modalidade + "]")
               fileBuffer = fs.readFileSync("./migration/licitacao_blank_file.pdf", { flag: 'r' });
               extension = "pdf";
               contentType = _getContentType(extension);
               fileName = uuidModule.v4() + "." + extension;
               thumbnailFile = await _putFileAttachment(fileName, fileBuffer, fileBuffer.length, contentType);
            }
            licitacaoEvent = await _insertLicitacaoEvent(licitacao, fromMysqlDatabaseLicitacaoEvents[k], fileName, contentType);
            licitacaoEvents.push(licitacaoEvent);
         }
      }
      return Promise.resolve(licitacaoEvents);
   } catch(error) {
      return Promise.reject(error);
   }
}
//*****************************************************************************

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.run = async function () {
   winston.info("************migrateLicitacoes");
   var connectionPool = MySQLDatabase.createConnectionPool({
            "host": "camarasorocaba.sp.gov.br",
            "user": "admin",
            "password": "PnbdpC725",
            "database": "licitacao",
            "queueLimit": 50,
            "connectionLimit": 50
   });

   var connection;
   return MySQLDatabase
            .openConnection(connectionPool).then(function(pconnection) {
               connection = pconnection;
               return MySQLDatabase.query(connection, queryLicitacaoCategories);
            }).then(function(licitacaoCategories) {
               return _insertLicitacaoCategories(licitacaoCategories);
            }).then(function() {
               return MySQLDatabase.query(connection, queryLicitacoes);
            }).then(function(licitacoes) {
               return _insertLicitacoes(connection, licitacoes);
            }).catch(function(error) {
               console.log("Error while migrating licitacoes, err = [" + error + "].");
            });
}
