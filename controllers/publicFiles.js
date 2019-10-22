/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var PublicFileModule = require('../models/PublicFile.js');
var PublicFolderModule = require('../models/PublicFolder.js');
var PublicFile = PublicFileModule.getModel();
var PublicFolder = PublicFolderModule.getModel();
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var Minio = require('minio');
var config = require('config');
var jschardet = require("jschardet")

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//find a folder by id
var _findFolderById = function (folderId) {
   return new Promise(function (resolve, reject) {
      return PublicFolder
      .findById({ _id: folderId })
      .then(function(folder) {
         resolve(folder);
      }).catch(function(err) {
         reject(err);
      });
   });
}

//find a folder by properties
var _findOneFolder = function (properties) {
   return new Promise(function (resolve, reject) {
      return PublicFolder
      .findOne(properties)
      .then(function(folder) {
         resolve(folder);
      }).catch(function(err) {
         reject(err);
      });
   });
}

//find a folder by properties
var _findOneFile = function (properties) {
   return new Promise(function (resolve, reject) {
      return PublicFile
      .findOne(properties)
      .then(function(folder) {
         resolve(folder);
      }).catch(function(err) {
         reject(err);
      });
   });
}

//find a folder or a file by properties
var _findOneFileOrFolder = function (properties) {
   var notContinue = true;

   return new Promise(function (resolve, reject) {
      return PublicFile
      .findOne(properties)
      .then(function(file) {
         if (file) {
            resolve(file);
            return notContinue;
         } else {
            return PublicFolder.findOne(properties);
         }
      }).then(function(folder) {
         if(folder !== notContinue) {
            resolve(folder);
         }
      }).catch(function(err) {
         reject(err);
      });
   });
}

//get the amount of objects in the folder
var _countObjectsInFolder = function (folderId) {
   var notContinue = true;
   var fileAmount;
   var folderAmount;

   return new Promise(function (resolve, reject) {
      return PublicFile
               .count({
                  folder: folderId ? PublicFolderModule.getMongoose().Types.ObjectId(folderId) : null
               }).then(function(pFileAmount) {
                  fileAmount = pFileAmount ? pFileAmount : 0;
                  return PublicFolder.count({
                           folder: folderId ? PublicFolderModule.getMongoose().Types.ObjectId(folderId) : null
                         });
               }).then(function(pFolderAmount) {
                  folderAmount = pFolderAmount ? pFolderAmount : 0;
                  resolve(fileAmount + folderAmount);
               }).catch(function(err) {
                  reject(err);
               });
   });
}

//build the path of a folder
var _getFolderPath = async function(folderId) {
   var currentFolder;
   var path = [];
   //find the folder
   if (folderId) {
      try {
         folder = await _findFolderById(folderId);
      } catch(err) {
         return Promise.reject(err);
      }

      if(!folder) {
         return Promise.resolve(null);
      }

      //build the path
      currentFolder = folder;
      while(currentFolder) {
         path.unshift(currentFolder);
         //get parent folder
         if (currentFolder.folder) {
            currentFolder = await _findFolderById(currentFolder.folder);
         } else {
            currentFolder = null;
         }
      }
      return Promise.resolve(path);
   } else {
      return Promise.reject(new Error("folderId not defined"));
   }
}

//Returns a string representation of the folderPath
//folderPath is an array
var _folderPathAsString = function(folderPath) {
   var k;
   var sfolderPath = "";
   if (folderPath) {
      for(k = 0; k < folderPath.length; k++) {
         sfolderPath += "/" + folderPath[k].name;
      }
   }
   return sfolderPath;
}

//Returns a string representation of the folderPath
//using the description field
//folderPath is an array
var _folderPathDescriptionAsString = function(folderPath) {
   var k;
   var sfolderPath = "";
   if (folderPath) {
      for(k = 0; k < folderPath.length; k++) {
         if (k === 0) {
            sfolderPath += folderPath[k].description;
         } else {
            sfolderPath += " > " + folderPath[k].description;
         }

      }
   }
   return sfolderPath;
}

//find elements in a folder with given description (insensitive case)
var findElementsByDescriptionIC = function (folderId, description) {
   var folders = [];
   var files = [];

   return PublicFolder
         .find({
            "folder": folderId ? PublicFolderModule.getMongoose().Types.ObjectId(folderId) : null,
            "description" : { $regex : new RegExp("^" + description + "$", "i") }
         }).then(function (pFolders) {
            if (pFolders) {
               folders = pFolders;
            }
            return PublicFile.find({
               "folder": folderId ? PublicFolderModule.getMongoose().Types.ObjectId(folderId) : null,
               "description" : { $regex : new RegExp("^" + description + "$", "i") }
            });
         }).then(function (pFiles) {
            if (pFiles) {
               files = pFiles;
            }
            var foundElements = _.concat(folders, files);
            return _.sortBy(foundElements, ['order']);
         });
}

