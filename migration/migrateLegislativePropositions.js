/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var urlDownloadLegislativePropositionFileAttachment = "http://www.camarasorocaba.sp.gov.br/sitecamara/proposituras/downloadanexo?codigo_arquivo=";
var urlLegislativeProposition = "http://localhost:3001/propositura.html?id=";
var urlMateriasLegislativasService = "http://localhost:3003/materiasLegislativas";

var config = require('config');
var winston = require('winston');
var uuidModule = require('uuid');
var _ = require('lodash');
var _requestService = require('request');
var Minio = require('minio');
var MySQLDatabase = require('./MySQLDatabase');
var createUserScript = require('./createUser');
var LegislativePropositionModule = require('../models/LegislativeProposition.js');
var LegislativeProposition = LegislativePropositionModule.getModel();
var LegislativePropositionTypeModule = require('../models/LegislativePropositionType.js');
var LegislativePropositionType = LegislativePropositionTypeModule.getModel();
var LegislativePropositionTagModule = require('../models/LegislativePropositionTag.js');
var LegislativePropositionTag = LegislativePropositionTagModule.getModel();
var LegislativePropositionRelationshipTypeModule = require('../models/LegislativePropositionRelationshipType.js');
var LegislativePropositionRelationshipType = LegislativePropositionRelationshipTypeModule.getModel();
var LegislativePropositionFileAttachmentModule = require('../models/LegislativePropositionFileAttachment.js');
var LegislativePropositionFileAttachment = LegislativePropositionFileAttachmentModule.getModel();

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');
var legislativePropositionTypesMap = {};
var legislativePropositionTagsMap = {};
var legislativePropositionRelationshipTypesMap = {};
var legislativePropositionMap = {};
var queryLegislativePropositions = "SELECT num_propositura, " +
                                   "       cod_tipo_propositura, " +
                                   "       dat_propositura, " +
                                   "       desc_ementa, " +
                                   "       txt_texto, " +
                                   "       txt_texto_consolidado, " +
                                   "       txt_texto_anexo, " +
                                   "       txt_texto_anexo_consolidado, " +
                                   "       cod_autor, " +
                                   "       str_login_alteracao, " +
                                   "       str_login_inclusao, " +
                                   "       dat_alteracao, " +
                                   "       dat_inclusao " +
                                   "FROM   tb_propositura ";

var queryLegislativePropositionTypes = "SELECT cod_tipo_propositura, " +
                                       "       desc_tipo_propositura " +
                                       "FROM   tb_tipo_propositura   ";

var queryAllLegislativePropositionTags =  "SELECT cod_classificacao, " +
                                       "       cod_tipo_propositura, " +
                                       "       desc_classificacao " +
                                       "FROM   tb_classificacao ";

var queryLegislativePropositionRelationshipTypes =  "SELECT cod_tipo_alteracao, " +
                                                    "       desc_tipo_alteracao, " +
                                                    "       cod_tipo_alteracao_antonimo " +
                                                    "FROM   tb_tipo_alteracao ";

var queryGetLegislativePropositonTags = "SELECT cod_tipo_propositura, " +
                                        "       cod_classificacao " +
                                        "FROM   tb_propositura_classificacao " +
                                        "WHERE  num_propositura = ? " +
                                        "AND    cod_tipo_propositura = ? ";

var queryGetLegislativePropositionRelationships = "SELECT cod_tipo_alteracao, " +
                                                  "       num_lei_altera, " +
                                                  "       cod_tipo_lei_altera " +
                                                  "FROM   tb_alteracao_lei " +
                                                  "WHERE  num_lei = ? " +
                                                  "AND    cod_tipo_lei = ? ";

