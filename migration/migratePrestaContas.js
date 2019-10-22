/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var urlDownloadFile = "http://www.camarasorocaba.sp.gov.br/arquivos/prestacontas/";

var config = require('config');
var winston = require('winston');
var uuidModule = require('uuid');
var _ = require('lodash');
var _requestService = require('request');
var Minio = require('minio');
var MySQLDatabase = require('./MySQLDatabase');
var createUserScript = require('./createUser');
var PublicFileModule = require('../models/PublicFile.js');
var PublicFile = PublicFileModule.getModel();
var PublicFolderModule = require('../models/PublicFolder.js');
var PublicFolder = PublicFolderModule.getModel();

var qtdFilesProcessed = 0;
var lastProgress = 0;
var _prestaContasFolder = null;
/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');

var queryGetPrestaContas  = "SELECT int_anoconta, " +
                            "       int_mesconta, " +
                            "       str_arquivo " +
                            "FROM   tb_conta " +
                            "ORDER  BY int_anoconta DESC, int_mesconta; ";

//*****************************************************************************
var _putFile = function(filePath, fileBuffer, contentType) {
    var s3Client = new Minio.Client(config.CamaraApi.S3Configuration);
    //send the file to S3 server
    return s3Client.putObject( config.CamaraApi.PublicFiles.s3Files.s3Bucket,
                               config.CamaraApi.PublicFiles.s3Files.s3Folder + filePath,
                               fileBuffer,
                               fileBuffer.length,
                               contentType);
}
//*****************************************************************************
var _getFileBuffer = function(file) {
   return new Promise(function(resolve, reject) {
      var chuncks = [];
      _requestService
            .get(urlDownloadFile + file)
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
var _getMonthDescription = function(month) {
   var monthDescriptions = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
   return monthDescriptions[month - 1];
}
//*****************************************************************************
var _createYearFolder = async function(parentFolder, order, year, folderName) {
   var publicFolder = new PublicFolder();
   publicFolder.creationDate = new Date();
   publicFolder.order = order;
   publicFolder.isFolder = true;
   publicFolder.creationUser = createUserScript.getUser();
   publicFolder.folder = parentFolder;
   publicFolder.name = folderName;
   publicFolder.description = year.toString();
   return publicFolder.save().then(function(savedPublicFolder) {
      return savedPublicFolder;
   });
}
//*****************************************************************************
var _createPrestaContasFolder = async function(folderName) {
   return PublicFolder.count({
            folder: null
         }).then(function(pFolderAmount) {
            var publicFolder = new PublicFolder();
            publicFolder.creationDate = new Date();
            publicFolder.order = pFolderAmount;
            publicFolder.isFolder = true;
            publicFolder.creationUser = createUserScript.getUser();
            publicFolder.folder = null;
            publicFolder.name = folderName;
            publicFolder.description = "Prestação de Contas - Vereadores";
            return publicFolder.save();
         }).then(function(savedPublicFolder) {
            return savedPublicFolder;
         });

}
//*****************************************************************************
var _migratePrestacaoConta = async function(folderPath, yearFolder, order, fileName, year, month, file) {
   var fileBuffer = await _getFileBuffer(file);
   await _putFile(folderPath + "/" + fileName, fileBuffer, "text/html");

   var publicFile = new PublicFile();
   publicFile.creationDate = new Date();
   publicFile.length = fileBuffer.length;
   publicFile.order = order;
   publicFile.isFolder = false;
   publicFile.creationUser = createUserScript.getUser();
   publicFile.folder = yearFolder;
   publicFile.name = fileName;
   publicFile.description = _getMonthDescription(month);
   publicFile.extension = "html";
   publicFile.contentType = "text/html; charset=windows-1252";
   return publicFile.save();
}
//*****************************************************************************

var _migrate = async function(prestaContas) {
   var k;
   var previousYear = null;
   var yearFolder;
   var folderName;
   var prestaContasFolderName;
   var prestaContasFolder;
   var fileCount = 0;
   var folderCount = 0;
   var fileName;
   var folderPath = "/";

   try {
      if (prestaContas) {
         //create folder root
         prestaContasFolderName = uuidModule.v4()
         prestaContasFolder = await _createPrestaContasFolder(prestaContasFolderName);
         _prestaContasFolder = prestaContasFolder;
         folderPath += prestaContasFolderName;

         for (k = 0; k < prestaContas.length; k++) {
            if (prestaContas[k].int_anoconta === null || prestaContas[k].int_anoconta !== previousYear) {
               //create year folder
               folderName = uuidModule.v4();
               yearFolder = await _createYearFolder(prestaContasFolder, folderCount, prestaContas[k].int_anoconta, folderName);
               fileCount = 0;
               folderCount++;
            }
            fileName = uuidModule.v4() + ".html";
            await _migratePrestacaoConta(folderPath + "/" + folderName, yearFolder, fileCount, fileName, prestaContas[k].int_anoconta, prestaContas[k].int_mesconta, prestaContas[k].str_arquivo);
            previousYear = prestaContas[k].int_anoconta;
            fileCount++;
         }
      }
   } catch(error) {
      return Promise.reject(error);
   }
}
/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/

//******************************************************************************
module.exports.getPrestaContasFolder = function () {
   return _prestaContasFolder;
}
//******************************************************************************
module.exports.run = async function () {
   winston.info("************migratePublicFiles");
   var connectionPool = MySQLDatabase.createConnectionPool({
            "host": "camarasorocaba.sp.gov.br",
            "user": "admin",
            "password": "PnbdpC725",
            "database": "prestaconta",
            "queueLimit": 50,
            "connectionLimit": 50
   });

   var connection;
   var filesCount;
   return MySQLDatabase
            .openConnection(connectionPool).then(function(pconnection) {
               connection = pconnection;
               return MySQLDatabase.query(connection, queryGetPrestaContas);
            }).then(function(prestaContas) {
               return _migrate(prestaContas)
            }).catch(function(error) {
               console.log("Error while migrating public presta contas, err = [" + error + "].");
            });
}