//find an folder by id or return if the folder is the root,
// in this case folderId is null and the promise will return the value of the variable
//    _findFolderResultIsRoot_
// if the promisse returns null the folder id is not null, but no folders were found with given id
var _findFolderResultIsRoot_ = true;
var _findFolderOrRootFolder = function(folderId) {
   return new Promise(function(resolve, reject) {
      if (folderId === null) {
         resolve(_findFolderResultIsRoot_);
      } else {
         _findFolderById(folderId)
         .then(function(folder) {
            resolve(folder);
         }).catch(function(err) {
            reject(err);
         });
      }
   });
}

//find folders and files by properties
var _findFilesAndFolders = function (properties) {
   var notContinue = true;
   var files = [];
   var folders = [];
   var elements = [];

   return new Promise(function (resolve, reject) {
      return PublicFile
      .find(properties)
      .then(function(pFiles) {
         if (pFiles) {
            files = pFiles;
         }
         return PublicFolder.find(properties);
      }).then(function(pFolders) {
         if (pFolders) {
            folders = pFolders;
         }
         elements = _.concat(folders, files);
         resolve(_.sortBy(elements, ['order']));
      }).catch(function(err) {
         reject(err);
      });
   });
}

//given the order of an element in the folder which the id is folderId,
//update the orders (decrement) of the elements below it
var _updateFolderAndFilesOrders = function(folderId, fromOrder) {
   var updatesFilesOrders = [];
   var updatesFoldersOrders = [];

   return _findFilesAndFolders({
      folder:  folderId ? PublicFolderModule.getMongoose().Types.ObjectId(folderId) : null,
      order: { $gt: fromOrder }
   }).then(function (elements) {
      var k;
      //build the updates
      if (elements) {
         for (k = 0; k < elements.length; k++) {
            //for folders
            if (elements[k].isFolder) {
               updatesFoldersOrders.push({
                  updateOne: {
                     filter: { '_id': elements[k]._id },
                     update: { 'order': elements[k].order - 1 }
                  }
               });
            } else {
            //and for files
               updatesFilesOrders.push({
                  updateOne: {
                     filter: { '_id': elements[k]._id },
                     update: { 'order': elements[k].order - 1 }
                  }
               });
            }
         }
      }
      //execute the updates

      //for folders
      if (updatesFoldersOrders.length > 0) {
         return PublicFolder.bulkWrite(updatesFoldersOrders);
      }
   }).then(function(){
      //and for files
      if (updatesFilesOrders.length > 0) {
         return PublicFile.bulkWrite(updatesFilesOrders);
      }
   });
}

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.listFolderContents = async function(req, res, next) {
   var folderId = null;
   if (req.params.folderId) {
      folderId = req.params.folderId;
   }
   var cont = true;
   var subfolders = [];
   var files = [];
   var objects = [];
   var i = 0;
   var folder = null;
   var folderNotFound = false;

   //find the folder to be listed
   if (folderId) {
      try {
         folder = await _findFolderById(folderId);
      } catch(err) {
         winston.error("Error while listing folder content in Public Files, err = [%s]", err);
         Utils.next(400, err, next);
         return;
      }
      if(!folder) {
         folderNotFound = true;
      }
   }

   if (folderNotFound) {
      Utils.sendJSONresponse(res, 400, { message: 'folder not found' });
      return;
   }

   //list the subfolders
   return PublicFolder
         .find({
            'folder': folder
         })
         .populate('creationUser', 'username name')
         .then(function(psubfolders) {
            if (psubfolders) {
               for (i = 0; i < psubfolders.length; i++) {
                  subfolders.push(psubfolders[i]);
               }
            }
            //list the files
            return PublicFile
                   .find({ 'folder': folder })
                   .populate('creationUser', 'username name');
         }).then(function(pfiles) {
            if (pfiles) {
               for (i = 0; i < pfiles.length; i++) {
                  files.push(pfiles[i]);
               }
            }
            //merge
            objects = subfolders.concat(files);
            objects = _.sortBy(objects, ['order']);
            Utils.sendJSONresponse(res, 200, {
               objects: objects
            });
         }).catch(function(err) {
            winston.error("Error while listing folder content in Public Files, err = [%s]", err);
            Utils.next(400, err, next);
         });
}