var queryAllLegislativePropositonsFileAttachments = "SELECT num_propositura, " +
                                                    "       cod_tipo_propositura, " +
                                                    "       cod_arquivo, " +
                                                    "       str_nome_original, " +
                                                    "       str_nome_fisico, " +
                                                    "       bln_consolidado " +
                                                    "FROM   tb_arquivo_anexo " +
                                                    "WHERE  bln_consolidado = false ";

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
      } else {
         console.log("Content-type not found in the table, extension = [" + extension + "]")
         return "application/octet-stream";
      }
   }
}
//*****************************************************************************
var _legislativePropositionTagsMapPut = function (oldLegislativePropositionTag, newLegislativePropositionTag) {
   var legislativePropositionTypeCode = oldLegislativePropositionTag.cod_tipo_propositura;
   var tagCode = oldLegislativePropositionTag.cod_classificacao;
   var legislativePropositionTagTypeMap;
   if(legislativePropositionTagsMap[legislativePropositionTypeCode]) {
      legislativePropositionTagTypeMap = legislativePropositionTagsMap[legislativePropositionTypeCode];
   } else {
      legislativePropositionTagTypeMap = {};
      legislativePropositionTagsMap[legislativePropositionTypeCode] = legislativePropositionTagTypeMap;
   }
   legislativePropositionTagTypeMap[tagCode] = newLegislativePropositionTag;
}

var _legislativePropositionTagsMapGet = function(legislativePropositionTypeCode, tagCode) {
   if(legislativePropositionTagsMap[legislativePropositionTypeCode]) {
      return legislativePropositionTagsMap[legislativePropositionTypeCode][tagCode];
   } else {
      return undefined;
   }
}

var _legislativePropositionMapPut = function (oldLegislativeProposition, newLegislativeProposition) {
   var legislativePropositionTypeCode = oldLegislativeProposition.cod_tipo_propositura;
   var legislativePropositionNum = oldLegislativeProposition.num_propositura;
   var legislativePropositionTypeMap;
   if(legislativePropositionMap[legislativePropositionTypeCode]) {
      legislativePropositionTypeMap = legislativePropositionMap[legislativePropositionTypeCode];
   } else {
      legislativePropositionTypeMap = {};
      legislativePropositionMap[legislativePropositionTypeCode] = legislativePropositionTypeMap;
   }
   legislativePropositionTypeMap[legislativePropositionNum] = newLegislativeProposition;
}

var _legislativePropositionMapGet = function(legislativePropositionTypeCode, legislativePropositionNum) {
   if(legislativePropositionMap[legislativePropositionTypeCode]) {
      return legislativePropositionMap[legislativePropositionTypeCode][legislativePropositionNum];
   } else {
      return undefined;
   }
}

