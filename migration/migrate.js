/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
require('dotenv').load();
var config = require('config');
var winston = require('winston');

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/


/*****************************************************************************
***************************** APP CONFIG SECTION *****************************
******************************************************************************/
var camaraApiConfig = config.get("CamaraApi")
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
********************************* MODELS MODULES *****************************
******************************************************************************/

//models config
var DbModule = require('../models/Db.js');

var NewsItemModule = require('../models/NewsItem.js');
var LicitacaoCategoryModule = require('../models/LicitacaoCategory.js');
var LicitacaoEventModule = require('../models/LicitacaoEvent.js');
var LicitacaoModule = require('../models/Licitacao.js');
var LegislativeProposition = require('../models/LegislativeProposition.js');
var LegislativePropositionFileAttachment = require('../models/LegislativePropositionFileAttachment.js');
var LegislativePropositionRelationshipType = require('../models/LegislativePropositionRelationshipType.js');
var LegislativePropositionTag = require('../models/LegislativePropositionTag.js');
var LegislativePropositionType = require('../models/LegislativePropositionType.js');
var PublicFile = require('../models/PublicFile.js');
var PublicFolder = require('../models/PublicFolder.js');
var UserGroupModule = require('../models/UserGroup.js');
var UserModule = require('../models/User.js');

/*****************************************************************************
********************************* MODELS MODULES *****************************
******************************************************************************/
DbModule.setDbURI(camaraApiConfig.Models.Db.dbURI);
DbModule.useMock(camaraApiConfig.Models.Db.useMock);
DbModule.connect(async function(mongoose, connection) {
   await connection.dropDatabase();
   //News Model
   NewsItemModule.setMongoose(mongoose);
   NewsItemModule.setConnection(connection);
   //Licitacao Category Model
   LicitacaoCategoryModule.setMongoose(mongoose);
   LicitacaoCategoryModule.setConnection(connection);
   //Licitacao Event Model
   LicitacaoEventModule.setMongoose(mongoose);
   LicitacaoEventModule.setConnection(connection);
   //Licitacao Model
   LicitacaoModule.setMongoose(mongoose);
   LicitacaoModule.setConnection(connection);
   //LegislativeProposition Model
   LegislativeProposition.setMongoose(mongoose);
   LegislativeProposition.setConnection(connection);
   //LegislativePropositionFileAttachment Model
   LegislativePropositionFileAttachment.setMongoose(mongoose);
   LegislativePropositionFileAttachment.setConnection(connection);
   //LegislativePropositionRelationshipType Model
   LegislativePropositionRelationshipType.setMongoose(mongoose);
   LegislativePropositionRelationshipType.setConnection(connection);
   //LegislativePropositionTag Model
   LegislativePropositionTag.setMongoose(mongoose);
   LegislativePropositionTag.setConnection(connection);
   //LegislativePropositionType Model
   LegislativePropositionType.setMongoose(mongoose);
   LegislativePropositionType.setConnection(connection);
   //PublicFile Model
   PublicFile.setMongoose(mongoose);
   PublicFile.setConnection(connection);
   //PublicFolder Model
   PublicFolder.setMongoose(mongoose);
   PublicFolder.setConnection(connection);
   //User Group
   UserGroupModule.setMongoose(mongoose);
   UserGroupModule.setConnection(connection);
   //User
   UserModule.setMongoose(mongoose);
   UserModule.setConnection(connection);

   //migrate

   //*****************************************************************************
   //**************************Migration modules**********************************
   //*****************************************************************************
   var createUser = require('./createUser');
   var migrateLegislativePropositions = require('./migrateLegislativePropositions');
   var s3BucketCleanAndCreate = require('./s3BucketCleanAndCreate');

   await s3BucketCleanAndCreate.cleanS3Bucket();
   await s3BucketCleanAndCreate.createS3Bucket();
   await createUser.run();
   await migrateLegislativePropositions.run();
   //close mongodb connection
   DbModule.close();
});