//return all public files, for indexing purpose
module.exports.getAllFiles = async function(req, res, next) {
   //pagination options
   var page = req.query.page ? parseInt(req.query.page) : 1;
   var pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;

   return PublicFile
            .count({})
            .then(function(count) {
               if (count > 0) {
                  if (page * pageSize - pageSize >= count) {
                     page = Math.ceil(count / pageSize); //last page
                  }
                  return PublicFile
                           .find()
                           .sort({ creationDate: -1 })
                           .skip(page * pageSize - pageSize)
                           .limit(pageSize)
                           .then(function(publicFiles) {
                              return {
                                 "publicFiles" : publicFiles,
                                 "totalLength": count,
                                 "page": page,
                                 "pageSize": pageSize
                              }
                           });
               } else {
                  return {
                     "publicFiles" : [],
                     "totalLength": 0,
                     "page": 1,
                     "pageSize": 1
                  }
               }
            }).then(function(result) {
               Utils.sendJSONresponse(res, 200, result);
            }).catch(function(err) {
               winston.error("Error while getting public files, err = [%s]", err);
               Utils.next(400, err, next);
            });
}

module.exports.getMetaFile = async function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");
   var publicFile;
   var folderPath;
   var notContinue = true;

   if(req.params.fileId) {
      PublicFile
            .findOne({ _id: PublicFileModule.getMongoose().Types.ObjectId(req.params.fileId) })
            .then( function(ppublicFile) {
               if (ppublicFile) {
                  publicFile = ppublicFile;
                  if (publicFile.folder) {
                     return _getFolderPath(publicFile.folder);
                  } else {
                     //the file is in the root folder
                     return [{ name: '' }]; //just the root folder in the path
                  }
               } else {
                  Utils.sendJSONresponse(res, 400, { message: 'public file not found' });
                  return notContinue;
               }
            }).then(function(folderPath) {
               if (folderPath === notContinue) {
                  return;
               }
               if(!folderPath) {
                  Utils.sendJSONresponse(res, 400, { message: 'parent folder of the file not found' });
                  return;
               }

               var sfolderPath = _folderPathDescriptionAsString(folderPath);
               Utils.sendJSONresponse(res, 200, {
                  'metaFileInfo': publicFile,
                  'folderPath': sfolderPath
               });
            }).catch(function(err) {
               winston.error("Error while downloading public file, err = [%s]", err);
               Utils.next(400, err, next);
            });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined public file id' });
   }
}

module.exports.getAmountOfElements = async function(req, res, next) {
   var folderId = null;
   if (req.params.folderId) {
      folderId = req.params.folderId;
   }
   var cont = true;
   var folder = null;
   var folderNotFound = false;
   var notContinue = true;

   return _findFolderOrRootFolder(folderId)
   .then(function(findFolderOrRootFolderResult) {
      if ( findFolderOrRootFolderResult === _findFolderResultIsRoot_ ||
           findFolderOrRootFolderResult) {
         return _countObjectsInFolder(folderId);
      } else {
         Utils.sendJSONresponse(res, 400, { message: 'public folder not found' });
         return notContinue;
      }
   }).then(function(amount) {
      if (amount !== notContinue) {
         Utils.sendJSONresponse(res, 200, {
            amount: amount
         });
      }
   }).catch( function(err) {
      winston.error("Error while listing folder content in Public Files, err = [%s]", err);
      Utils.next(400, err, next);
   });
}

