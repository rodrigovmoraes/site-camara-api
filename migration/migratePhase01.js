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
var FBreakingNewsItem = require('../models/FBreakingNewsItem.js');
var PublicFile = require('../models/PublicFile.js');
var PublicFolder = require('../models/PublicFolder.js');
var UserGroupModule = require('../models/UserGroup.js');
var UserModule = require('../models/User.js');
var MenuPortalModule = require('../models/MenuPortal.js');
var SecurityRoleModule = require('../models/SecurityRole.js');
var MenuAdminModule = require('../models/MenuAdmin.js');

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
   //Fixed Breaking News Item Model
   FBreakingNewsItem.setMongoose(mongoose);
   FBreakingNewsItem.setConnection(connection);
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
   //Menu Portal Item
   MenuPortalModule.setMongoose(mongoose);
   MenuPortalModule.setConnection(connection);
   //Security Role
   SecurityRoleModule.setMongoose(mongoose);
   SecurityRoleModule.setConnection(connection);
   //Menu Admin Role
   MenuAdminModule.setMongoose(mongoose);
   MenuAdminModule.setConnection(connection);

   //migrate

   //*****************************************************************************
   //**************************Migration modules**********************************
   //*****************************************************************************
   var migrateSecurityRoles = require('./migrateSecurityRoles');
   var migrateUserGroup = require('./migrateUserGroup');
   var createUser = require('./createUser');
   var migrateUsers = require('./migrateUsers');
   var migrateMenuAdmin = require('./migrateMenuAdmin');

   var migrateLegislativePropositions = require('./migrateLegislativePropositions');
   var migrateFBreakingNews = require('./migrateFBreakingNews');
   var migratePublicFiles = require('./migratePublicFiles');
   var migratePrestaContas = require('./migratePrestaContas');
   var migrateNews = require('./migrateNews');
   var migrateLicitacoes = require('./migrateLicitacoes');
   var migrateMenuPortal = require('./migrateMenuPortal');

   var s3BucketCleanAndCreate = require('./s3BucketCleanAndCreate');

   await s3BucketCleanAndCreate.cleanS3Bucket();
   await s3BucketCleanAndCreate.createS3Bucket();
   await migrateSecurityRoles.run();
   await migrateUserGroup.run();
   await createUser.run();
   await migrateUsers.run();

   await migratePublicFiles.run();
   await migratePrestaContas.run();
   await migrateMenuAdmin.run();
   await migrateMenuPortal.run();
   await migrateLegislativePropositions.run();
   await migrateFBreakingNews.run();
   await migrateNews.run();
   await migrateLicitacoes.run();

   //close mongodb connection
   DbModule.close();
});
