/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var User = require('../models/User.js').getModel();
var UserGroup = require('../models/UserGroup.js').getModel();
var SecurityRole = require('../models/SecurityRole.js').getModel();
var MenuAdmin = require('../models/MenuAdmin.js').getModel();
var MenuPortal = require('../models/MenuPortal.js').getModel();
var Banner = require('../models/Banner.js').getModel();
var HotNewsItem = require('../models/HotNewsItem.js').getModel();
var NewsItem = require('../models/NewsItem.js').getModel();
var Page = require('../models/Page.js').getModel();
var BreakingNews = require('../models/BreakingNewsItem.js').getModel();
var FBreakingNews = require('../models/FBreakingNewsItem.js').getModel();
var LicitacaoCategory = require('../models/LicitacaoCategory.js').getModel();
var LicitacaoEvent = require('../models/LicitacaoEvent.js').getModel();
var Licitacao = require('../models/Licitacao.js').getModel();
var LegislativeProposition = require('../models/LegislativeProposition.js').getModel();
var LegislativePropositionRemoved = require('../models/LegislativePropositionRemoved.js').getModel();
var LegislativePropositionType = require('../models/LegislativePropositionType.js').getModel();
var LegislativePropositionTag = require('../models/LegislativePropositionTag.js').getModel();
var LegislativePropositionFileAttachment = require('../models/LegislativePropositionFileAttachment.js').getModel();
var LegislativePropositionRelationshipType = require('../models/LegislativePropositionRelationshipType.js').getModel();
var PublicFolder = require('../models/PublicFolder.js').getModel();
var PublicFile = require('../models/PublicFile.js').getModel();
var async = require("async");
var Util = require("../util/Utils.js");
var fs = require("fs");
var loremIpsum = require("lorem-ipsum");
var Minio = require('minio');
var config = require('config');
var _ = require('lodash');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _sampleDataGenerationActivated = false;
var _sampleDataCleaningActivated = false;

/*****************************************************************************
******************************* PRIVATE **************************************
***************************(LOADING FUNCTIONS)********************************
/*****************************************************************************/
var _createS3Bucket = function(done) {
   //remove s3 bucket
   var camaraApiConfig = config.get("CamaraApi");
   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   winston.verbose("Creating s3 bucket ...");
   //send the file to S3 server
   s3Client
   .bucketExists(camaraApiConfig.PublicFiles.s3Files.s3Bucket)
   .then(function() {
      winston.verbose("S3 bucket already exists.");
      done(null, true);
      return true;
   }).catch(function() {
      return s3Client
             .makeBucket( camaraApiConfig.PublicFiles.s3Files.s3Bucket, 'us-east-1' );
   }).then(function(notContinue) {
      if(notContinue !== true) {
         winston.verbose("S3 bucket created.");
         done(null, true);
      }
   }).catch(function(err) {
      winston.error("Error while creating s3 bucket in SampleDataLoader, err = [%s]", err);
      done(err, false);
   });
}

//load legislative proposition types
var _loadLegislativePropositionTypes = function(done) {
   winston.verbose("Creating legislative proposition types ...");
   var legislativePropositionTypesList = [  { code: 1, description: "Lei Ordinária" },
                                            { code: 2, description: "Resolução" },
                                            { code: 3, description: "Decreto Legislativo" },
                                            { code: 4, description: "Emenda Lei Orgânica" },
                                            { code: 5, description: "Lei Orgânica" },
                                            { code: 6, description: "Regimento Interno" },
                                            { code: 7, description: "Lei Complementar" } ];
   LegislativePropositionType.insertMany(legislativePropositionTypesList, function(err) {
      if(err) {
         winston.error("Error while saving legislative proposition types for testing in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Legislative proposition types created.");
         done(null, true);
      }
   });
}

//load legislative proposition tags
var _loadLegislativePropositionTags = async function(done) {
   winston.verbose("Creating legislative proposition tags ...");

   var _getPropositionTypeIdByTypeCode = function(typeCode) {
      return new Promise(function(resolve, reject) {
         LegislativePropositionType.findOne({ 'code':  typeCode })
                                   .then(function(legislativePropositionType) {
                                      resolve(legislativePropositionType._id);
                                   }).catch(function(err) {
                                      reject(err);
                                   });
      });
   }

   var legislativePropositionTagsList = [ { propositionTypeCode: 1, description: "ADIN - Ação Direta de Inconstitucionalidade" },
                                          { propositionTypeCode: 1, description: "Agências Bancárias" },
                                          { propositionTypeCode: 1, description: "Alvarás/Licenças/registro" },
                                          { propositionTypeCode: 1, description: "Auxílio Financeiro/ Subvenções/ Empréstimos" },
                                          { propositionTypeCode: 1, description: "benefícios sociais" },
                                          { propositionTypeCode: 1, description: "Bens Públicos Municipais" },
                                          { propositionTypeCode: 1, description: "Campanhas/Divulgação" },
                                          { propositionTypeCode: 1, description: "Código de Arruamento e Loteamento" },
                                          { propositionTypeCode: 1, description: "Código de Obras" },
                                          { propositionTypeCode: 1, description: "Código de Posturas" },
                                          { propositionTypeCode: 1, description: "Código de Zoneamento" },
                                          { propositionTypeCode: 1, description: "Código Tributário" },
                                          { propositionTypeCode: 1, description: "Comércio e Indústria" },
                                          { propositionTypeCode: 1, description: "Concursos Públicos" },
                                          { propositionTypeCode: 1, description: "Conselhos ou Fundos Municipais" },
                                          { propositionTypeCode: 1, description: "Convênios/ Contratos / Termos de Cooperação" },
                                          { propositionTypeCode: 1, description: "Crianças/ Adolescentes / Jovens" },
                                          { propositionTypeCode: 1, description: "Cultura/ Esportes/ Lazer" },
                                          { propositionTypeCode: 1, description: "Datas Comemorativas/Conscientização" },
                                          { propositionTypeCode: 1, description: "Defesa dos Animais" },
                                          { propositionTypeCode: 1, description: "Denominações" },
                                          { propositionTypeCode: 1, description: "Direitos da Pessoa Humana" },
                                          { propositionTypeCode: 1, description: "Divulgação de Serviços e Benefícios / Informativos" },
                                          { propositionTypeCode: 1, description: "Educação" },
                                          { propositionTypeCode: 1, description: "Estrutura da Administração Pública" },
                                          { propositionTypeCode: 1, description: "Financiamentos do Poder Público" },
                                          { propositionTypeCode: 1, description: "Fiscalização" },
                                          { propositionTypeCode: 1, description: "Funcionalismo Público" },
                                          { propositionTypeCode: 1, description: "Habitação" },
                                          { propositionTypeCode: 1, description: "Idosos" },
                                          { propositionTypeCode: 1, description: "Isenções" },
                                          { propositionTypeCode: 1, description: "Lei de Diretrizes Orçamentárias" },
                                          { propositionTypeCode: 1, description: "Leis Publicadas pela Câmara" },
                                          { propositionTypeCode: 1, description: "Limpeza Urbana" },
                                          { propositionTypeCode: 1, description: "Meio Ambiente" },
                                          { propositionTypeCode: 1, description: "Mulher / Gestantes" },
                                          { propositionTypeCode: 1, description: "obras" },
                                          { propositionTypeCode: 1, description: "Orçamento" },
                                          { propositionTypeCode: 1, description: "Outras normas do município" },
                                          { propositionTypeCode: 1, description: "Parque Tecnológico" },
                                          { propositionTypeCode: 1, description: "Patrimônio Histórico" },
                                          { propositionTypeCode: 1, description: "Pessoas com Deficiências" },
                                          { propositionTypeCode: 1, description: "Planejamento Regional" },
                                          { propositionTypeCode: 1, description: "Plano Diretor" },
                                          { propositionTypeCode: 1, description: "Plano Plurianual" },
                                          { propositionTypeCode: 1, description: "Planta Genérica" },
                                          { propositionTypeCode: 1, description: "Prêmios / Homenagens" },
                                          { propositionTypeCode: 1, description: "Propaganda e Publicidade / Rádio/TV/Internet" },
                                          { propositionTypeCode: 1, description: "Religião" },
                                          { propositionTypeCode: 1, description: "Saúde" },
                                          { propositionTypeCode: 1, description: "Segurança Pública / Guarda Municipal / Bombeiros" },
                                          { propositionTypeCode: 1, description: "Serviço Funerário / Cemitérios" },
                                          { propositionTypeCode: 1, description: "Serviços" },
                                          { propositionTypeCode: 1, description: "Serviços de Água e Esgoto" },
                                          { propositionTypeCode: 1, description: "Serviços de Iluminação Pública" },
                                          { propositionTypeCode: 1, description: "Serviços de Telefonia Pública" },
                                          { propositionTypeCode: 1, description: "Símbolos Municipais" },
                                          { propositionTypeCode: 1, description: "Trânsito" },
                                          { propositionTypeCode: 1, description: "Transporte Coletivo / Táxi / Zona Azul" },
                                          { propositionTypeCode: 1, description: "Turismo" },
                                          { propositionTypeCode: 1, description: "Utilidade Pública / ONG / OSCIP" },
                                          { propositionTypeCode: 2, description: "Aprovação das Contas" },
                                          { propositionTypeCode: 2, description: "Área Municipal/Conservação" },
                                          { propositionTypeCode: 2, description: "Arquivo Público" },
                                          { propositionTypeCode: 2, description: "Banco de Curriculos" },
                                          { propositionTypeCode: 2, description: "Cadastro de Instituições" },
                                          { propositionTypeCode: 2, description: "Cidade Irmã" },
                                          { propositionTypeCode: 2, description: "Denominações/Galeria" },
                                          { propositionTypeCode: 2, description: "Documentos Oficiais/Papel Timbrado/Braille" },
                                          { propositionTypeCode: 2, description: "Frota Oficial" },
                                          { propositionTypeCode: 2, description: "Funcionalismo/Subsídio" },
                                          { propositionTypeCode: 2, description: "Leitura da Bíblia" },
                                          { propositionTypeCode: 2, description: "Licitação - Pregão/Edital" },
                                          { propositionTypeCode: 2, description: "Memorial" },
                                          { propositionTypeCode: 2, description: "Prêmios/Diplomas/Medalhas/Comemorações" },
                                          { propositionTypeCode: 2, description: "Projetos de Lei/Tramitação/Arquivamento" },
                                          { propositionTypeCode: 2, description: "Protocolo Interno" },
                                          { propositionTypeCode: 2, description: "Regimento Especial/LOM" },
                                          { propositionTypeCode: 2, description: "Regimento Interno/Alterações/Regulamentações" },
                                          { propositionTypeCode: 2, description: "Título de Cidadania" },
                                          { propositionTypeCode: 2, description: "Tribuna Popular" },
                                          { propositionTypeCode: 2, description: "TV Legislativa/Jornal" },
                                          { propositionTypeCode: 2, description: "Vereador Mirim" },
                                          { propositionTypeCode: 3, description: "Aprovação das Contas" },
                                          { propositionTypeCode: 3, description: "Certificados/Selos" },
                                          { propositionTypeCode: 3, description: "Crédito Suplementar / Orçamento" },
                                          { propositionTypeCode: 3, description: "Funcionalismo" },
                                          { propositionTypeCode: 3, description: "Homenagens/Comemorações" },
                                          { propositionTypeCode: 3, description: "Subsídios/Verba Representação do Executivo" },
                                          { propositionTypeCode: 3, description: "Sustação/Suspensão de Efeitos" },
                                          { propositionTypeCode: 3, description: "Título de Cidadania / Comenda" },
                                          { propositionTypeCode: 3, description: "TV Legislativa" },
                                          { propositionTypeCode: 3, description: "Utilidade Pública" }];
   var i;
   for(i = 0; i < legislativePropositionTagsList.length; i++) {
      var legislativePropositionTagsItem = legislativePropositionTagsList[i];
      var propositionTypeId = await _getPropositionTypeIdByTypeCode(legislativePropositionTagsItem.propositionTypeCode);
      legislativePropositionTagsItem.propositionType = propositionTypeId;
      delete legislativePropositionTagsItem.propositionTypeCode;
   }
   LegislativePropositionTag.insertMany(legislativePropositionTagsList, function(err) {
      if(err) {
         winston.error("Error while saving legislative proposition tags for testing in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Legislative proposition tags created.");
         done(null, true);
      }
   });
}