//handle getFolder requistion
module.exports.getFolderPath = async function(req, res, next) {
   var folderId = null;
   var path = [];
   var currentFolder;

   if (req.params.folderId) {
      folderId = req.params.folderId;
   }

   //find the folder
   if (folderId) {
      _getFolderPath(folderId)
      .then(function(path) {
         if (path) {
            Utils.sendJSONresponse(res, 200, {
               'path': path
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'public folder not found' });
         }
      }).catch(function(err) {
         winston.error("Error while getting folder path in Public Files, err = [%s]", err);
         Utils.next(400, err, next);
         return;
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined folder id' });
   }
}

module.exports.moveFolderUp = function(req, res, next) {
   var folderId = null;
   var publicFolder = null;
   if (req.params.folderId) {
      folderId = req.params.folderId;
      return PublicFolder //first, find the folder
            .findOne({ _id: PublicFolderModule.getMongoose().Types.ObjectId(folderId) })
            .then( function(ppublicFolder) {
               if (ppublicFolder) {
                  //found the folder
                  publicFolder = ppublicFolder;
                  if(publicFolder.order > 0) { //if the folder order is zero, it can't move up
                     //find the above object, file or folder
                     _findOneFileOrFolder({
                        folder:  publicFolder.folder,
                        order: publicFolder.order - 1
                     }).then(function(fileOrFolder) {
                        if (fileOrFolder) {
                           //move the above object down
                           fileOrFolder.order = publicFolder.order;
                           fileOrFolder
                           .save()
                           .then(function(savedFileOrFolder) {
                              //move the folder up
                              publicFolder.order -= 1;
                              return publicFolder.save();
                           }).then(function(savedFolder) {
                              Utils.sendJSONresponse(res, 200, { message: 'folder moved up' });
                           }).catch(function(err) {
                              winston.error("Error while moving folder up, err = [%s]", err);
                              Utils.next(400, err, next);
                           });
                        } else {
                           //awkward scenario
                           //the order folder is greather than 0,
                           //but there isn't a object above it
                           Utils.sendJSONresponse(res, 400, {
                              message: "Awkward scenario! The order of the folder is greather than 0, but there isn't an object above"
                           });
                        }
                     }).catch(function(err) {
                        winston.error("Error while moving folder up, err = [%s]", err);
                        Utils.next(400, err, next);
                     });
                  } else {
                     Utils.sendJSONresponse(res, 200, { message: 'folder moved up' });
                  }
               } else {
                  //folder not found
                  Utils.sendJSONresponse(res, 400, { message: 'public folder not found' });
               }
            });

   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined folder id' });
   }
}

module.exports.moveFolderDown = function(req, res, next) {
   var folderId = null;
   var publicFolder = null;
   if (req.params.folderId) {
      folderId = req.params.folderId;
      return PublicFolder //first, find the folder
            .findOne({ _id: PublicFolderModule.getMongoose().Types.ObjectId(folderId) })
            .then(async function(ppublicFolder) {
               if (ppublicFolder) {
                  var objectsAmount;
                  //found the folder
                  publicFolder = ppublicFolder;
                  //get the amount of objects in the same folder
                  try {
                     objectsAmount = await _countObjectsInFolder(publicFolder.folder);
                  } catch (err) {
                     winston.error("Error while moving folder down, err = [%s]", err);
                     Utils.next(400, err, next);
                     return;
                  }
                  if (publicFolder.order < objectsAmount - 1) { //if the folder is the last
                                                                //it can't move down
                     //find the below object, file or folder
                     return _findOneFileOrFolder({
                              folder:  publicFolder.folder,
                              order: publicFolder.order + 1
                            }).then(function(fileOrFolder) {
                               if (fileOrFolder) {
                                  //move the below object up
                                  fileOrFolder.order = publicFolder.order;
                                  return fileOrFolder
                                         .save()
                                         .then(function(savedFileOrFolder) {
                                            //move the folder down
                                            publicFolder.order += 1;
                                            return publicFolder.save();
                                         }).then(function(savedFolder) {
                                            Utils.sendJSONresponse(res, 200, { message: 'folder moved down' });
                                         }).catch(function(err) {
                                            winston.error("Error while moving folder down, err = [%s]", err);
                                            Utils.next(400, err, next);
                                         });
                               } else {
                                  //awkward scenario
                                  //the order folder is less than amount of objects in the folder less one,
                                  //but there isn't a object below it
                                  Utils.sendJSONresponse(res, 400, {
                                     message: "Awkward scenario! The order of the folder is less than amount of objects in the folder less one, but there isn't an object below"
                                  });
                               }
                            }).catch(function(err) {
                               winston.error("Error while moving folder down, err = [%s]", err);
                               Utils.next(400, err, next);
                            });
                  } else {
                     Utils.sendJSONresponse(res, 200, { message: 'folder moved down' });
                  }
               } else {
                  //folder not found
                  Utils.sendJSONresponse(res, 400, { message: 'public folder not found' });
               }
            });

   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined folder id' });
   }
}

module.exports.moveFileUp = function(req, res, next) {
   var fileId = null;
   var publicFile = null;
   if (req.params.fileId) {
      fileId = req.params.fileId;
      return PublicFile //first, find the file
            .findOne({ _id: PublicFileModule.getMongoose().Types.ObjectId(fileId) })
            .then( function(ppublicFile) {
               if (ppublicFile) {
                  //found the file
                  publicFile = ppublicFile;
                  if (publicFile.order > 0) { //if the file order is zero, it can't move up
                     //find the above object, file or folder
                     _findOneFileOrFolder({
                        folder:  publicFile.folder,
                        order: publicFile.order - 1
                     }).then(function(fileOrFolder) {
                        if (fileOrFolder) {
                           //move the above object down
                           fileOrFolder.order = publicFile.order;
                           fileOrFolder
                           .save()
                           .then(function(savedFileOrFolder) {
                              //move the file up
                              publicFile.order -= 1;
                              return publicFile.save();
                           }).then(function(savedFile) {
                              Utils.sendJSONresponse(res, 200, { message: 'file moved up' });
                           }).catch(function(err) {
                              winston.error("Error while moving file up, err = [%s]", err);
                              Utils.next(400, err, next);
                           });
                        } else {
                           //awkward scenario
                           //the order of the file is greather than 0,
                           //but there isn't a object above it
                           Utils.sendJSONresponse(res, 400, {
                              message: "Awkward scenario! The order of the file is greather than 0, but there isn't an object above"
                           });
                        }
                     }).catch(function(err) {
                        winston.error("Error while moving file up, err = [%s]", err);
                        Utils.next(400, err, next);
                     });
                  } else {
                     Utils.sendJSONresponse(res, 200, { message: 'file moved up' });
                  }
               } else {
                  //file not found
                  Utils.sendJSONresponse(res, 400, { message: 'public file not found' });
               }
            });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined file id' });
   }
}

module.exports.moveFileDown = function(req, res, next) {
   var fileId = null;
   var publicFile = null;
   if (req.params.fileId) {
      fileId = req.params.fileId;
      return PublicFile //first, find the file
            .findOne({ _id: PublicFileModule.getMongoose().Types.ObjectId(fileId) })
            .then( async function(ppublicFile) {
               if (ppublicFile) {
                  //found the file
                  publicFile = ppublicFile;
                  //get the amount of objects in the same folder
                  try {
                     objectsAmount = await _countObjectsInFolder(publicFile.folder);
                  } catch (err) {
                     winston.error("Error while moving file down, err = [%s]", err);
                     Utils.next(400, err, next);
                     return;
                  }
                  if (publicFile.order < objectsAmount - 1) { //if the file is the last
                                                                      //it can't move down
                     //find the above object, file or folder
                     _findOneFileOrFolder({
                        folder:  publicFile.folder,
                        order: publicFile.order + 1
                     }).then(function(fileOrFolder) {
                        if (fileOrFolder) {
                           //move the above object down
                           fileOrFolder.order = publicFile.order;
                           fileOrFolder
                           .save()
                           .then(function(savedFileOrFolder) {
                              //move the file up
                              publicFile.order += 1;
                              return publicFile.save();
                           }).then(function(savedFile) {
                              Utils.sendJSONresponse(res, 200, { message: 'file moved down' });
                           }).catch(function(err) {
                              winston.error("Error while moving file down, err = [%s]", err);
                              Utils.next(400, err, next);
                           });
                        } else {
                           //awkward scenario
                           //the order of the file is greather than 0,
                           //but there isn't a object above it
                           Utils.sendJSONresponse(res, 400, {
                              message: "Awkward scenario! The order of the file is less than amount of objects in the folder less one, but there isn't an object below"
                           });
                        }
                     }).catch(function(err) {
                        winston.error("Error while moving file down, err = [%s]", err);
                        Utils.next(400, err, next);
                     });
                  } else {
                     Utils.sendJSONresponse(res, 200, { message: 'file moved down' });
                  }
               } else {
                  //file not found
                  Utils.sendJSONresponse(res, 400, { message: 'public file not found' });
               }
            });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined file id' });
   }
}

module.exports.downloadPublicFile = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");
   var publicFile;
   var folderPath;
   var notContinue = true;

   if(req.params.fileId) {
      PublicFile
            .findOne({ _id: PublicFileModule.getMongoose().Types.ObjectId(req.params.fileId) })
            .then( function(ppublicFile) {
               if (ppublicFile) {
                  publicFile = ppublicFile;
                  if (publicFile.folder) {
                     return _getFolderPath(publicFile.folder);
                  } else {
                     //the file is in the root folder
                     return [{ name: '' }]; //just the root folder in the path
                  }
               } else {
                  Utils.sendJSONresponse(res, 400, { message: 'public file not found' });
                  return notContinue;
               }
            }).then(function(folderPath) {
               if (folderPath === notContinue) {
                  return;
               }
               if(!folderPath) {
                  Utils.sendJSONresponse(res, 400, { message: 'parent folder of the file not found' });
                  return;
               }

               var sfolderPath = _folderPathAsString(folderPath);

               var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
               s3Client.getObject( camaraApiConfig.PublicFiles.s3Files.s3Bucket,
                                   camaraApiConfig.PublicFiles.s3Files.s3Folder + sfolderPath + "/" + publicFile.name,

                  function(err, dataStream) {
                     if (!err) {
                        res.set({
                          'Content-Type': publicFile.contentType,
                          'Content-Length': dataStream.headers['content-length'],
                          'Content-Disposition': 'inline;filename="relatorio.' + publicFile.extension + '"'
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
                           winston.error("Error while downloading public file, err = [%s]", err);
                        });
                     } else {
                        winston.error("Error while downloading public file, err = [%s]", err);
                        Utils.next(400, err, next);
                     }
                  });

            }).catch(function(err) {
               winston.error("Error while downloading public file, err = [%s]", err);
               Utils.next(400, err, next);
            });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined public file id' });
   }
}

module.exports.removePublicFile = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");
   var publicFile;
   var folderPath;
   var notContinue = true;

   if(req.params.fileId) {
      PublicFile
            .findOne({ _id: PublicFileModule.getMongoose().Types.ObjectId(req.params.fileId) })
            .then( function(ppublicFile) {
               if (ppublicFile) {
                  publicFile = ppublicFile;
                  return publicFile.remove();
               } else {
                  Utils.sendJSONresponse(res, 400, { message: 'public file not found' });
                  return notContinue;
               }
            }).then(function(removeFileActionResult) {
               if (removeFileActionResult === notContinue) {
                  return notContinue;
               }
               //file removed from mongodb, it hasn't removed from s3 yet

               //update orders of below elements
               return _updateFolderAndFilesOrders(publicFile.folder, publicFile.order);
            }).then(function(updateFolderAndFilesOrdersResult) {
               if (updateFolderAndFilesOrdersResult === notContinue) {
                  return notContinue;
               } else if (publicFile.folder) {
                  return _getFolderPath(publicFile.folder);
               } else {
                  //the file is in the root folder
                  return [{ name: '' }]; //just the root folder in the path
               }
            }).then(function(folderPath) {
               if (folderPath === notContinue) {
                  return;
               }
               if (!folderPath) {
                  Utils.sendJSONresponse(res, 400, { message: 'parent folder of the file not found' });
                  return;
               }
               var sfolderPath = _folderPathAsString(folderPath);

               var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
               s3Client.removeObject( camaraApiConfig.PublicFiles.s3Files.s3Bucket,
                                      camaraApiConfig.PublicFiles.s3Files.s3Folder + sfolderPath + "/" + publicFile.name,

                  function(err, dataStream) {
                     if (!err) {
                        Utils.sendJSONresponse(res, 200, { message: ' public file removed' });
                     } else {
                        winston.error("Error while removing public file, err = [%s]", err);
                        Utils.next(400, err, next);
                     }
                  });

            }).catch(function(err) {
               winston.error("Error while removing public file, err = [%s]", err);
               Utils.next(400, err, next);
            });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined public file id' });
   }
}

