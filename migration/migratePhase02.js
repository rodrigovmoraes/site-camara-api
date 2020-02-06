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
var MenuPortalModule = require('../models/MenuPortal.js');
var SecurityRoleModule = require('../models/SecurityRole.js');
var MenuAdminModule = require('../models/MenuAdmin.js');

/*****************************************************************************
********************************* MODELS MODULES *****************************
******************************************************************************/
DbModule.setDbURI(camaraApiConfig.Models.Db.dbURI);
DbModule.useMock(camaraApiConfig.Models.Db.useMock);
DbModule.connect(async function(mongoose, connection) {
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
   var createUser = require('./createUser');

   var migrateSecurityRoles = require('./migrateSecurityRoles');
   var migrateLegislativePropositions = require('./migrateLegislativePropositions');
   var migratePublicFiles = require('./migratePublicFiles');
   var migratePrestaContas = require('./migratePrestaContas');
   var migrateNews = require('./migrateNews');
   var migrateLicitacoes = require('./migrateLicitacoes');
   var migrateMenuAdmin = require('./migrateMenuAdmin');
   var migrateMenuPortal = require('./migrateMenuPortal');

   var s3BucketCleanAndCreate = require('./s3BucketCleanAndCreate');

   //await s3BucketCleanAndCreate.cleanS3Folder('/legislative_proposition');
   await s3BucketCleanAndCreate.cleanS3Folder('/news');
   //await s3BucketCleanAndCreate.cleanS3Folder('/public_files');
   //await s3BucketCleanAndCreate.cleanS3Folder('/licitacoes_events');

   //news
   NewsItemModule.getModel().collection.drop();

   //licitacoes
   //LicitacaoEventModule.getModel().collection.drop();
   //LicitacaoModule.getModel().collection.drop();
   //LicitacaoCategoryModule.getModel().collection.drop();

   //legislative proposition
   //LegislativePropositionFileAttachment.getModel().collection.drop();
   //LegislativeProposition.getModel().collection.drop();
   //LegislativePropositionRelationshipType.getModel().collection.drop();
   //LegislativePropositionTag.getModel().collection.drop();
   //LegislativePropositionType.getModel().collection.drop();

   //menus
   //MenuPortalModule.getModel().collection.drop();
   //MenuAdminModule.getModel().collection.drop();;

   //public files
   //PublicFile.getModel().collection.drop();
   //PublicFolder.getModel().collection.drop();

   await createUser.run();

   //security roles
   //don't drop secure roles, but load them
   //await migrateSecurityRoles.run();

   //await migratePublicFiles.run();
   //await migratePrestaContas.run();
   //await migrateLegislativePropositions.run();
   await migrateNews.run();
   //await migrateLicitacoes.run();

   //await migrateMenuAdmin.run();
   //await migrateMenuPortal.run();

   //close mongodb connection
   DbModule.close();
});