//load legislative proposition relationship types
var _loadLegislativePropositionRelationshipType = function(done) {
   var _findLegislativePropositionRelationshipTypeByCode = function(legislativePropositionRelationshipTypes, code) {
      if(legislativePropositionRelationshipTypes) {
         var i;
         for(i = 0; i < legislativePropositionRelationshipTypes.length; i++) {
            var legislativePropositionRelationshipType = legislativePropositionRelationshipTypes[i];
            if(legislativePropositionRelationshipType.code === code) {
               return legislativePropositionRelationshipType;
            }
         }
      }
      return null;
   }
   winston.verbose("Creating legislative proposition relationship types ...");
   var legislativePropositionRelationshipTypesList = [ { code: 1, description: "Altera a Lei", antonymCode: 2 },
                                                       { code: 2, description: "Alterada pela Lei", antonymCode: 1 },
                                                       { code: 3, description: "Revoga a Lei", antonymCode: 4 },
                                                       { code: 4, description: "Revogada pela Lei", antonymCode: 3 },
                                                       { code: 5, description: "Versa sobre matéria da Lei", antonymCode: 6 },
                                                       { code: 6, description: "Tem matéria versada na Lei", antonymCode: 5 },
                                                       { code: 7, description: "Represtina a Lei", antonymCode: 8 },
                                                       { code: 8, description: "É Represtinada pela Lei", antonymCode: 7 } ];
   LegislativePropositionRelationshipType.insertMany(legislativePropositionRelationshipTypesList, async function(err, legislativePropositionRelationshipTypes) {
      if(err) {
         winston.error("Error while saving legislative proposition relationship types for testing in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         //set antonym field
         var i;
         for(i = 0; i < legislativePropositionRelationshipTypes.length; i++) {
            var legislativePropositionRelationshipType = legislativePropositionRelationshipTypes[i];
            var antonymLegislativePropositionRelationshipType = _findLegislativePropositionRelationshipTypeByCode(legislativePropositionRelationshipTypes, legislativePropositionRelationshipType.antonymCode);
            if(antonymLegislativePropositionRelationshipType) {
               legislativePropositionRelationshipType.antonym = antonymLegislativePropositionRelationshipType._id;
               await legislativePropositionRelationshipType.save();
            }
         }
         winston.verbose("Legislative proposition relationship types created.");
         done(null, true);
      }
   });
}

//load legislative propositions
var _loadLegislativePropositions = function(done) {
   winston.verbose("Creating legislative propositions ...");

   //auxiliaries stuffs
   var _insertLegislativePropositionAttachment = function(legislativePropositionAttachment) {
      return new Promise(function(resolve, reject) {
         var legislativePropositionFileAttachment = new LegislativePropositionFileAttachment();

         legislativePropositionFileAttachment.file = legislativePropositionAttachment.file;
         legislativePropositionFileAttachment.originalFilename = legislativePropositionAttachment.originalFilename;
         legislativePropositionFileAttachment.contentType = legislativePropositionAttachment.contentType;
         legislativePropositionFileAttachment.legislativeProposition = legislativePropositionAttachment.legislativeProposition;
         legislativePropositionFileAttachment.consolidatedFileAttachment = legislativePropositionAttachment.consolidatedFileAttachment;

         legislativePropositionFileAttachment
            .save()
            .then(function(result) {
               resolve(result);
         }).catch(function(error) {
               reject(error);
         });
      });
   }

   var _equalsObjectId = function(id1, id2) {
      if(id1 && id2) {
         if(id1.id.length === id2.id.length) {
            var j;
            for(j = 0; j < id1.id.length; j++) {
               if(id1.id[j] !== id2.id[j]) {
                  return false;
               }
            }
            return true;
         } else {
            return false;
         }
      } else {
         return false;
      }
   }

   var _getPropositionTagsForType = function(propositionTags, propositionType) {
      if(propositionTags && propositionTags.length > 0) {
         var i;
         var propositionTagsToBeReturned = [];
         for(i = 0; i < propositionTags.length; i++) {
            var propositionTag = propositionTags[i];
            if(_equalsObjectId(propositionType._id, propositionTag.propositionType)) {
               propositionTagsToBeReturned.push(propositionTag);
            }
         }
         return propositionTagsToBeReturned;
      } else {
         return null;
      }
   }

   var _getRandomPropositionTag = function(propositionTags) {
      if(propositionTags && propositionTags.length > 0) {
         var propositionTagIndex = Util.random(0, propositionTags.length - 1);
         var randomPropositionTag = propositionTags[propositionTagIndex];
         propositionTags.splice(propositionTagIndex, 1);
         return randomPropositionTag;
      } else {
         return null;
      }
   }

   var legislativePropositionAttachmentFileTestBuffer = fs.readFileSync("./test/resources/legislative_proposition_attachment_file.pdf", { flag: 'r' });
   var legislativePropositionConsolidatedAttachmentFileTestBuffer = fs.readFileSync("./test/resources/legislative_proposition_consolidated_attachment_file.pdf", { flag: 'r' });
   var legislativePropositionTypes = null;
   var legislativePropositionTags = null;
   var users = null;
   var legislativePropositionRelationshipTypes = null;

   //upload the file test to S3
   var camaraApiConfig = config.get("CamaraApi");
   var legislativePropositionAttachmentFilename = "legislative_proposition_attachment_file.pdf";
   var legislativePropositionConsolidatedAttachmentFilename = "legislative_proposition_consolidated_attachment_file.pdf";

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //send the file to S3 server
   s3Client.putObject( camaraApiConfig.LegislativeProposition.s3LegislativePropositionAttachment.s3Bucket,
                       camaraApiConfig.LegislativeProposition.s3LegislativePropositionAttachment.s3Folder + "/" + legislativePropositionAttachmentFilename,
                       legislativePropositionAttachmentFileTestBuffer,
                       legislativePropositionAttachmentFileTestBuffer.length,
                       "application/pdf")
           .then(function(etag) {
               return s3Client.putObject( camaraApiConfig.LegislativeProposition.s3LegislativePropositionConsolidatedAttachment.s3Bucket,
                                          camaraApiConfig.LegislativeProposition.s3LegislativePropositionConsolidatedAttachment.s3Folder + "/" + legislativePropositionConsolidatedAttachmentFilename,
                                          legislativePropositionConsolidatedAttachmentFileTestBuffer,
                                          legislativePropositionConsolidatedAttachmentFileTestBuffer.length,
                                          "application/pdf");
           //var legislativePropositionRelationshipTypes = null;
           }).then(function(etag) {
               return LegislativePropositionType.find({});
           }).then(function(plegislativePropositionTypes) {
               legislativePropositionTypes = plegislativePropositionTypes;
               return LegislativePropositionTag.find({});
           }).then(function(plegislativePropositionTags) {
               legislativePropositionTags = plegislativePropositionTags;
               return User.find({});
           }).then(function(pusers) {
               users = pusers;
               return LegislativePropositionRelationshipType.find({});
           }).then(function(plegislativePropositionRelationshipTypes) {
               legislativePropositionRelationshipTypes = plegislativePropositionRelationshipTypes;

               var legislativePropositions = [];
               var i;
               for(i = 1; i <= 2621; i++) {

                  var consolidated = Util.random(0, 1); //0 - not consolidated, 1 - consolidated
                  var changed = Util.random(0, 1); //0 - not consolidated, 1 - consolidated
                  var creationDate = Util.randomDateAndTimeInMinutes(2015,11,1, 2018,0,10);

                  //number
                  var propositionNumber = i;
                  //date
                  var propositionDate = new Date(creationDate.getTime() - Util.random(1, 3 * 86400) * 1000);
                  //year
                  var propositionYear = propositionDate.getFullYear();
                  //description
                  var propositionDescription = loremIpsum({ count: Util.random(2, 20) , units: 'words' });
                  //text
                  var propositionText = loremIpsum({ count: 5,
                                                     units: 'paragraphs',
                                                     sentenceLowerBound: 5,
                                                     sentenceUpperBound: 15,
                                                     paragraphLowerBound: 3,
                                                     paragraphUpperBound: 7,
                                                     format: 'html' });
                  //consolidated_text
                  var propositionConsolidatedText = consolidated
                                                      ? loremIpsum({ count: 5,
                                                                     units: 'paragraphs',
                                                                     sentenceLowerBound: 5,
                                                                     sentenceUpperBound: 15,
                                                                     paragraphLowerBound: 3,
                                                                     paragraphUpperBound: 7,
                                                                     format: 'html' })
                                                      : null;
                  //text_attachment
                  var propositionTextAttachment = loremIpsum({ count: 5,
                                                               units: 'paragraphs',
                                                               sentenceLowerBound: 5,
                                                               sentenceUpperBound: 15,
                                                               paragraphLowerBound: 3,
                                                               paragraphUpperBound: 7,
                                                               format: 'html' });
                  //consolidated_text_attachment
                  var consolidatedPropositionTextAttachment = consolidated
                                                                  ? loremIpsum({ count: 5,
                                                                                 units: 'paragraphs',
                                                                                 sentenceLowerBound: 5,
                                                                                 sentenceUpperBound: 15,
                                                                                 paragraphLowerBound: 3,
                                                                                 paragraphUpperBound: 7,
                                                                                 format: 'html' })
                                                                  : null;
                  //creationDate
                  var creationDate = Util.randomDateAndTimeInMinutes(2015,11,1, 2018,0,10);
                  //changedDate
                  var changedDate = changed === 0
                                             ? null
                                             : (  new Date(creationDate.getTime() + Util.random(1, 7 * 86400) * 1000) );
                  //type
                  var propositionTypeIndex = null;
                  var propositionType = null;
                  if (legislativePropositionTypes && legislativePropositionTypes.length > 0) {
                     propositionTypeIndex = Util.random(0, legislativePropositionTypes.length - 1);
                     propositionType = legislativePropositionTypes[propositionTypeIndex];
                  }
                  //creationUser
                  var propositionCreationUserIndex = null;
                  var propositionCreationUser = null;
                  if(users && users.length > 0) {
                     propositionCreationUserIndex = Util.random(0, users.length - 1);
                     propositionCreationUser = users[propositionCreationUserIndex];
                  }
                  //changeUser
                  var propositionChangedUserIndex = null;
                  var propositionChangedUser = null;
                  if(users && users.length > 0) {
                     propositionChangedUserIndex = Util.random(0, users.length - 1);
                     propositionChangedUser = users[propositionChangedUserIndex];
                  }
                  //tags
                  var propositionTagsForThisInstance = [];
                  if(legislativePropositionTags && legislativePropositionTags.length > 0) {
                     var propositionTagsForThisType = _getPropositionTagsForType(legislativePropositionTags, propositionType);
                     if(propositionTagsForThisType && propositionTagsForThisType.length > 0) {
                        var propositionTagsAmount = Util.random(0, Math.min(3, propositionTagsForThisType.length));
                        var k;
                        var propositionTagsForThisInstance = [];
                        for(k = 0; k < propositionTagsAmount; k++) {
                           var randomPropositionTagsForThisInstance = _getRandomPropositionTag(propositionTagsForThisType);
                           propositionTagsForThisInstance.push(randomPropositionTagsForThisInstance);
                        }
                     }
                  }
                  //file attachments
                  var propositionFileAttachments = [];
                  //consolidatedFileAttachments
                  var consolidatedPropositionFileAttachments = [];
                  //relationships
                  var propositionRelationships = [];

                  legislativePropositions.push({
                     "number": propositionNumber,
                     "year" : propositionYear,
                     "date": propositionDate,
                     "description": propositionDescription,
                     "text" : propositionText,
                     "consolidatedText": propositionConsolidatedText,
                     "textAttachment": propositionTextAttachment,
                     "consolidatedTextAttachment": consolidatedPropositionTextAttachment,
                     "creationDate": creationDate,
                     "changedDate": changedDate,
                     "type": propositionType,
                     "creationUser": propositionCreationUser,
                     "changeUser": propositionChangedUser,
                     "tags": propositionTagsForThisInstance,
                     "fileAttachments": propositionFileAttachments,
                     "consolidatedFileAttachments": consolidatedPropositionFileAttachments,
                     "relationships": propositionRelationships
                  });
               }

               return LegislativeProposition.insertMany(legislativePropositions);
           }).then(async function(insertedLegislativePropositions) {
             //fileAttachments
             var propositionFileAttachments = [];
             var i = 0;
             for(i = 0; i < insertedLegislativePropositions.length; i++) {
                var insertedLegislativeProposition = insertedLegislativePropositions[i];
                var legislativePropositionsAttachmentAmount = Util.random(0, 3);
                var j;
                propositionFileAttachments = [];
                for(j = 0; j < legislativePropositionsAttachmentAmount; j++) {
                   var savedLegislativePropositionFileAttachment = await _insertLegislativePropositionAttachment({
                      'file': legislativePropositionAttachmentFilename,
                      'originalFilename': legislativePropositionAttachmentFilename,
                      'contentType': 'application/pdf',
                      'legislativeProposition': insertedLegislativeProposition,
                      'consolidatedFileAttachment': false
                   });
                   propositionFileAttachments.push(savedLegislativePropositionFileAttachment);
                }
                insertedLegislativeProposition.fileAttachments = propositionFileAttachments;
                await insertedLegislativeProposition.save();
             }
             return insertedLegislativePropositions;
           }).then(async function(insertedLegislativePropositions) {
             //consolidatedFileAttachments
             var propositionFileAttachments = [];
             var i = 0;
             for(i = 0; i < insertedLegislativePropositions.length; i++) {
                var insertedLegislativeProposition = insertedLegislativePropositions[i];
                var legislativePropositionsAttachmentAmount = Util.random(0, 3);
                var j;
                propositionFileAttachments = [];
                for(j = 0; j < legislativePropositionsAttachmentAmount; j++) {
                   var savedLegislativePropositionFileAttachment = await _insertLegislativePropositionAttachment({
                      'file': legislativePropositionConsolidatedAttachmentFilename,
                      'originalFilename': legislativePropositionConsolidatedAttachmentFilename,
                      'contentType': 'application/pdf',
                      'legislativeProposition': insertedLegislativeProposition,
                      'consolidatedFileAttachment': true
                   });
                   propositionFileAttachments.push(savedLegislativePropositionFileAttachment);
                }
                insertedLegislativeProposition.consolidatedFileAttachments = propositionFileAttachments;
                await insertedLegislativeProposition.save();
             }
             return insertedLegislativePropositions;
           }).then(async function(insertedLegislativePropositions) {
             //propositionRelationships
             var propositionRelationships = [];
             var otherLegislativePropositionIndex = null;
             var otherLegislativeProposition = null;
             var legislativePropositionRelationshipTypeIndex = null;
             var legislativePropositionRelationshipType = null;
             var i = 0;
             for(i = 0; i < insertedLegislativePropositions.length; i++) {
                var insertedLegislativeProposition = insertedLegislativePropositions[i];
                var propositionRelationshipsAmount = Util.random(0, 3);
                var j;
                propositionRelationships = [];
                for(j = 0; j < propositionRelationshipsAmount; j++) {
                   if(legislativePropositionRelationshipTypes && legislativePropositionRelationshipTypes.length > 0) {
                     legislativePropositionRelationshipTypeIndex = Util.random(0, legislativePropositionRelationshipTypes.length - 1);
                     legislativePropositionRelationshipType = legislativePropositionRelationshipTypes[legislativePropositionRelationshipTypeIndex];
                     otherLegislativePropositionIndex = Util.random(0, insertedLegislativePropositions.length - 1);
                     otherLegislativeProposition = insertedLegislativePropositions[otherLegislativePropositionIndex];
                     propositionRelationships.push({
                        'type': legislativePropositionRelationshipType._id,
                        'otherLegislativeProposition': otherLegislativeProposition._id
                     });
                   }
                }
                insertedLegislativeProposition.relationships = propositionRelationships;
                await insertedLegislativeProposition.save();
             }
             winston.verbose("Legislative propositions created.");
             done(null, true);
          }).catch(function(err) {
             winston.error("Error while creating legislative propositions for testing in SampleDataLoader, err = [%s]", err);
             done(err, false);
          });
}

//load licitacao categories
var _loadLicitacaoCategories = function(done) {
   winston.verbose("Creating licitacao categories ...");
   var licitacaoCategoryList = [
      { description: 'Concorrência' },
      { description: 'Convite' },
      { description: 'Pregão' },
      { description: 'Tomada de Preço' }
   ];

   LicitacaoCategory.insertMany(licitacaoCategoryList, function(err) {
      if(err) {
         winston.error("Error while saving licitacao categories for testing in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Licitacoes category created.");
         done(null, true);
      }
   });
}

//load licitacoes
var _loadLicitacoes = function(done) {
   winston.verbose("Creating licitacoes ...");

   var _insertLicitacaoEvent = function (licitacaoEvent) {
      return new Promise(function(resolve, reject) {
         var licitacaoEventModel = new LicitacaoEvent();
         licitacaoEventModel.description = licitacaoEvent.description;
         licitacaoEventModel.date = licitacaoEvent.date;
         licitacaoEventModel.creationDate = licitacaoEvent.creationDate;
         licitacaoEventModel.changedDate = licitacaoEvent.changedDate;
         licitacaoEventModel.file = licitacaoEvent.file;
         licitacaoEventModel.originalFilename = licitacaoEvent.originalFilename;
         licitacaoEventModel.contentType = licitacaoEvent.contentType;
         licitacaoEventModel.licitacao = licitacaoEvent.licitacao;
         licitacaoEventModel.save().then(function(result) {
            resolve(result);
         }).catch(function(error) {
            reject(error);
         });
      });
   }

   var licitacaoEventTestBuffer = fs.readFileSync("./test/resources/licitacao_event_file.pdf", { flag: 'r' });

   //upload the file test to S3
   var camaraApiConfig = config.get("CamaraApi");
   var licitacaoEventTestFilename = "licitacao_event_file.pdf";

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //send the file to S3 server
   s3Client.putObject( camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Bucket,
                       camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Folder + "/" + licitacaoEventTestFilename,
                       licitacaoEventTestBuffer,
                       licitacaoEventTestBuffer.length,
                       "application/pdf")
           .then(function(etag) {
               return LicitacaoCategory.find({});
           }).then(async function(licitacaoCategories) {
               var licitacaoCategoriesLength = licitacaoCategories.length;

               var licitacoes = [];
               var i;
               for(i = 1; i <= 1000; i++) {
                  var state = Util.random(0, 2); //0 - create, 1 - published, 2 - invisible
                  var creationDate = Util.randomDateAndTimeInMinutes(2015,11,1, 2018,0,10);
                  var publicationDate = state === 1
                                             ? new Date(creationDate.getTime() + Util.random(1, 7 * 86400) * 1000)
                                             : null;
                  var lastEditDate = state === 0
                                             ? null
                                             : ( publicationDate
                                                      ? new Date(publicationDate.getTime() + Util.random(1, 7 * 86400) * 1000)
                                                      : new Date(creationDate.getTime() + Util.random(1, 7 * 86400) * 1000)
                                               );
                  var randomCategoryIndex = Util.random(0, licitacaoCategoriesLength - 1);
                  var randomCategory = licitacaoCategories[randomCategoryIndex];
                  licitacoes.push({
                        'number': i,
                        'year': creationDate.getFullYear(),
                        'description': loremIpsum({ count: Util.random(10, 60) , units: 'words' }),
                        'publicationDate': publicationDate,
                        'creationDate': creationDate,
                        'changedDate': lastEditDate,
                        'state': state,
                        'category': randomCategory._id,
                        'events': []
                  });
               }

               return Licitacao.insertMany(licitacoes);
           }).then(async function(insertedLicitacoes) {
             var i = 0;
             for(i = 0; i < insertedLicitacoes.length; i++) {
                var licitacao = insertedLicitacoes[i];
                var events = [];
                var eventsAmount = Util.random(1, 6);
                var j;
                if(licitacao.publicationDate !== null) {
                   for(j = 0; j < eventsAmount; j++) {
                      var changedEvent = Util.random(0, 1);

                      var dateEvent = new Date(licitacao.publicationDate.getTime() + Util.random(1, 7 * 86400) * 1000);
                      var creationDateEvent = dateEvent;
                      //changedDate
                      var changedDateEvent = changedEvent === 0
                                             ? null
                                             : (  new Date(creationDateEvent.getTime() + Util.random(1, 7 * 86400) * 1000) );

                      var savedLicitacaoEvent = await _insertLicitacaoEvent({
                        'description': loremIpsum({ count: Util.random(2, 6) , units: 'words' }),
                        'date': new Date(licitacao.publicationDate.getTime() + Util.random(1, 7 * 86400) * 1000),
                        'creationDate': creationDateEvent,
                        'changedDate': changedDateEvent,
                        'file': licitacaoEventTestFilename,
                        'originalFilename': 'original_' + licitacaoEventTestFilename,
                        'contentType': 'application/pdf',
                        'licitacao': licitacao
                      });
                      events.push(savedLicitacaoEvent);
                   }
                   licitacao.events = events;
                   await licitacao.save();
                }
             }
             winston.verbose("Licitacoes created.");
             done(null, true);
           }).catch(function(err) {
               winston.error("Error while creating licitacoes for testing in SampleDataLoader, err = [%s]", err);
               done(err, false);
           });
}

//load breaking news items
var _loadFBreakingNews = function(done) {

   winston.verbose("Creating fixed breaking news items ...");
   var fbreakingNewsList = [];

   var fbreakingNewsItemTestBuffer1 = fs.readFileSync("./test/resources/fbreaking_news_1.jpg", { flag: 'r' });

   //upload the thumbnail test to S3
   var camaraApiConfig = config.get("CamaraApi");
   var fbreakingNewsItemImageFilename1 = "fbreaking_news_1.jpg";

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //send the file to S3 server
   s3Client.putObject( camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Bucket,
                       camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Folder + "/" + fbreakingNewsItemImageFilename1,
                       fbreakingNewsItemTestBuffer1,
                       fbreakingNewsItemTestBuffer1.length,
                       "image/jpeg")
           .then(function(etag) {
             var fbreakingNewsItemTestBuffer2 = fs.readFileSync("./test/resources/fbreaking_news_2.jpg", { flag: 'r' });
             var fbreakingNewsItemImageFilename2 = "fbreaking_news_2.jpg";

             return s3Client.putObject( camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Bucket,
                                        camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Folder + "/" + fbreakingNewsItemImageFilename2,
                                        fbreakingNewsItemTestBuffer2,
                                        fbreakingNewsItemTestBuffer2.length,
                                        "image/jpeg");
           }).then(function(etag) {
             var fbreakingNewsItemTestBuffer3 = fs.readFileSync("./test/resources/fbreaking_news_3.jpg", { flag: 'r' });
             var fbreakingNewsItemImageFilename3 = "fbreaking_news_3.jpg";

             return s3Client.putObject( camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Bucket,
                                        camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Folder + "/" + fbreakingNewsItemImageFilename3,
                                        fbreakingNewsItemTestBuffer3,
                                        fbreakingNewsItemTestBuffer3.length,
                                        "image/jpeg");
           }).then(function(etag) {
                //the upload has been successfully completed
                //then insert the breaking news items
                var fbreakingNewsItems = [];
                var i;
                for (i = 1; i <= 3; i++) {
                   var fbreakingNewsItem = {};
                   fbreakingNewsItem.headline = "Headline #" + i;
                   fbreakingNewsItem.headlineIcon = "ion-ios7-people";
                   fbreakingNewsItem.title = "Fixed breaking news #" + i;
                   fbreakingNewsItem.date = new Date();
                   fbreakingNewsItem.views = 0;
                   fbreakingNewsItem.type = "link";
                   fbreakingNewsItem.imageFile = "fbreaking_news_" + i + ".jpg";
                   fbreakingNewsItem.access = { target : "_blank",
                                               url : "http://uol.com.br"
                                             };
                   fbreakingNewsItem.order = i;
                   fbreakingNewsItem.deleted = false;
                   fbreakingNewsItems.push(fbreakingNewsItem);
                }
                FBreakingNews.insertMany(fbreakingNewsItems, function(err) {
                   if(err) {
                      winston.error("Error while saving fixed breaking news items for testing in SampleDataLoader, err = [%s]", err);
                      done(err, false);
                   } else {
                      winston.verbose("Fixed breaking news items created.");
                      done(null, true);
                   }
               });
           }).catch(function(err) {
             winston.error("Error while uploading image file of the fixed breaking news items, err = [%s]", err);
             done(err, false);
          });
}

//load breaking news items
var _loadBreakingNews = function(done) {

   winston.verbose("Creating breaking news items ...");
   var breakingNewsList = [];

   var breakingNewsItemTestBuffer1 = fs.readFileSync("./test/resources/breaking_news_1.jpg", { flag: 'r' });

   //upload the thumbnail test to S3
   var camaraApiConfig = config.get("CamaraApi");
   var breakingNewsItemImageFilename1 = "breaking_news_1.jpg";

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //send the file to S3 server
   s3Client.putObject( camaraApiConfig.BreakingNews.s3BreakingNews.s3Bucket,
                       camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + breakingNewsItemImageFilename1,
                       breakingNewsItemTestBuffer1,
                       breakingNewsItemTestBuffer1.length,
                       "image/jpeg")
           .then(function(etag) {
             var breakingNewsItemTestBuffer2 = fs.readFileSync("./test/resources/breaking_news_2.jpg", { flag: 'r' });
             var breakingNewsItemImageFilename2 = "breaking_news_2.jpg";

             return s3Client.putObject( camaraApiConfig.BreakingNews.s3BreakingNews.s3Bucket,
                                        camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + breakingNewsItemImageFilename2,
                                        breakingNewsItemTestBuffer2,
                                        breakingNewsItemTestBuffer2.length,
                                        "image/jpeg");
           }).then(function(etag) {
             var breakingNewsItemTestBuffer3 = fs.readFileSync("./test/resources/breaking_news_3.jpg", { flag: 'r' });
             var breakingNewsItemImageFilename3 = "breaking_news_3.jpg";

             return s3Client.putObject( camaraApiConfig.BreakingNews.s3BreakingNews.s3Bucket,
                                        camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + breakingNewsItemImageFilename3,
                                        breakingNewsItemTestBuffer3,
                                        breakingNewsItemTestBuffer3.length,
                                        "image/jpeg");
           }).then(function(etag) {
             var breakingNewsItemTestBuffer4 = fs.readFileSync("./test/resources/breaking_news_4.jpg", { flag: 'r' });
             var breakingNewsItemImageFilename4 = "breaking_news_4.jpg";

             return s3Client.putObject( camaraApiConfig.BreakingNews.s3BreakingNews.s3Bucket,
                                        camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + breakingNewsItemImageFilename4,
                                        breakingNewsItemTestBuffer4,
                                        breakingNewsItemTestBuffer4.length,
                                        "image/jpeg");
           }).then(function(etag) {
                //the upload has been successfully completed
                //then insert the breaking news items
                var breakingNewsItems = [];
                var i;
                for (i = 1; i <= 4; i++) {
                   var breakingNewsItem = {};
                   breakingNewsItem.headline = "Headline #" + i;
                   breakingNewsItem.headlineIcon = "ion-ios7-people";
                   breakingNewsItem.title = "Breaking news #" + i;
                   breakingNewsItem.date = new Date();
                   breakingNewsItem.views = 0;
                   breakingNewsItem.type = "link";
                   breakingNewsItem.imageFile = "breaking_news_" + i + ".jpg";
                   breakingNewsItem.access = { target : "_blank",
                                               url : "http://uol.com.br"
                                             };
                   breakingNewsItem.order = i;
                   breakingNewsItems.push(breakingNewsItem);
                }
                BreakingNews.insertMany(breakingNewsItems, function(err) {
                   if(err) {
                      winston.error("Error while saving breaking news items for testing in SampleDataLoader, err = [%s]", err);
                      done(err, false);
                   } else {
                      winston.verbose("Breaking news items created.");
                      done(null, true);
                   }
               });
           }).catch(function(err) {
             winston.error("Error while uploading image file of the breaking news items, err = [%s]", err);
             done(err, false);
          });
}

//load hot news
var _loadHotNewsItems = function(done) {
   winston.verbose("Creating hot news ...");
   var hotNewsList = [];

   var i;
   for (i = 1; i <= 3; i++) {
      var hotNews = {
         title: "#" + i + " " + loremIpsum({ count: 10, units: 'words' }) + ".",
         order: i,
         access : {
            "_id" : "5aa2dbc7779d612628a2e61f",
            "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
            "id" : "5aa2dbc7779d612628a2e61f",
            "creationDate" : "2017-01-05T13:43:00.000Z"
         },
         type : "page"
      };

      hotNewsList.push(hotNews);
   }

   HotNewsItem.insertMany(hotNewsList, function(err) {
      if(err) {
         winston.error("Error while saving hot news for testing in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Hot news created.");
         done(null, true);
      }
   });

}

//load banners
var _loadBanners = function(done) {

   winston.verbose("Creating banners ...");
   var bannersList = [];

   var bannerImageTestBuffer1 = fs.readFileSync("./test/resources/banner_test_1.jpg", { flag: 'r' });

   //upload the thumbnail test to S3
   var camaraApiConfig = config.get("CamaraApi");
   var bannerImageFilename1 = "banner_test_1.jpg";

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //send the file to S3 server
   s3Client.putObject( camaraApiConfig.Banners.s3Banners.s3Bucket,
                       camaraApiConfig.Banners.s3Banners.s3Folder + "/" + bannerImageFilename1,
                       bannerImageTestBuffer1,
                       bannerImageTestBuffer1.length,
                       "image/jpeg")
           .then(function(etag) {
             var bannerImageTestBuffer2 = fs.readFileSync("./test/resources/banner_test_2.jpg", { flag: 'r' });
             var bannerImageFilename2 = "banner_test_2.jpg";

             return s3Client.putObject( camaraApiConfig.Banners.s3Banners.s3Bucket,
                                 camaraApiConfig.Banners.s3Banners.s3Folder + "/" + bannerImageFilename2,
                                 bannerImageTestBuffer2,
                                 bannerImageTestBuffer2.length,
                                 "image/jpeg");
           }).then(function(etag) {
             var bannerImageTestBuffer3 = fs.readFileSync("./test/resources/banner_test_3.jpg", { flag: 'r' });
             var bannerImageFilename3 = "banner_test_3.jpg";

             return s3Client.putObject( camaraApiConfig.Banners.s3Banners.s3Bucket,
                                        camaraApiConfig.Banners.s3Banners.s3Folder + "/" + bannerImageFilename3,
                                        bannerImageTestBuffer3,
                                        bannerImageTestBuffer3.length,
                                        "image/jpeg");
           }).then(function(etag) {
                //the upload has been successfully completed
                //then insert the banners
                var banners = [];
                var i;
                for (i = 1; i <= 3; i++) {
                   var banner = {};
                   banner.type = "link";
                   banner.imageFile = "banner_test_" + i + ".jpg";
                   banner.access = { target : "_blank",
                                     url : "http://uol.com.br"
                                   };
                   banner.order = i;
                   banners.push(banner);
                }
                Banner.insertMany(banners, function(err) {
                   if(err) {
                      winston.error("Error while saving banners for testing in SampleDataLoader, err = [%s]", err);
                      done(err, false);
                   } else {
                      winston.verbose("Banners created.");
                      done(null, true);
                   }
               });
           }).catch(function(err) {
             winston.error("Error while uploading image file of the banners, err = [%s]", err);
             done(err, false);
          });
}

//load news
var _loadNewsItems = function(done) {

   winston.verbose("Creating news ...");
   var newsList = [];

   var newsItemThumbnailTestBuffer = fs.readFileSync("./test/resources/news_item_thumbnail_test.jpg", { flag: 'r' });

   //upload the thumbnail test to S3
   var camaraApiConfig = config.get("CamaraApi");
   var newsThumbnailFilename = "news_item_thumbnail_test.jpg";

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //send the file to S3 server
   s3Client.putObject( camaraApiConfig.News.s3Thumbnails.s3Bucket,
                       camaraApiConfig.News.s3Thumbnails.s3Folder + "/" + newsThumbnailFilename,
                       newsItemThumbnailTestBuffer,
                       newsItemThumbnailTestBuffer.length,
                       "image/jpeg",
   function (err, etag) {
      if(!err) {
         //the upload has been successfully completed
         //then insert the news
         var i;
         for (i = 0; i < 1627; i++) {
            var newsItem = {};
            var publish = Util.random(0, 1) ? true : false;
            var futurePublication = publish ? ( Util.random(0, 1) ? true : false ) : false;
            var changed = Util.random(0, 1) ? true : false;
            var now = new Date();
            now.setSeconds(0);
            now.setMilliseconds(0);
            var randomDate = Util.randomDateAndTimeInMinutes(2000,11,1, 2017,0,10); //now
            randomDate.setMilliseconds(0);
            randomDate.setSeconds(0);
            var changedDate = changed ? new Date(randomDate.getTime() + Util.random(1, 3) * 86400000) : null;
            var futurePublicationDate = futurePublication ? new Date(randomDate.getTime() + Util.random(1, 7 * 86400) * 1000) : randomDate;
            futurePublicationDate.setMilliseconds(0);
            futurePublicationDate.setSeconds(0);
            newsItem.title = "News " + i + " " + loremIpsum({ count: 10, units: 'words' }) + ".";
            newsItem.headline = loremIpsum({ count: 1, units: 'sentences', sentenceLowerBound: 5, sentenceUpperBound: 15 });
            newsItem.publish = publish;
            newsItem.thumbnailFile = newsThumbnailFilename;
            newsItem.publicationDate = ( publish ?  ( futurePublication ? futurePublicationDate :
                                                                          randomDate
                                                    )
                                                 : null
                                       );
            newsItem.creationDate = randomDate;
            newsItem.changedDate = changedDate;
            newsItem.body = loremIpsum({ count: 5,
                                         units: 'paragraphs',
                                         sentenceLowerBound: 5,
                                         sentenceUpperBound: 15,
                                         paragraphLowerBound: 3,
                                         paragraphUpperBound: 7,
                                         format: 'html' });
            newsList.push(newsItem);
         }

         NewsItem.insertMany(newsList, function(err) {
            if(err) {
               winston.error("Error while saving news for testing in SampleDataLoader, err = [%s]", err);
               done(err, false);
            } else {
               winston.verbose("News created.");
               done(null, true);
            }
         });
      } else {
         winston.error("Error while uploading thumbnail file of the news item, err = [%s]", err);
         done(err, false);
      }
   });
}

//load news
var _loadPages = function(done) {
   winston.verbose("Creating pages ...");
   var pageList = [];

   //insert the pages
   var i;
   for (i = 0; i < 1233; i++) {
      var page = {};
      var changed = Util.random(0, 1) ? true : false;
      var now = new Date();
      now.setSeconds(0);
      now.setMilliseconds(0);
      var randomDate = Util.randomDateAndTimeInMinutes(2000,11,1, 2017,0,10); //now
      randomDate.setMilliseconds(0);
      randomDate.setSeconds(0);
      var changedDate = changed ? new Date(randomDate.getTime() + Util.random(1, 3) * 86400000) : null;
      page.title = "Page " + i + " " + loremIpsum({ count: 10, units: 'words' }) + ".";
      page.creationDate = randomDate;
      page.changedDate = changedDate;
      page.body = loremIpsum({ count: 5,
                               units: 'paragraphs',
                               sentenceLowerBound: 5,
                               sentenceUpperBound: 15,
                               paragraphLowerBound: 3,
                               paragraphUpperBound: 7,
                               format: 'html' });
      pageList.push(page);
   }

   Page.insertMany(pageList, function(err) {
      if(err) {
         winston.error("Error while saving pages for testing in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Pages created.");
         done(null, true);
      }
   });
}

//load a menu to the admin module for testing purposes
var _loadMenuAdmin = function(done) {
   //process a menu item
   var _processMenuItemAdmin = async function(rootMenuItem, prmIsRoot) {
      var isRoot = prmIsRoot !== undefined ? prmIsRoot : false;

      if(rootMenuItem.menuItems && rootMenuItem.menuItems.length > 0) {
         var i;
         var childrenIds = [];
         for(i = 0; i < rootMenuItem.menuItems.length; i++) {
            var childMenuItem = rootMenuItem.menuItems[i];
            var id = await new Promise(function(resolve, reject) {
               _processMenuItemAdmin(childMenuItem).then(function(result) {
                  resolve(result);
               }).catch(function(err) {
                  reject(err);
               });
            });
            childrenIds.push(id);
         }
         var menuItem = new MenuAdmin();
         menuItem.title = rootMenuItem.title;
         menuItem.sref = rootMenuItem.sref;
         menuItem.icon = rootMenuItem.icon;
         menuItem.isRoot = isRoot;
         menuItem.order = rootMenuItem.order !== undefined ? rootMenuItem.order : -1;
         menuItem.menuItems = childrenIds;
         var id = await new Promise(function(resolve, reject) {
            menuItem.save().then(function(result) {
               resolve(result._id);
            }).catch(function(err) {
               reject(err);
            });
         });
         return id;
      } else {
         var menuItem = new MenuAdmin();
         menuItem.title = rootMenuItem.title;
         menuItem.sref = rootMenuItem.sref;
         menuItem.icon = rootMenuItem.icon;
         menuItem.isRoot = isRoot;
         menuItem.order = rootMenuItem.order !== undefined ? rootMenuItem.order : -1;
         menuItem.menuItems = [];

         var id = await new Promise(function(resolve, reject) {
            menuItem.save().then(function(result) {
               resolve(result._id);
            }).catch(function(err) {
               reject(err);
            });
         });
         return id;
      }
   }
   //process the root menu items
   var _processMenuAdmin = async function(menuAdmin) {
      if(menuAdmin) {
         var i;
         for (i = 0; i < menuAdmin.length; i++) {
            var menuItem = menuAdmin[i];
            var id = await new Promise(function(resolve, reject) {
               _processMenuItemAdmin(menuItem, true).then(function(result) {
                  resolve(result);
               }).catch(function(err) {
                  reject(err);
               });
            });
         }
         return true;
      }
   }
   //menu defition
   var menuItemsArr =  [{  title: 'Dashboard - Mock',
                           sref:  'dashboard',
                           icon:  'icon-home',
                           isRoot: true,
                           order: 0
                        },
                        {  icon: 'icon-settings',
                           title: 'AngularJS Features',
                           isRoot: true,
                           order: 1,
                           menuItems:
                               [ { title: 'UI Bootstrap',
                                   icon: 'icon-home',
                                   sref: 'uibootstrap',
                                   isRoot: false
                                 },
                                 { title: 'File Upload',
                                   icon: 'icon-puzzle',
                                   sref: 'fileupload',
                                   isRoot: false
                                 },
                                 { title: 'UI Select',
                                   icon: 'icon-paper-clip',
                                   sref: 'uiselect',
                                   isRoot: false
                                 },
                                 { title: 'Test security',
                                   icon: 'icon-paper-clip',
                                   sref: 'testsecurity',
                                   isRoot: false
                                 }
                              ]
                        },
                        { icon: 'icon-wrench',
                          title: 'jQuery Plugins',
                          isRoot: true,
                          order: 2,
                          menuItems:
                               [{ title: 'Form Tools',
                                  icon: 'icon-puzzle',
                                  sref: 'formtools',
                                  isRoot: false
                                 },
                                 { title: 'Date & Time Pickers',
                                   icon: 'icon-calendar',
                                   sref: 'pickers',
                                   isRoot: false
                                 },
                                 { title: 'Custom Dropdowns',
                                   icon: 'icon-refresh',
                                   sref: 'dropdowns',
                                   isRoot: false
                                 },
                                 { title: 'Tree View',
                                   icon: 'icon-share',
                                   sref: 'tree',
                                   isRoot: false
                                 },
                                 { title: 'Datatables',
                                   icon: 'icon-briefcase',
                                   isRoot: false,
                                   menuItems:
                                    [{ title: 'Managed Datatables',
                                       icon: 'icon-tag',
                                       sref: 'datatablesmanaged',
                                       isRoot: false
                                      },
                                      { title: 'Ajax Datatables',
                                        icon: 'icon-refresh',
                                        sref: 'datatablesajax',
                                        isRoot: false
                                      }]
                                 }]
                        },
                        { title: 'User Profile',
                          icon: 'icon-user',
                          sref: 'profile.dashboard',
                          order: 3,
                          isRoot: true
                        },
                        { title: 'Task & Todo',
                          icon: 'icon-check',
                          sref: 'todo',
                          order: 4,
                          isRoot: true
                        },
                        {  title: 'Blank Page',
                           icon: 'icon-refresh',
                           sref: 'blank',
                           order: 5,
                           isRoot: true
                        },
                        { title: 'Usuários',
                          icon: 'icon-user',
                          sref: 'users',
                          order: 6,
                          isRoot: true
                        },
                        { title: 'Grupos de usuários',
                          icon: 'icon-grid',
                          sref: 'userGroups',
                          order: 7,
                          isRoot: true
                        },
                        { title: 'Menu - Admin',
                          icon: 'icon-film',
                          sref: 'menuAdmin.list',
                          order: 8,
                          isRoot: true
                       },{ title: 'Menu - Portal',
                          icon: 'icon-list',
                          sref: 'menuPortal.list',
                          order: 9,
                          isRoot: true
                        },
                        { title: 'Notícias',
                          icon: 'icon-docs',
                          sref: 'newsItem.list',
                          order: 10,
                          isRoot: true
                        },
                        { title: 'Páginas',
                          icon: 'icon-globe',
                          sref: 'page.list',
                          order: 11,
                          isRoot: true
                        },{ title: 'Banners',
                          icon: 'icon-film',
                          sref: 'banner.list',
                          order: 12,
                          isRoot: true
                       },{ title: 'Destaques Cabeçalho',
                          icon: 'icon-energy',
                          sref: 'hotNews.list',
                          order: 13,
                          isRoot: true
                       },{ title: 'Destaques Rotativos',
                          icon: 'icon-star',
                          sref: 'breakingNews.list',
                          order: 14,
                          isRoot: true
                       },{ title: 'Destaques Fixos',
                          icon: 'icon-direction',
                          sref: 'fixedBreakingNews.list',
                          order: 15,
                          isRoot: true
                       },{ title: 'Eventos',
                          icon: 'icon-calendar',
                          sref: 'eventsCalendar.list',
                          order: 16,
                          isRoot: true
                       }, { title: 'Licitações',
                          icon: 'icon-basket',
                          sref: 'licitacao.list',
                          order: 17,
                          isRoot: true
                       }, { title: 'Proposituras',
                          icon: 'icon-graduation',
                          sref: 'legislativeProposition.list',
                          order: 18,
                          isRoot: true
                       },{ title: 'Classificações',
                          icon: 'icon-tag',
                          sref: 'legislativePropositionTags',
                          order: 19,
                          isRoot: true
                       },
                       {  title: 'Arquivos Públicos',
                          icon: 'icon-calculator',
                          sref: 'publicFiles.list',
                          order: 20,
                          isRoot: true
                       },
                       { title: 'Índice',
                         icon: 'icon-magnifier',
                         sref: 'indexer',
                         order: 21,
                         isRoot: true
                       },
                       { title: 'Login',
                          icon: 'icon-user',
                          sref: 'login',
                          order: 22,
                          isRoot: true
                        }];
   //do the job
   winston.verbose("Creating menu admin ...");
   _processMenuAdmin(menuItemsArr).then(function(result) {
      winston.verbose("Menu admin created.");
      done(null, true);
   }).catch(function(err) {
      done(err, false);
   });
}

//load a menu to the portal module for testing purposes
var _loadMenuPortal = function(done) {
   //process a menu item
   var _processMenuItemPortal = async function(rootMenuItem, prmIsRoot) {
      var isRoot = prmIsRoot !== undefined ? prmIsRoot : false;

      if(rootMenuItem.menuItems && rootMenuItem.menuItems.length > 0) {
         var i;
         var childrenIds = [];
         for(i = 0; i < rootMenuItem.menuItems.length; i++) {
            var childMenuItem = rootMenuItem.menuItems[i];
            var id = await new Promise(function(resolve, reject) {
               _processMenuItemPortal(childMenuItem).then(function(result) {
                  resolve(result);
               }).catch(function(err) {
                  reject(err);
               });
            });
            childrenIds.push(id);
         }
         var menuItem = new MenuPortal();
         menuItem.title = rootMenuItem.title;
         menuItem.url = rootMenuItem.url;
         menuItem.isRoot = isRoot;
         menuItem.order = rootMenuItem.order !== undefined ? rootMenuItem.order : -1;
         menuItem.menuItems = childrenIds;
         var id = await new Promise(function(resolve, reject) {
            menuItem.save().then(function(result) {
               resolve(result._id);
            }).catch(function(err) {
               reject(err);
            });
         });
         return id;
      } else {
         var menuItem = new MenuPortal();
         menuItem.title = rootMenuItem.title;
         menuItem.url = rootMenuItem.url;
         menuItem.isRoot = isRoot;
         menuItem.order = rootMenuItem.order !== undefined ? rootMenuItem.order : -1;
         menuItem.menuItems = [];

         var id = await new Promise(function(resolve, reject) {
            menuItem.save().then(function(result) {
               resolve(result._id);
            }).catch(function(err) {
               reject(err);
            });
         });
         return id;
      }
   }

   //process the root menu items
   var _processMenuPortal = async function(menuPortal) {
      if(menuPortal) {
         var i;
         for (i = 0; i < menuPortal.length; i++) {
            var menuItem = menuPortal[i];
            var id = await new Promise(function(resolve, reject) {
               _processMenuItemPortal(menuItem, true).then(function(result) {
                  resolve(result);
               }).catch(function(err) {
                  reject(err);
               });
            });
         }
         return true;
      }
   }
   //menu defition
   var menuItemsArr =  [{  title: 'Menu A',
                           isRoot: true,
                           order: 0,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu B',
                           isRoot: true,
                           order: 1,
                           menuItems: [
                              {  title: 'Menu B C',
                                 isRoot: false,
                                 order: 0,
                                 access : {
                                    "_id" : "5aa2dbc7779d612628a2e61f",
                                    "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                    "id" : "5aa2dbc7779d612628a2e61f",
                                    "creationDate" : "2017-01-05T13:43:00.000Z"
                                 },
                                 type : "page"
                              },
                              {  title: 'Menu B D',
                                 isRoot: false,
                                 order: 1,
                                 access : {
                                    "_id" : "5aa2dbc7779d612628a2e61f",
                                    "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                    "id" : "5aa2dbc7779d612628a2e61f",
                                    "creationDate" : "2017-01-05T13:43:00.000Z"
                                 },
                                 type : "page"
                              },
                              {  title: 'Menu B E',
                                 isRoot: false,
                                 order: 2,
                                 access : {
                                    "_id" : "5aa2dbc7779d612628a2e61f",
                                    "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                    "id" : "5aa2dbc7779d612628a2e61f",
                                    "creationDate" : "2017-01-05T13:43:00.000Z"
                                 },
                                 type : "page"
                              }
                           ]
                        },
                        {  title: 'Menu C',
                           isRoot: true,
                           order: 2,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu D',
                           isRoot: true,
                           order: 3,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu E',
                           isRoot: true,
                           order: 4,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu F',
                           isRoot: true,
                           order: 5,
                           menuItems: [
                              {  title: 'Menu F C',
                                 isRoot: false,
                                 order: 0,
                                 access : {
                                    "_id" : "5aa2dbc7779d612628a2e61f",
                                    "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                    "id" : "5aa2dbc7779d612628a2e61f",
                                    "creationDate" : "2017-01-05T13:43:00.000Z"
                                 },
                                 type : "page"
                              },
                              {  title: 'Menu F D',
                                 isRoot: false,
                                 order: 1,
                                 menuItems: [
                                    {  title: 'Menu F D A',
                                       isRoot: false,
                                       order: 0,
                                       access : {
                                          "_id" : "5aa2dbc7779d612628a2e61f",
                                          "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                          "id" : "5aa2dbc7779d612628a2e61f",
                                          "creationDate" : "2017-01-05T13:43:00.000Z"
                                       },
                                       type : "page"
                                    },
                                    {  title: 'Menu F D B',
                                       isRoot: false,
                                       order: 1,
                                       access : {
                                          "_id" : "5aa2dbc7779d612628a2e61f",
                                          "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                          "id" : "5aa2dbc7779d612628a2e61f",
                                          "creationDate" : "2017-01-05T13:43:00.000Z"
                                       },
                                       type : "page"
                                    }
                                 ]
                              },
                              {  title: 'Menu F E',
                                 isRoot: false,
                                 order: 2,
                                 access : {
                                    "_id" : "5aa2dbc7779d612628a2e61f",
                                    "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                    "id" : "5aa2dbc7779d612628a2e61f",
                                    "creationDate" : "2017-01-05T13:43:00.000Z"
                                 },
                                 type : "page"
                              }
                           ]

                        },
                        {  title: 'Menu G',
                           isRoot: true,
                           order: 6,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu H',
                           isRoot: true,
                           order: 7,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu I',
                           isRoot: true,
                           order: 8,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        }];
   //do the job
   winston.verbose("Creating portal menu ...");
   _processMenuPortal(menuItemsArr).then(function(result) {
      winston.verbose("Portal menu created.");
      done(null, true);
   }).catch(function(err) {
      done(err, false);
   });
}

var _loadUserGroups = function(done) {
      var amount = 100;
      winston.verbose("Creating user groups ...");
      var userGroups = [];
      var i;

      for(i = 0; i < amount; i++) {
         userGroups.push({ name: "Group" + i,
                           completeName: "Group" + i,
                           parent: null
                        });
      }
      var roles = [];

      SecurityRole.find({}).then(function(_roles) {

         roles = _roles;
         return UserGroup.insertMany(userGroups);

      }).then(function(insertedUserGroups) {

         winston.verbose("User groups created.");
         //create random user groups trees
         var i; var bunchSize = 15; var commands = [];
         //process bunches of nodes, one bunch for each step
         for(i = 0; i < insertedUserGroups.length; i = i + bunchSize) {
            //create random user groups tree
            var availableNodes = [];
             //avaliable nodes for this step (the bunch of nodes)
            var j;
            for(j = i; j < insertedUserGroups.length && j < i + bunchSize; j++) {
               availableNodes.push(insertedUserGroups[j]);
            }

            var roots = [];
            var root;

            if(availableNodes.length > 0) {
               root = Util.pushRandom(availableNodes);
               roots.push({ 'root' : root, 'parentCompleteName': '' });
               commands.push({
                   updateOne: {
                        filter: { '_id':  root._id },
                        update: { 'isRoot':  true }
                   }
               });
            }

            while(roots.length > 0) {
               var node = roots.shift();
               var root = node.root;
               //update complete name
               if(node.parentCompleteName !== '') {
                  root.completeName = node.parentCompleteName + " > " + root.name;
               } else {
                  root.completeName = root.name;
               }

               if(availableNodes.length > 0) {
                  var child1 = Util.pushRandom(availableNodes);
                  roots.push({ 'root': child1,
                               'parentCompleteName': root.completeName
                            });
                  root.children.push(child1);
                  if(availableNodes.length > 0) {
                     var child2 = Util.pushRandom(availableNodes);
                     roots.push({ 'root': child2,
                                  'parentCompleteName': root.completeName
                               });
                     root.children.push(child2);
                  }
               }
            }

            insertedUserGroups.forEach(function(node) {
               //set a random set of roles for the user group
               node.roles = Util.randomSubArrayFrom(roles);
               commands.push({
                  updateOne: {
                    filter: { '_id':  node._id },
                    update: { 'children':  node.children,
                              'roles': node.roles,
                              'completeName': node.completeName
                            },
                  }
               });
            });
         }

         UserGroup.bulkWrite(commands, function(err, result) {
            if(!err) {
               done(null, true);
            } else {
               done(err, false);
            }
         });
         //END - create random user groups tree

      }).catch(function(err){
         winston.error("Error while saving the user groups for testing in SampleDataLoader, err = [%s]", err);
         done(err, false);
      });
}

var _loadSecurityRoles = function(done){
      winston.verbose("Creating security roles ...");
      var securityRoles = [];
      var i;
      for(i = 0; i < 100; i++) {
         securityRoles.push({ name: "role" + i });
      }
      //BEGIN: additional roles here
      securityRoles.push({ name: "news_upload_thumbnail" });
      //END: additional roles here

      SecurityRole.insertMany(securityRoles, function(err){
         if(err) {
            winston.error("Error while saving security roles for testing in SampleDataLoader, err = [%s]", err);
            done(err, false);
         } else {
            winston.verbose("Security roles created.");
            done(null, true);
         }
      });
}

//Load an user for testing purposes
var _loadUserTest = function(done) {
   UserGroup.find({}).exec().then(function(groups){
      var userTest = new User();
      userTest.username = "test";
      userTest.name = "Test";
      userTest.email = "test@serv.com";
      userTest.setPassword('testpassword');
      userTest.primaryGroup = groups[0];
      userTest.creationDate = new Date();
      userTest.status = true;

      winston.verbose("Creating user test ...");

      userTest.save(function(err){
         if(err) {
            winston.error("Error while saving the user test in SampleDataLoader, err = [%s]", err);
            done(err, false);
         } else {
            winston.verbose("User test created.");
            done(null, true);
         }
      });
   }).catch(function(err){
      winston.error("Error while getting user groups to create the user test in SampleDataLoader, err = [%s]", err);
      done(err, false);
   });
}

//Load random users for testing purposes
var _loadRandomUsersTest = function(done) {
   var groups = [];
   var roles = [];

   UserGroup.find({}).exec().then( function(_groups) {
      groups = _groups;

      return SecurityRole.find({}).exec();
   }).then(function(_roles) {
      roles = _roles;

      winston.verbose("Creating random users ...");

      var _createRandomUser = function(count) {
         if(count < 1000) {
            var randomUser = new User();
            randomUser.username = 'user' + count;
            randomUser.name = 'User' + count;
            randomUser.email = 'user' + count + "@serv.com";
            randomUser.setPassword('user' + count + 'password');
            randomUser.roles = Util.randomSubArrayFrom(roles);
            randomUser.primaryGroup = Util.randomFrom(groups);
            randomUser.secondaryGroups = Util.randomSubArrayFrom(groups);
            randomUser.creationDate = Util.randomDate(2000,11,1, 2017,0,10);
            randomUser.status = Util.random(0, 1) ? true : false;
            randomUser.save().then(function(newUser){
               _createRandomUser(count + 1);
            }).catch(function(err){
               winston.error("Error while saving the random user test in SampleDataLoader, err = [%s]", err);
               done(err, false);
            });
         } else {
            winston.verbose("Random users created.");
            done(null, true);
         }
      }
       _createRandomUser(0);
   }).catch(function(err) {
      winston.error("Error while creating random users in SampleDataLoader, err = [%s]", err);
      done(err, false);
   });
}

//Load random public files structure for testing purposes
var _loadRandomPublicFiles = function(done) {

   //upload a file to S3
   var uploadFile = function(fileName, folder) {
      var publicFilesFileTestBuffer = fs.readFileSync("./test/resources/public_files_file.txt", { flag: 'r' });

      //upload the file test to S3
      var camaraApiConfig = config.get("CamaraApi");
      var fileLength = publicFilesFileTestBuffer.length;
      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);

      //send the file to S3 server
      return  s3Client.putObject( camaraApiConfig.PublicFiles.s3Files.s3Bucket,
                                  camaraApiConfig.PublicFiles.s3Files.s3Folder + folder + "/" + fileName,
                                  publicFilesFileTestBuffer,
                                  publicFilesFileTestBuffer.length,
                                  "text/plain" )
              .then(function(etag) {
                 return fileLength;
              });
   }

   //util function to create a folder
   var createFolderStructure = async function(folder, users, folderPath, depth) {
      var amountOfSubFolders = depth >= 3 ? 0 : Util.random(2, 2);
      var amountOfFiles = Util.random(1, 1);
      var i;
      var subFolders = [];
      var randomUser;
      var randomUserIndex;
      var randomName;
      if(users && users.length > 0) {
         randomUserIndex = Util.random(0, users.length - 1)
         randomUser = users[randomUserIndex];
      }
      var randomDescription;

      //create subfolders
      for(i = 0; i < amountOfSubFolders; i++) {
         //random user
         randomUser = null;
         randomUserIndex = -1;
         if(users && users.length > 0) {
            randomUserIndex = Util.random(0, users.length - 1)
            randomUser = users[randomUserIndex];
         }
         //random description
         randomDescription = loremIpsum({ count: 1,
                                          units: 'sentences',
                                          sentenceLowerBound: 2,
                                          sentenceUpperBound: 4,
                                          format: 'plain' });
         if(randomDescription) {
            randomDescription = randomDescription.substr(0, randomDescription.length - 1);
         }
         var publicFilesSubFolder = new PublicFolder({
            creationDate: Util.randomDateAndTimeInMinutes(2000,11,1, 2017,0,10),
            creationUser: randomUser,
            folder: folder,
            order: i,
            name: ( loremIpsum({ count: 1,
                                 units: 'words',
                                 format: 'plain' }) + "-" + i ).toLowerCase(),
            description: randomDescription
         });

         //create new subfolder - synchronous way
         var newSubFolder = await new Promise(function(resolve, reject) {
            publicFilesSubFolder
            .save()
            .then(function(newSubFolder) {
               resolve(newSubFolder);
            }).catch(function(err) {
               winston.error("Error while creating folder for the random public files structure in SampleDataLoader, err = [%s]", err);
               reject(err);
            });
         });
         subFolders.push({
            'folder': newSubFolder,
            'depth': depth + 1,
            'folderPath': folderPath + "/" + newSubFolder.name
         });
      }
      //create files
      for(i = 0; i < amountOfFiles; i++) {
         //random user
         randomUser = null;
         randomUserIndex = -1;
         if(users && users.length > 0) {
            randomUserIndex = Util.random(0, users.length - 1)
            randomUser = users[randomUserIndex];
         }
         //random description
         randomDescription = loremIpsum({
                               count: 1,
                               units: 'sentences',
                               sentenceLowerBound: 2,
                               sentenceUpperBound: 4,
                               format: 'plain'
                             });
         randomName = ( loremIpsum({ count: 1,
                                     units: 'words',
                                     format: 'plain' }) + "-" + (amountOfSubFolders + i) + ".txt" ).toLowerCase();
         if(randomDescription) {
            randomDescription = randomDescription.substr(0, randomDescription.length - 1);
         }
         var publicFile;
         await new Promise(function(resolve, reject) {
            uploadFile(randomName, folderPath)
            .then(function(fileSize) {
               publicFile = new PublicFile ({
                  creationDate: Util.randomDateAndTimeInMinutes(2000,11,1, 2017,0,10),
                  length: fileSize,
                  order: amountOfSubFolders + i,
                  creationUser: randomUser,
                  folder: folder,
                  name: randomName,
                  description: randomDescription,
                  extension: 'txt',
                  contentType: 'text/plain'
               });
               return publicFile.save();
            }).then(function(newFile) {
               resolve(newFile);
            }).catch(function(err) {
               winston.error("Error while creating file for the random public files structure in SampleDataLoader, err = [%s]", err);
               reject(err);
            });
         });
      }
      return Promise.resolve(subFolders);
   }

   var i = 0;
   var users = null;
   User.find({})
   .then(async function(pusers) {
      users = pusers;
      var queue = [null]; //folders to be processed, null is the root

      winston.verbose("Creating random public files structure ...");

      //process (create the structure of the folder) the folders in the queue
      while(queue.length > 0) {
         var currentFolder = queue.shift();
         if(currentFolder !== undefined) {
            var subfolders = await createFolderStructure (
               currentFolder ? currentFolder.folder : null,
               users,
               currentFolder ? currentFolder.folderPath : "/",
               currentFolder ? currentFolder.depth : 0
            );
            //put the subfolder in the queue
            if(subfolders.length > 0) {
               for(i = 0; i < subfolders.length; i++) {
                  queue.push(subfolders[i]);
               }
            }
         }
      }

      winston.verbose("Random public files structure created.");
      done(null, true);
   }).catch(function(err) {
      winston.error("Error while creating random public files structure in SampleDataLoader, err = [%s]", err);
      done(err, false);
   });
}