module.exports.removePublicFolder = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");
   var publicFolder;
   var folderPath;
   var notContinue = true;
   var objectsAmount = 0;

   if(req.params.folderId) {
      PublicFolder
            .findOne({ _id: PublicFolderModule.getMongoose().Types.ObjectId(req.params.folderId) })
            .then( async function(ppublicFolder) {
               if (ppublicFolder) {
                  publicFolder = ppublicFolder;
                  //get the amount of objects in the folder (in order to check if the folder is empty)
                  try {
                     objectsAmount = await _countObjectsInFolder(req.params.folderId);
                  } catch (err) {
                     winston.error("Error while moving file down, err = [%s]", err);
                     Utils.next(400, err, next);
                     return notContinue;
                  }
                  //don't remove the folder if it isn't empty
                  if (objectsAmount > 0) {
                     Utils.sendJSONresponse(res, 400, { message: 'the folder wasn\'t removed, it isn\'t empty' });
                     return notContinue;
                  } else {
                     return publicFolder.remove();
                  }
               } else {
                  Utils.sendJSONresponse(res, 400, { message: 'public folder not found' });
                  return notContinue;
               }
            }).then(function(removeFolderActionResult) {
               if (removeFolderActionResult === notContinue) {
                  return notContinue;
               }
               //folder removed from mongodb, it hasn't removed from s3 yet

               //update orders of below elements
               return _updateFolderAndFilesOrders(publicFolder.folder, publicFolder.order);
            }).then(function(updateFolderAndFilesOrdersResult) {
               if (updateFolderAndFilesOrdersResult === notContinue) {
                  return notContinue;
               } else if (publicFolder.folder) {
                  return _getFolderPath(publicFolder.folder);
               } else {
                  //the file is in the root folder
                  return [{ name: '' }]; //just the root folder in the path
               }
            }).then(function(folderPath) {
               if (folderPath === notContinue) {
                  return;
               }
               if (!folderPath) {
                  Utils.sendJSONresponse(res, 400, { message: 'parent folder of the folder not found' });
                  return;
               }
               var sfolderPath = _folderPathAsString(folderPath);

               var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
               s3Client.removeObject( camaraApiConfig.PublicFiles.s3Files.s3Bucket,
                                      camaraApiConfig.PublicFiles.s3Files.s3Folder + sfolderPath + "/" + publicFolder.name,

                  function(err, dataStream) {
                     if (!err) {
                        Utils.sendJSONresponse(res, 200, { message: 'public folder removed' });
                     } else {
                        winston.error("Error while removing public folder, err = [%s]", err);
                        Utils.next(400, err, next);
                     }
                  });

            }).catch(function(err) {
               winston.error("Error while removing public folder, err = [%s]", err);
               Utils.next(400, err, next);
            });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined public folder id' });
   }
}

