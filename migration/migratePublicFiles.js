/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var urlDownloadFile = "http://www.camarasorocaba.sp.gov.br:8383/contas-publicas-0.1/arquivo/getConteudo/";

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

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');

var queryGetRootFolder  = "SELECT id, " +
                          "       descricao, " +
                          "       ordem, " +
                          "       pai_id " +
                          "FROM   pasta " +
                          "WHERE  pai_id IS NULL " +
                          "AND    id = 1; ";

var queryGetFolderFiles = "SELECT id, " +
                          "       descricao, " +
                          "       ordem, " +
                          "       content_type, " +
                          "       extension " +
                          "FROM   arquivo a " +
                          "WHERE  a.pasta_pai_arquivo_id = ? " +
                          "ORDER  BY a.ordem; ";

var queryGetFolderFolders = "SELECT id, " +
                            "       descricao, " +
                            "       ordem " +
                            "FROM   pasta p " +
                            "WHERE  p.pai_id = ? " +
                            "ORDER  BY p.ordem; ";

var queryCountFiles =   "SELECT COUNT(1) as files_count " +
                        "FROM   arquivo a ";

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
var _getFileBuffer = function(fileId) {
   return new Promise(function(resolve, reject) {
      var chuncks = [];
      _requestService
            .get(urlDownloadFile + fileId)
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
var _countFiles = function(connection) {
   return MySQLDatabase.query(connection, queryCountFiles);
}
//*****************************************************************************
var _migrateFolder = function(connection, folder, folderName, parentFolder, rootFolderPath, subfoldersCount, filesTotalCount) {
   var folderPath = parentFolder ? rootFolderPath + "/" + folderName : "/" + folderName;
   var publicFolder = new PublicFolder();
   publicFolder.creationDate = new Date();
   publicFolder.order = folder.order;
   publicFolder.isFolder = true;
   publicFolder.creationUser = createUserScript.getUser();
   publicFolder.folder = parentFolder;
   publicFolder.name = folderName;
   publicFolder.description = folder.descricao;
   var newFolder;
   var progress;
   return publicFolder
            .save()
            .then(function(pnewFolder) {
               newFolder = pnewFolder;
               return _getFiles(connection, folder.id);
            }).then(async function(files) {
               var i;
               var publicFile;
               var fileName;
               var fileBuffer;

               for (i = 0; i < files.length; i++) {
                  //save to S3
                  fileName = uuidModule.v4() + "-" + files[i].id + "." + files[i].extension;
                  //get file buffer
                  fileBuffer = await _getFileBuffer(files[i].id);
                  await _putFile(folderPath + "/" + fileName, fileBuffer, files[i].content_type);

                  publicFile = new PublicFile();
                  publicFile.creationDate = new Date();
                  publicFile.length = 0;
                  publicFile.order = subfoldersCount + i + 1;
                  publicFile.isFolder = false;
                  publicFile.creationUser = createUserScript.getUser();
                  publicFile.folder = newFolder;
                  publicFile.name = fileName;
                  publicFile.description = files[i].descricao;
                  publicFile.extension = files[i].extension;
                  publicFile.contentType = files[i].content_type;
                  await publicFile.save();
                  qtdFilesProcessed++;
                  progress = Math.round(qtdFilesProcessed / filesTotalCount * 100);
                  if (progress % 5 === 0 && lastProgress !== progress) {
                     console.log(progress + "%");
                     lastProgress = progress;
                  }
               }
               return newFolder;
            });
}
//*****************************************************************************
var _getSubFolders = function(connection, folderId) {
   return MySQLDatabase.query(connection, queryGetFolderFolders, [ folderId ]);
}
//*****************************************************************************
var _getFiles = function(connection, folderId) {
   return MySQLDatabase.query(connection, queryGetFolderFiles, [ folderId ]);
}
//*****************************************************************************
var _migrate = async function(connection, rootFolder, filesCount) {
   var queue = [{ id:  rootFolder.id, parentFolder: null, rootFolderPath: "", isRoot: true }];
   var currentFolder;
   var subfolders;
   var i;
   var currentFolderName;
   var newFolder;

   try {
      while (queue.length > 0) {
         currentFolder = queue.shift();
         currentFolderName = currentFolder.isRoot ? "" : uuidModule.v4() + "-" + currentFolder.id;
         subfolders = await _getSubFolders(connection, currentFolder.id);
         if (!currentFolder.isRoot) {
            newFolder = await _migrateFolder(connection, currentFolder, currentFolderName, currentFolder.parentFolder, currentFolder.rootFolderPath, subfolders.length, filesCount);
         } else {
            newFolder = null;
         }

         if (subfolders) {
            for (i = 0; i < subfolders.length; i++) {
               subfolders[i].parentFolder = newFolder;
               subfolders[i].rootFolderPath = currentFolder.isRoot ? "" : currentFolder.rootFolderPath + "/" + currentFolderName;
               subfolders[i].order = i + 1;
               queue.push(subfolders[i]);
            }
         }
      }
      return Promise.resolve();
   } catch (error) {
      return Promise.reject(error);
   }
}
/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.run = async function () {
   winston.info("************migratePublicFiles");
   var connectionPool = MySQLDatabase.createConnectionPool({
            "host": "camarasorocaba.sp.gov.br",
            "user": "admin",
            "password": "PnbdpC725",
            "database": "publicacao_contas",
            "queueLimit": 50,
            "connectionLimit": 50
   });

   var connection;
   var filesCount;
   return MySQLDatabase
            .openConnection(connectionPool).then(function(pconnection) {
               connection = pconnection;
               return _countFiles(connection);
            }).then(function(pfilesCount) {
               filesCount = pfilesCount[0].files_count;
               return MySQLDatabase.query(connection, queryGetRootFolder);
            }).then(function(rootFolder) {
               return _migrate(connection, rootFolder[0], filesCount);
            }).catch(function(error) {
               console.log("Error while migrating public files, err = [" + error + "].");
            });
}