/*****************************************************************************
******************************* PRIVATE **************************************
**************************(CLEANING FUNCTIONS)********************************
/*****************************************************************************/
var _cleanS3Bucket = function(done) {
   //remove s3 bucket
   var camaraApiConfig = config.get("CamaraApi");
   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   var i;
   winston.verbose("Cleaning s3 bucket ...");

   s3Client
   .bucketExists(camaraApiConfig.PublicFiles.s3Files.s3Bucket)
   .then(function() {
      //clean s3 bucket
      var listObjectsStream = s3Client.listObjects( camaraApiConfig.PublicFiles.s3Files.s3Bucket, '', true );
      var s3Objects = [];

      listObjectsStream.on('data', function(obj) {
         s3Objects.push(obj.name);
      });

      listObjectsStream.on('error', function(err) {
         winston.error("Error while cleaning s3 bucket in SampleDataLoader, err = [%s]", err);
         done(err, false);
      });

      listObjectsStream.on('end', async function() {
         for (i = 0; i < s3Objects.length; i++) {
            await s3Client.removeObject(camaraApiConfig.PublicFiles.s3Files.s3Bucket, s3Objects[i]);
         }
         winston.verbose("S3 bucket cleaned.");
         done(null, 1);
      })
   }).catch(function() {
      //the bucket doesn't exist, then nothing to be cleared
      winston.verbose("S3 bucket doesn't exist.");
      done(null, 1);
   });
}