module.exports.uploadPublicFile = function(req, res, next) {
   var notContinue = true;

   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No files were uploaded.' });
      return;
   }

   var publicFile = req.files.file;
   var fileName = req.params.fileName;
   var folderId = req.params.folderId;
   var htmlCharset = "";
   //if it is a html file set charset
   if (publicFile.mimetype === 'text/html') {
      htmlCharset = jschardet.detect(publicFile.data);
      publicFile.mimetype += "; charset=" + htmlCharset.encoding;
   }

   if (!fileName) {
      Utils.sendJSONresponse(res, 400, { message: 'file name required.' });
      return;
   }

   if (!folderId) {
      Utils.sendJSONresponse(res, 400, { message: 'folder id required.' });
      return;
   } else if (folderId === "null") { //root folder
      folderId = null;
   }

   //find the folder
   return _findFolderOrRootFolder(folderId) //first, find the folder
         .then(async function(publicFolder) {
            if (publicFolder === _findFolderResultIsRoot_) {
               return "";
            } else if(publicFolder) {
               return _getFolderPath(folderId);
            } else {
               Utils.sendJSONresponse(res, 400, { message: 'public folder not found' });
               return notContinue;
            }
         }).then(function(folderPath) {
            if(folderPath !== notContinue) {
               var sfolderPath = _folderPathAsString(folderPath);
               var camaraApiConfig = config.get("CamaraApi");

               var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);

               var fileNameParts = _.split(publicFile.name, '.');
               var extension = "";
               if (fileNameParts.length > 1) {
                  //append the extension file
                  extension =  fileNameParts[fileNameParts.length - 1];
               }
               //send the file to S3 server
               s3Client.putObject( camaraApiConfig.PublicFiles.s3Files.s3Bucket,
                                   camaraApiConfig.PublicFiles.s3Files.s3Folder + sfolderPath + "/" + fileName,
                                   publicFile.data,
                                   publicFile.data.length,
                                   publicFile.mimetype,
               function(err, etag) {
                  if (!err) {
                     Utils.sendJSONresponse(res, 200, {
                        message: 'public file uploaded and saved',
                        file: {
                           'name': fileName,
                           'length': publicFile.data.length,
                           'contentType': publicFile.mimetype,
                           'extension': extension,
                           'folderPath': sfolderPath,
                           'folder': folderId,
                           'url': camaraApiConfig.PublicFiles.s3Files.urlBase + sfolderPath + "/" + fileName
                        }
                     });
                  } else {
                     winston.error("Error while uploading public file, err = [%s]", err);
                     Utils.next(400, err, next);
                  }
               });
            }
         }).catch(function(err) {
            winston.error("Error while uploading a new public file, err = [%s]", err);
            Utils.next(400, err, next);
         });
}