var _insertLegislativePropositionType = function (legislativePropositionType) {
   return new Promise(function(resolve, reject) {
      var newLegislativePropositionType = new LegislativePropositionType();

      newLegislativePropositionType.code = legislativePropositionType.cod_tipo_propositura;
      newLegislativePropositionType.description = legislativePropositionType.desc_tipo_propositura;

      newLegislativePropositionType.save(function(err, savedLegislativePropositionType) {
         if (!err) {
            resolve(savedLegislativePropositionType);
         } else {
            console.log("Error while saving the legislative proposition type, err = [" + err + "]");
            reject(err);
         }
      });
   });
}
//*****************************************************************************
var _insertLegislativePropositionTypes = async function (legislativePropositionTypes) {
   var legislativePropositionType;

   console.log("Migrating legislative proposition types ...");
   if (legislativePropositionTypes) {
      var k;
      try {
         for (k = 0; k < legislativePropositionTypes.length; k++) {
            legislativePropositionType = await _insertLegislativePropositionType(legislativePropositionTypes[k]);
            legislativePropositionTypesMap[legislativePropositionType.code] = legislativePropositionType;
         }
         console.log("Legislative proposition types migrated.");
         return Promise.resolve(true);
      } catch(error) {
         console.log("Error while migrating legislative proposition types, err = [" + error + "].");
         return Promise.reject(error);
      }
   }
}
//*****************************************************************************
var _insertLegislativePropositionTag = function (legislativePropositionTag) {
   return new Promise(function(resolve, reject) {
      var newLegislativePropositionTag = new LegislativePropositionTag();

      if (legislativePropositionTypesMap[legislativePropositionTag.cod_tipo_propositura]) {
         newLegislativePropositionTag.propositionType = legislativePropositionTypesMap[legislativePropositionTag.cod_tipo_propositura];
         newLegislativePropositionTag.description = legislativePropositionTag.desc_classificacao;

         newLegislativePropositionTag.save(function(err, savedLegislativePropositionTag) {
            if (!err) {
               resolve(savedLegislativePropositionTag);
            } else {
               console.log("Error while saving the legislative proposition tag, err = [" + err + "]");
               reject(err);
            }
         });
      } else {
         reject(new Error("Legislative type not found, code = " + legislativePropositionTag.cod_tipo_propositura));
      }
   });
}
//*****************************************************************************
var _insertLegislativePropositionTags = async function (legislativePropositionTags) {
   var legislativePropositionTag;

   console.log("Migrating legislative proposition tags ...");
   if (legislativePropositionTags) {
      var k;
      try {
         for (k = 0; k < legislativePropositionTags.length; k++) {
            legislativePropositionTag = await _insertLegislativePropositionTag(legislativePropositionTags[k]);
            _legislativePropositionTagsMapPut(legislativePropositionTags[k], legislativePropositionTag);
         }
         console.log("Legislative proposition tags migrated.");
         return Promise.resolve(true);
      } catch(error) {
         console.log("Error while migrating legislative proposition tags, err = [" + error + "].");
         return Promise.reject(error);
      }
   }
}
//*****************************************************************************
var _insertLegislativePropositionRelationshipType = function (legislativePropositionRelationshipType) {
   return new Promise(function(resolve, reject) {

      var newLegislativePropositionRelationshipType = new LegislativePropositionRelationshipType();
      newLegislativePropositionRelationshipType.code = legislativePropositionRelationshipType.cod_tipo_alteracao;
      newLegislativePropositionRelationshipType.antonymCode = legislativePropositionRelationshipType.cod_tipo_alteracao_antonimo;
      newLegislativePropositionRelationshipType.description = legislativePropositionRelationshipType.desc_tipo_alteracao;

      newLegislativePropositionRelationshipType.save(function(err, savedLegislativePropositionRelationshipType) {
            if (!err) {
               resolve(savedLegislativePropositionRelationshipType);
            } else {
               console.log("Error while saving the legislative proposition relationship type, err = [" + err + "]");
               reject(err);
            }
      });

   });
}
//*****************************************************************************
var _insertLegislativePropositionRelationshipTypes = async function (legislativePropositionRelationshipTypes) {
   var legislativePropositionRelationshipType;

   console.log("Migrating legislative proposition relationship types ...");
   if (legislativePropositionRelationshipTypes) {
      var k;
      try {
         for (k = 0; k < legislativePropositionRelationshipTypes.length; k++) {
            legislativePropositionRelationshipType = await _insertLegislativePropositionRelationshipType(legislativePropositionRelationshipTypes[k]);
            legislativePropositionRelationshipTypesMap[legislativePropositionRelationshipTypes[k].cod_tipo_alteracao] = legislativePropositionRelationshipType;
         }
         console.log("Legislative proposition relationship types migrated.");
         return Promise.resolve(true);
      } catch (error) {
         console.log("Error while migrating legislative proposition relationship types, err = [" + error + "].");
         return Promise.reject(error);
      }
   }
}
//*****************************************************************************
var _setLegislativePropositionRelationshipTypesAntonyms = async function () {
   console.log("Setting legislative proposition relationship types antonyms ...");
   return LegislativePropositionRelationshipType
      .find({})
      .then(async function(legislativePropositionRelationshipTypes) {
         var k;
         if (legislativePropositionRelationshipTypes) {
            for (k = 0; k < legislativePropositionRelationshipTypes.length; k++) {
               if (legislativePropositionRelationshipTypes[k].antonymCode) {
                  if (!legislativePropositionRelationshipTypesMap[legislativePropositionRelationshipTypes[k].antonymCode]) {
                     console.log("Legislative proposition relationship type not found to set antonym, antonymCode = [" + antonymCode + "].");
                  } else {
                     legislativePropositionRelationshipTypes[k].antonym = legislativePropositionRelationshipTypesMap[legislativePropositionRelationshipTypes[k].antonymCode];
                     await legislativePropositionRelationshipTypes[k].save();
                  }
               }
            }
         }
         console.log("Legislative proposition relationship types antonyms set.");
         return true;
      });
}
//*****************************************************************************
var _getLegislativePropositionFileAttachment = function (fileCode) {
   return new Promise(function(resolve, reject) {
      var chuncks = [];
      _requestService
            .get(urlDownloadLegislativePropositionFileAttachment + fileCode)
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
var _putLegislativePropositionFileAttachment = function (attachmentFile, fileData, fileLength) {
   var camaraApiConfig = config.get("CamaraApi");

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //use the uuid as the file name
   var fileName = uuidModule.v4();
   var extension = "";
   var fileNameParts = _.split(attachmentFile.str_nome_original, '.');
   if (fileNameParts.length > 1) {
      //append the extension file
      extension = fileNameParts[fileNameParts.length - 1];
      fileName +=  "." + extension;
   }
   var contentType = _getContentType(extension);
   return new Promise(function(resolve, reject) {
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.LegislativeProposition.s3LegislativePropositionAttachment.s3Bucket,
                          camaraApiConfig.LegislativeProposition.s3LegislativePropositionAttachment.s3Folder + "/" + fileName,
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
            console.log("Error while uploading file of the legislative proposition attachment, err = [" + err + "]");
            reject(err);
         }
      });
   });
}
//*****************************************************************************
var _setLinks = function (text, parentLegislativeProposition) {
   //var oldUrlPattern = /http\:\/\/www.camarasorocaba.sp.gov.br\/sitecamara\/proposituras\/verpropositura\?numero\_propositura\=(\d*)\&tipo_propositura=(\d)*/g;
   var oldUrlPattern = /http\:\/\/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&;//=]*)?/gi
   var camaraSorocabaVerProposituraCheck = /www.camarasorocaba.sp.gov.br\/sitecamara\/proposituras\/verpropositura/;
   var numProposituraRegex = /numero\_propositura\=(\d*)/;
   var tipoProposituraRegex = /tipo\_propositura\=(\d*)/;
   var begin;
   var end;
   var numPropositura;
   var tipoPropositura;
   var newText = "";
   var lastIndex = 0;
   var result;
   var numProposituraRegexResult;
   var tipoProposituraRegexResult;
   var legislativeProposition;

   while ((result = oldUrlPattern.exec(text)) !== null) {
      begin = result.index;
      end = oldUrlPattern.lastIndex;
      if (camaraSorocabaVerProposituraCheck.test(result[0])) {
         numProposituraRegexResult = numProposituraRegex.exec(result[0]);
         if (numProposituraRegexResult && numProposituraRegexResult.length > 1 && numProposituraRegexResult[1]) {
            numPropositura = parseInt(numProposituraRegexResult[1]);
         } else {
            numPropositura = null;
         }
         tipoProposituraRegexResult = tipoProposituraRegex.exec(result[0]);
         if (tipoProposituraRegexResult && tipoProposituraRegexResult.length > 1 && tipoProposituraRegexResult[1]) {
            tipoPropositura = parseInt(tipoProposituraRegexResult[1]);
         } else {
            tipoPropositura = null;
         }
         legislativeProposition = _legislativePropositionMapGet(tipoPropositura, numPropositura);
         if (legislativeProposition) {
            newText +=  text.substring(lastIndex, begin) + urlLegislativeProposition + legislativeProposition._id;
         } else {
            newText +=  text.substring(lastIndex, end);
            console.log("Legislative proposition URL found, legislative proposition not found in the map, url = [" + text.substring(begin, end) + "], num = [" + parentLegislativeProposition.number + "], legislativeTypeCode = [" + parentLegislativeProposition.type.description + "]");
         }
      } else {
         newText += text.substring(lastIndex, end);
         console.log("URL found, but not a legislative proposition URL, url = [" + text.substring(begin, end) + "], num = [" + parentLegislativeProposition.number + "], legislativeTypeCode = [" + parentLegislativeProposition.type.description + "]");
      }
      lastIndex = end;
   }
   newText += text.substring(lastIndex);
   return newText;
}
//*****************************************************************************
var _setLegislativePropositionLinks = function () {
   console.log("Setting legislative propositions relationships ...");
   return LegislativeProposition
      .find({})
      .populate('type')
      .then(async function(legislativePropositions) {
         var k;
         if (legislativePropositions) {
            for (k = 0; k < legislativePropositions.length; k++) {
               legislativePropositions[k].text = legislativePropositions[k].text ? _setLinks(legislativePropositions[k].text, legislativePropositions[k]) : legislativePropositions[k].text;
               legislativePropositions[k].consolidatedText = legislativePropositions[k].consolidatedText ? _setLinks(legislativePropositions[k].consolidatedText, legislativePropositions[k]) : legislativePropositions[k].consolidatedText;
               legislativePropositions[k].textAttachment = legislativePropositions[k].textAttachment ? _setLinks(legislativePropositions[k].textAttachment, legislativePropositions[k]) : legislativePropositions[k].textAttachment;
               legislativePropositions[k].consolidatedTextAttachment = legislativePropositions[k].consolidatedTextAttachment ? _setLinks(legislativePropositions[k].consolidatedTextAttachment, legislativePropositions[k]) : legislativePropositions[k].consolidatedTextAttachment;

               await legislativePropositions[k].save();
            }
         }
      });
}
//*****************************************************************************
var _insertLegislativeProposition = async function (connection, legislativeProposition) {
   return MySQLDatabase
            .query(connection, queryGetLegislativePropositonTags, [legislativeProposition.num_propositura, legislativeProposition.cod_tipo_propositura])
            .then(async function(tags) {
               var i;
               var tagsRefs = [];
               var tagRef = null;
               var typeRef = null;
               //set tags
               if (tags) {
                  for (i = 0; i < tags.length; i++) {
                     tagRef = _legislativePropositionTagsMapGet(tags[i].cod_tipo_propositura, tags[i].cod_classificacao);
                     if (tagRef) {
                        tagsRefs.push(tagRef);
                     } else {
                        console.log("Legislative proposition tag not found to include legislative proposition, legislativePropositionNum = [" + legislativeProposition.num_propositura + "], legislativePropositionTypeCode = [" + tags[i].cod_tipo_propositura + "], tagCode = [" + tags[i].cod_classificacao + "]");
                     }
                  }
               }
               //set type
               typeRef = legislativePropositionTypesMap[legislativeProposition.cod_tipo_propositura];
               if (!typeRef) {
                  console.log("Legislative proposition type not found to include legislative proposition, legislativePropositionNum = [" + legislativeProposition.num_propositura + "], legislativePropositionTypeCode = [" + legislativeProposition.cod_tipo_propositura + "]");
                  return false;
               }

               var newlegislativeProposition = new LegislativeProposition();
               var legislativePropositionDate = new Date(legislativeProposition.dat_propositura);
               newlegislativeProposition.number = legislativeProposition.num_propositura;
               newlegislativeProposition.year = legislativePropositionDate.getFullYear();
               newlegislativeProposition.date = legislativePropositionDate;
               newlegislativeProposition.description = legislativeProposition.desc_ementa;
               newlegislativeProposition.text = legislativeProposition.txt_texto;
               newlegislativeProposition.consolidatedText = legislativeProposition.txt_texto_consolidado;
               newlegislativeProposition.textAttachment = legislativeProposition.txt_texto_anexo;
               newlegislativeProposition.consolidatedTextAttachment = legislativeProposition.txt_texto_anexo_consolidado;
               newlegislativeProposition.creationDate = new Date();
               newlegislativeProposition.changedDate = null;
               newlegislativeProposition.type = typeRef;
               newlegislativeProposition.creationUser = createUserScript.getUser();
               newlegislativeProposition.changeUser = null;
               newlegislativeProposition.tags = tagsRefs;
               newlegislativeProposition.fileAttachments = [];
               newlegislativeProposition.consolidatedFileAttachments = [];
               newlegislativeProposition.relationships = [];

               return newlegislativeProposition.save();
            });
}
//*****************************************************************************
var _insertLegislativePropositions = async function (connection, legislativePropositions) {
   var legislativeProposition;
   var total;
   var k;
   var progress;
   var lastProgress = -1;

   console.log("Migrating legislative propositions ...");
   if (legislativePropositions) {
      total = legislativePropositions.length;
      try {
         for (k = 0; k < legislativePropositions.length; k++) {
            legislativeProposition = await _insertLegislativeProposition(connection, legislativePropositions[k]);
            _legislativePropositionMapPut(legislativePropositions[k], legislativeProposition)
            //show progress
            progress = Math.round(k / total * 100);
            if (progress % 5 === 0 && lastProgress !== progress) {
               console.log(progress + "%");
               lastProgress = progress;
            }
         }
         console.log("Legislative propositions migrated.");
         return Promise.resolve(true);
      } catch(error) {
         console.log("Error while migrating legislative propositions, err = [" + error + "].");
         return Promise.reject(error);
      }
   }
}
//*****************************************************************************
var _insertLegislativePropositionsFileAttachments = async function(fileAttachments) {
   console.log("Inserting legislative propositions attachments ...");
   var fileData;
   var savedFile;
   var legislativePropositionFileAttachment;
   var legislativePropositionInstance;
   var cont = false;
   var i = 0;
   var total;
   var progress;
   var lastProgress = -1;
   //set file attachments
   try {
      if (fileAttachments) {
         total = fileAttachments.length;
         for (i = 0; i < fileAttachments.length; i++) {
            legislativePropositionInstance = _legislativePropositionMapGet(fileAttachments[i].cod_tipo_propositura, fileAttachments[i].num_propositura);
            if (legislativePropositionInstance) {
               cont = true;
               try {
                  fileData = await _getLegislativePropositionFileAttachment(fileAttachments[i].cod_arquivo);
               } catch(error) {
                  cont = false;
                  console.log("Error while trying get legislative proposition file attachment, legislativePropositionNum = [" + fileAttachments[i].num_propositura + "], legislativePropositionTypeCode = [" + fileAttachments[i].cod_tipo_propositura + "], error = [" + error + "]");
               }
               if (cont) {
                  savedFile = await _putLegislativePropositionFileAttachment(fileAttachments[i], fileData, fileData.length);
                  legislativePropositionFileAttachment = new LegislativePropositionFileAttachment();
                  legislativePropositionFileAttachment.file = savedFile.fileName;
                  legislativePropositionFileAttachment.originalFilename = fileAttachments[i].str_nome_original;
                  legislativePropositionFileAttachment.contentType = savedFile.contentType;
                  legislativePropositionFileAttachment.legislativeProposition = legislativePropositionInstance;
                  legislativePropositionFileAttachment.consolidatedFileAttachment = fileAttachments[i].bln_consolidado;
                  await legislativePropositionFileAttachment.save();
                  await LegislativeProposition
                           .findById(legislativePropositionInstance._id)
                           .then(function(pLegislativePropositionInstance) {
                              pLegislativePropositionInstance.fileAttachments.push(legislativePropositionFileAttachment);
                              return pLegislativePropositionInstance.save();
                           });
               }
            } else {
               console.log("Legislative proposition not found to include legislative proposition attachment, legislativePropositionNum = [" + fileAttachments[i].num_propositura + "], legislativePropositionTypeCode = [" + fileAttachments[i].cod_tipo_propositura + "]");
            }
            //show progress
            progress = Math.round(i / total * 100);
            if (progress % 5 === 0 && lastProgress !== progress) {
               console.log(progress + "%");
               lastProgress = progress;
            }
         }
      }
      console.log("Legislative propositions inserted.");
      return Promise.resolve(true);
   } catch (error) {
      console.log("Error while inserting legislative propositions attachments, err = [" + error + "].")
      return Promise.reject(error);
   }
}
//*****************************************************************************
var _setLegislativePropositionsRelationships = async function (connection) {
   console.log("Setting legislative propositions relationships ...");
   return LegislativeProposition
      .find({})
      .populate('type')
      .then(async function(newLegislativePropositions) {
         var k;
         var i;
         var legislativePropositionRelationshipType;
         var otherLegislativeProposition;
         var total;
         var progress;
         var lastProgress;
         var relationships;

         if (newLegislativePropositions) {
            try {
               total = newLegislativePropositions.length;
               for (k = 0; k < newLegislativePropositions.length; k++) {
                  relationships = await MySQLDatabase.query(connection, queryGetLegislativePropositionRelationships, [newLegislativePropositions[k].number, newLegislativePropositions[k].type.code]);
                  if (relationships) {
                     for (i = 0; i < relationships.length; i++) {
                        legislativePropositionRelationshipType = legislativePropositionRelationshipTypesMap[relationships[i].cod_tipo_alteracao];
                        otherLegislativeProposition = _legislativePropositionMapGet(relationships[i].cod_tipo_lei_altera, relationships[i].num_lei_altera);
                        if(!legislativePropositionRelationshipType) {
                           console.log("Legislative proposition relationship type not found to set legislative proposition relationships, legislativePropositionRelationshipTypeCode = [" + relationships[i].cod_tipo_alteracao + "], legislativePropositionNum = [" + newLegislativePropositions[k].number + "], legislativePropositionTypeCode = [" + newLegislativePropositions[k].type.code + "]");
                        } else if(!otherLegislativeProposition) {
                           console.log("Other legislative proposition not found to set legislative proposition relationships, legislativePropositionNum = [" + newLegislativePropositions[k].number + "], legislativePropositionTypeCode = [" + newLegislativePropositions[k].type.code + "], otherLegislativePropositionNum = [" + relationships[i].num_lei_altera + "], otherLegislativePropositionTypeCode = [" + relationships[i].cod_tipo_lei_altera + "]");
                        } else {
                           if (!newLegislativePropositions[k].relationships) {
                              newLegislativePropositions[k].relationships = [];
                           }
                           newLegislativePropositions[k].relationships.push({
                              type: legislativePropositionRelationshipType,
                              otherLegislativeProposition: otherLegislativeProposition
                           });
                           await newLegislativePropositions[k].save();
                        }
                     }
                  }
                  //show progress
                  progress = Math.round(k / total * 100);
                  if (progress % 5 === 0 && lastProgress !== progress) {
                     console.log(progress + "%");
                     lastProgress = progress;
                  }
               }
            } catch(error) {
               return Promise.reject(error);
            }
         }
         console.log("Legislative propositions relationships set.");
         return true;
      });
}
//*****************************************************************************
var _getMateriasLegislativasLei = function(offset, limit) {
   return new Promise(function(resolve, reject) {
      _requestService({
         "uri": urlMateriasLegislativasService,
         "method": 'POST',
         "json": {
            "filter" : {
               "lei": 1,
               "offset": offset,
               "limit": limit
            }
         }},
         function (err, httpResponse, body) {
            if (err) {
               reject(err);
            } else {
               resolve(body);
            }
         }
      );
   });
}
//*****************************************************************************
var _setLegislativeProcessesProcessResult = async function(materiasLegislativas) {
   var k = 0;
   var materiasLegislativa;
   var numLei;
   var tipoLei;
   var legislativeProposition;
   try {
      for (k = 0; k < materiasLegislativas.length; k++) {
         materiasLegislativa = materiasLegislativas[k];
         numLei = materiasLegislativa.numLei;
         tipoLei = materiasLegislativa.tipoLei;
         legislativeProposition = _legislativePropositionMapGet(tipoLei, numLei);
         if (legislativeProposition) {
            await LegislativeProposition
                     .findById(legislativeProposition._id)
                     .then(async function(legislativePropositionInstance) {
                        legislativePropositionInstance.legislativeProcessId = materiasLegislativa.id;
                        return legislativePropositionInstance.save();
                     });
         } else {
            console.log("Setting legislative processes, legislative proposition not found in the map materia legislativa id = [" + materiasLegislativa.id + "], legislative proposition not found in the map, num = [" + numLei + "], legislativeTypeCode = [" + tipoLei + "]");
         }
      }
      return Promise.resolve(true);
   } catch(error) {
      return Promise.reject(error);
   }
}
//*****************************************************************************
var _setLegislativeProcesses = async function() {
   console.log("Setting legislative propositions processes ...");
   var offset = 0;
   var limit = 100;
   var total;
   var materiasLegislativas;
   var resultSize;
   var result;
   try {
      result = await _getMateriasLegislativasLei(offset, limit);
      if (result) {
         total = result.total;
         materiasLegislativas = result.materiasLegislativas;
         resultSize = materiasLegislativas.length;
         await _setLegislativeProcessesProcessResult(materiasLegislativas);
         offset += resultSize;
         while (offset < total) {
            result = await _getMateriasLegislativasLei(offset, limit);
            materiasLegislativas = result.materiasLegislativas;
            resultSize = materiasLegislativas.length;
            await _setLegislativeProcessesProcessResult(materiasLegislativas);
            offset += resultSize;
         }
      }
      console.log("Legislative propositions processes set.");
      return Promise.resolve(true);
   } catch(error) {
      console.log("Error while setting legislative propositions processes, err = [" + error + "].");
      return Promise.reject(error);
   }
}

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.run = async function () {
   winston.info("************migrateLegislativePropositions");
   var connectionPool = MySQLDatabase.createConnectionPool({
            "host": "camarasorocaba.sp.gov.br",
            "user": "admin",
            "password": "PnbdpC725",
            "database": "propositura",
            "queueLimit": 50,
            "connectionLimit": 50
   });

   var connection;
   return MySQLDatabase
            .openConnection(connectionPool).then(function(pconnection) {
               connection = pconnection;
               return MySQLDatabase.query(connection, queryLegislativePropositionTypes);
            }).then(function(legislativePropositionTypes) {
               return _insertLegislativePropositionTypes(legislativePropositionTypes);
            }).then(function() {
               return MySQLDatabase.query(connection, queryAllLegislativePropositionTags);
            }).then(function(legislativePropositionTags) {
               return _insertLegislativePropositionTags(legislativePropositionTags);
            }).then(function(legislativePropositionTags) {
               return MySQLDatabase.query(connection, queryLegislativePropositionRelationshipTypes);
            }).then(function(legislativePropositionRelationshipTypes) {
               return _insertLegislativePropositionRelationshipTypes(legislativePropositionRelationshipTypes);
            }).then(function() {
               return _setLegislativePropositionRelationshipTypesAntonyms();
            }).then(function() {
               return MySQLDatabase.query(connection, queryLegislativePropositions);
            }).then(function(legislativePropositions) {
               return _insertLegislativePropositions(connection, legislativePropositions);
            }).then(function() {
               return _setLegislativePropositionsRelationships(connection);
            }).then(function() {
               return MySQLDatabase.query(connection, queryAllLegislativePropositonsFileAttachments);
            }).then(function(legislativePropositonsFileAttachments) {
               return _insertLegislativePropositionsFileAttachments(legislativePropositonsFileAttachments);
            }).then(function() {
               return _setLegislativePropositionLinks();
            }).then(function() {
               return _setLegislativeProcesses();
            }).catch(function(error) {
               console.log("Error while migrating legislative proposition, err = [" + error + "].");
            });
}