var _removePublicFiles = function(done) {
   PublicFile.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing files of random public files in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         PublicFolder.remove({}, function(err) {
            if(err) {
               winston.error("Error while removing folders of random public files in SampleDataLoader, err = [%s]", err);
               done(err, false);
            } else {
               winston.verbose("Public finance structure removed");
               done(null, true);
            }
         });
      }
   });
}

var _removeFBreakingNews = function(done) {
   FBreakingNews.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing fixed breaking news items SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Fixed breaking news items removed");
         done(null, true);
      }
   });
}

var _removeBreakingNews = function(done) {
   BreakingNews.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing breaking news items SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Breaking news items removed");
         done(null, true);
      }
   });
}

var _removeHotNewsItems = function(done) {
   HotNewsItem.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing hot news items SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Hot news items removed");
         done(null, true);
      }
   });
}

var _removeMenuAdmin = function(done) {
   MenuAdmin.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing menu admin in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Menu admin removed");
         done(null, true);
      }
   });
}

var _removeMenuPortal = function(done) {
   MenuPortal.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing menu portal in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Menu portal removed");
         done(null, true);
      }
   });
}

//remove the user that was created for testing purposes
var _removeUserTest = function(done) {
   var userTest = User.remove({ email: 'test@serv.com' }, function(err) {
      if(err) {
         winston.error("Error while removing the user test in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("User test removed");
         done(null, true);
      }
   });
}

//remove the users that were created for testing purposes
var _removeRandomUsersTest = function(done) {
   User.remove({ username: /^user/ }, function(err) {
      if(err) {
         winston.error("Error while removing random users in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Random users removed");
         done(null, true);
      }
   });
}

//remove the user groups that were created for testing purposes
var _removeUserGroups = function(done) {
   UserGroup.remove({ name: /^Group/ }, function(err) {
      if(err) {
         winston.error("Error while removing random user groups in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Random user groups removed");
         done(null, true);
      }
   });
}

//remove the user groups that were created for testing purposes
var _removeSecurityRoles = function(done) {
   SecurityRole.remove({ }, function(err) {
      if (err) {
         winston.error("Error while removing security roles in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Security roles removed");
         done(null, true);
      }
   });
}

//remove the news
var _removeNewsItems = function(done) {
   NewsItem.remove({ title: /^News/ }, function(err) {
      if (err) {
         winston.error("Error while removing news in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("News removed");
         done(null, true);
      }
   });
}

//remove the pages
var _removePages = function(done) {
   Page.remove({ title: /^Page/ }, function(err) {
      if (err) {
         winston.error("Error while removing pages in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Pages removed");
         done(null, true);
      }
   });
}

//remove the pages
var _removeBanners = function(done) {
   Banner.remove({}, function(err) {
      if (err) {
         winston.error("Error while removing banners in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Banners removed");
         done(null, true);
      }
   });
}

//remove licitacao categories
var _removeLicitacaoCategories = function(done) {
   LicitacaoCategory.remove({}, function(err) {
      if (err) {
         winston.error("Error while removing licitacao categories in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Licitacao categories removed");
         done(null, true);
      }
   });
}

var _removeLicitacoesEvents = function(done) {
   LicitacaoEvent.remove({}, function(err) {
      if (err) {
         winston.error("Error while removing eventos de licitacoes in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Eventos de licitacoes removed");
         done(null, true);
      }
   });
}

//remove licitacoes
var _removeLicitacoes = function(done) {
   Licitacao.remove({}, function(err) {
      if (err) {
         winston.error("Error while removing licitacoes in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Licitacoes removed");
         done(null, true);
      }
   });
}

//remove legislative proposition type
var _removeLegislativePropositionTypes = function(done) {
   LegislativePropositionType.remove({}, function(err) {
      if (err) {
         winston.error("Error while removing legislative proposition types in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Legislative proposition types removed");
         done(null, true);
      }
   });
}

//remove legislative proposition type
var _removeLegislativePropositionTags = function(done) {
   LegislativePropositionTag.remove({}, function(err) {
      if (err) {
         winston.error("Error while removing legislative proposition tags in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Legislative proposition tags removed");
         done(null, true);
      }
   });
}

//remove legislative proposition relationship types
var _removeLegislativePropositionRelationshipTypes = function(done) {
   LegislativePropositionRelationshipType.remove({}, function(err) {
      if (err) {
         winston.error("Error while removing legislative proposition relationship types in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Legislative legislative proposition relationship types removed");
         done(null, true);
      }
   });
}

//remove legislative propositions
var _removeLegislativePropositions = function(done) {
   LegislativeProposition.remove({}, function(err) {
      if (err) {
         winston.error("Error while removing legislative propositions in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Legislative legislative propositions removed");
         done(null, true);
      }
   });
}

//remove legislative propositions
var _removeLegislativePropositionsRemoved = function(done) {
   LegislativePropositionRemoved.remove({}, function(err) {
      if (err) {
         winston.error("Error while removing legislative propositions (removed collections) in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Legislative legislative propositions (removed collections) removed");
         done(null, true);
      }
   });
}

//put the desired sample data routines here, they will be executed in the
//order by this sample data generator
var _loadRoutines = [
   _createS3Bucket,
   _loadLegislativePropositionTypes,
   _loadLegislativePropositionTags,
   _loadLegislativePropositionRelationshipType,
   _loadLicitacaoCategories,
   _loadLicitacoes,
   _loadFBreakingNews,
   _loadBreakingNews,
   _loadBanners,
   _loadHotNewsItems,
   _loadPages,
   _loadNewsItems,
   _loadMenuPortal,
   _loadMenuAdmin,
   _loadSecurityRoles,
   _loadUserGroups,
   _loadUserTest,
   _loadRandomUsersTest,
   _loadLegislativePropositions,
   _loadRandomPublicFiles
];

//put the desired sample data clear routines here, they will be executed in the
//order by this sample data generator to clear data generated before
var _clearRoutines = [
   _cleanS3Bucket,
   _removePublicFiles,
   _removeLegislativePropositions,
   _removeFBreakingNews,
   _removeBreakingNews,
   _removeHotNewsItems,
   _removeMenuPortal,
   _removeMenuAdmin,
   _removeUserTest,
   _removeRandomUsersTest,
   _removeUserGroups,
   _removeSecurityRoles,
   _removeNewsItems,
   _removePages,
   _removeBanners,
   _removeLicitacoesEvents,
   _removeLicitacoes,
   _removeLicitacaoCategories,
   _removeLegislativePropositionRelationshipTypes,
   _removeLegislativePropositionTags,
   _removeLegislativePropositionTypes,
   _removeLegislativePropositionsRemoved
];

//execute the cleaning routines to remove a previous sample data
var _clear = function(done) {
   if(_sampleDataCleaningActivated) {
      winston.verbose("========== Cleaning sample data ...");

      //execute the cleaning routines in serie, each one running once
      //the previous function has completed
      var clearRoutinesWithErrorHandling = _.map(_clearRoutines, Util.handleErrorForAsync);
                                          //Each routine should be
                                          //surronded by an error handler in order to
                                          //improve error reporting
      async.series(clearRoutinesWithErrorHandling, function(errSeries, results) {
         if(errSeries) {
            winston.error("Error while cleaning sample data, err = [%s]", errSeries);
         }
         winston.verbose("========== Cleaning process ended");
         done();
      });
   } else {
      done();
   };
}

/*****************************************************************************
******************************* PUBLIC ***************************************
/*****************************************************************************/
//module properties, set and gets
module.exports.setSampleDataGenerationActivated = function(sampleDataGenerationActivated) {
   _sampleDataGenerationActivated = sampleDataGenerationActivated;
}

module.exports.setSampleDataCleaningActivated = function(sampleDataCleaningActivated) {
   _sampleDataCleaningActivated = sampleDataCleaningActivated;
}

//module methods

//execute the sample data routines in order to build a data sample
//for testing purposes
module.exports.load = function() {
   _clear(function() {
      if(_sampleDataGenerationActivated) {
         winston.verbose("========== Generating sample data ...");

         //execute the sample data routines in serie, each one running once
         //the previous function has completed
         var loadRoutinesWithErrorHandling = _.map(_loadRoutines, Util.handleErrorForAsync);
                                             //Each routine should be
                                             //surronded by an error handler in order to
                                             //improve error reporting
         async.series(loadRoutinesWithErrorHandling, function(errSeries, results) {
            if(errSeries) {
               winston.error("Error while generating sample data. err = [%s]", errSeries);
            }
            winston.verbose("========== Sample data generation ended");
         });
      }
   });

}