module.exports.newFile = function(req, res, next) {
   if (!req.payload) {
      Utils.sendJSONresponse(res, 403, { message: 'you must be logged in' });
      return;
   }
   if (req.body.file) {
      winston.debug("Saving new public file ...");

      var file = req.body.file;
      var folderId = file.folder;
      var isRoot = true;
      var notContinue = true;

      _findFolderOrRootFolder(folderId)
      .then(function(folder) {
         if (folder === _findFolderResultIsRoot_ || folder) {
            return _countObjectsInFolder(folderId);
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'public folder not found' });
            return notContinue;
         }
      }).then(function (amountOfObjectsInFolder) {
         if(amountOfObjectsInFolder !== notContinue) {
            var publicFile = new PublicFile();

            publicFile.creationDate = new Date();
            publicFile.length = file.length;
            publicFile.order = amountOfObjectsInFolder;
            publicFile.isFolder = false;
            publicFile.creationUser = req.payload._id;
            publicFile.folder = folderId;
            publicFile.name = file.name;
            publicFile.description = file.description;
            publicFile.extension = file.extension;
            publicFile.contentType = file.contentType;

            publicFile.save(function(err, savedPublicFile) {
               if(!err) {
                  winston.verbose("Public file saved.");
                  Utils.sendJSONresponse(res, 200, {
                     message: 'public file saved',
                     id: savedPublicFile._id
                  });
               } else {
                  winston.error("Error while creating a new public file, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         }
      }).catch(function(err) {
         winston.error("Error while creating a new public file, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined file' });
   }
}

module.exports.newFolder = function(req, res, next) {
   if (!req.payload) {
      Utils.sendJSONresponse(res, 403, { message: 'you must be logged in' });
      return;
   }
   if (req.body.folder) {
      winston.debug("Saving creating new public folder ...");

      var folder = req.body.folder;
      var parentFolderId = folder.folder;
      var isRoot = true;
      var notContinue = true;

      _findFolderOrRootFolder(parentFolderId)
      .then(function(folder) {
         if (folder === _findFolderResultIsRoot_ || folder) {
            return _countObjectsInFolder(parentFolderId);
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'parent public folder not found' });
            return notContinue;
         }
      }).then(function (amountOfObjectsInFolder) {
         if(amountOfObjectsInFolder !== notContinue) {
            var publicFolder = new PublicFolder();

            publicFolder.creationDate = new Date();
            publicFolder.order = amountOfObjectsInFolder;
            publicFolder.isFolder = true;
            publicFolder.creationUser = req.payload._id;
            publicFolder.folder = parentFolderId;
            publicFolder.name = folder.name;
            publicFolder.description = folder.description;

            publicFolder.save(function(err, savedPublicFolder) {
               if(!err) {
                  winston.verbose("Public folder created.");
                  Utils.sendJSONresponse(res, 200, {
                     message: 'public folder created',
                     id: savedPublicFolder._id
                  });
               } else {
                  winston.error("Error while creating a new public folder, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         }
      }).catch(function(err) {
         winston.error("Error while creating a new public folder, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined folder' });
   }
}

module.exports.editFolder = function(req, res, next) {
   if (!req.payload) {
      Utils.sendJSONresponse(res, 403, { message: 'you must be logged in' });
      return;
   }
   if (req.body.folder && req.body.folder.id) {
      winston.debug("Saving changing public folder description ...");

      var folder = req.body.folder;

      _findFolderById(folder.id)
      .then(function (pfolder) {
         if (pfolder) {
            var publicFolder = new PublicFolder();

            pfolder.description = folder.description;

            pfolder.save(function(err, savedPublicFolder) {
               if (!err) {
                  winston.verbose("public folder description changed.");
                  Utils.sendJSONresponse(res, 200, {
                     message: 'public folder description changed',
                     id: savedPublicFolder._id
                  });
               } else {
                  winston.error("Error while changing public folder description, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'folder not found' });
         }
      }).catch(function (err) {
         winston.error("Error while changing public folder, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined folder' });
   }
}


module.exports.checkUniqueDescription = function(req, res, next) {
   var folderId = req.params.folderId;
   if (folderId === 'null') { //null denotes the root folder
      folderId = null;
   }
   var notContinue = true;

   if (folderId !== undefined) { //check if the folder id is set
      var description = req.query.description; //check if the description is set
      if (description) {
         _findFolderOrRootFolder(folderId) //check if the folder exists
         .then(function(folder) {
            if (folder === _findFolderResultIsRoot_ || folder) {
               //folder exists or is the root folder
               return findElementsByDescriptionIC(folderId, description);
            } else {
               //folder doesn't exist
               Utils.sendJSONresponse(res, 400, { message: 'public folder not found' });
               return notContinue;
            }
         }).then(function(foundElements) {
            if (foundElements !== notContinue) {
               if(!foundElements ||  foundElements.length === 0) {
                  Utils.sendJSONresponse(res, 200, { exists: false });
               } else {
                  Utils.sendJSONresponse(res, 200, { exists: true });
               }
            }
         }).catch(function(err) {
            winston.error("Error while checking if there is an element (subfolder or file) with given description in the folder, err = [%s]", err);
            Utils.next(400, err, next);
         });
      } else {
         Utils.sendJSONresponse(res, 400, { message: 'undefined description' });
      }
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined folder id' });
   }
}

module.exports.deleteRawFile = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if (req.query.filePath) {
      var filePath = req.query.filePath;
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //send the file to S3 server
      s3Client.removeObject( camaraApiConfig.PublicFiles.s3Files.s3Bucket,
                             camaraApiConfig.PublicFiles.s3Files.s3Folder + filePath,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'the public file was removed', 'filepath': filePath });
         } else {
            winston.error("Error while removing the public file , err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined file path to be removed' });
   }
}
