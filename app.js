/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
require('dotenv').load();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var fileUpload = require('express-fileupload');
var bodyParser = require('body-parser');
var fs = require('fs');
var config = require('config');
var winston = require('winston');
var cors = require('cors');

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('./util/Utils.js');
var httpLog = require('./middlewares/httplog.js');

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
var app = express();

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

//models config
var DbModule = require('./models/Db.js');
var UserModule = require('./models/User.js');
var UserGroupModule = require('./models/UserGroup.js');
var SecurityRoleModule = require('./models/SecurityRole.js');
var MenuAdminModule = require('./models/MenuAdmin.js');
var MenuPortalModule = require('./models/MenuPortal.js');
var NewsItemModule = require('./models/NewsItem.js');
var PageModule = require('./models/Page.js');
var BannerModule = require('./models/Banner.js');
var HotNewsItemModule = require('./models/HotNewsItem.js');
var BreakingNewsItemModule = require('./models/BreakingNewsItem.js');
var FBreakingNewsItemModule = require('./models/FBreakingNewsItem.js');
DbModule.setDbURI(camaraApiConfig.Models.Db.dbURI);
DbModule.useMock(camaraApiConfig.Models.Db.useMock);
DbModule.connect(function(mongoose, connection) {
   //SecurityRoleModule Model
   SecurityRoleModule.setMongoose(mongoose);
   SecurityRoleModule.setConnection(connection);
   //UserGroup Model
   UserGroupModule.setMongoose(mongoose);
   UserGroupModule.setConnection(connection);
   //User Model
   UserModule.setExpireInSeconds(camaraApiConfig.Security.jwtExpireInSeconds);
   UserModule.setMongoose(mongoose);
   UserModule.setConnection(connection);
   //MenuAdmin Model
   MenuAdminModule.setMongoose(mongoose);
   MenuAdminModule.setConnection(connection);
   //MenuPortal Model
   MenuPortalModule.setMongoose(mongoose);
   MenuPortalModule.setConnection(connection);
   //News Model
   NewsItemModule.setMongoose(mongoose);
   NewsItemModule.setConnection(connection);
   //Page Model
   PageModule.setMongoose(mongoose);
   PageModule.setConnection(connection);
   //Banner Model
   BannerModule.setMongoose(mongoose);
   BannerModule.setConnection(connection);
   //Hot News Item Model
   HotNewsItemModule.setMongoose(mongoose);
   HotNewsItemModule.setConnection(connection);
   //Breaking News Item Model
   BreakingNewsItemModule.setMongoose(mongoose);
   BreakingNewsItemModule.setConnection(connection);
   //Fixed Breaking News Item Model
   FBreakingNewsItemModule.setMongoose(mongoose);
   FBreakingNewsItemModule.setConnection(connection);
   //sample data generator
   var SampleDataGenerator = require('./models/SampleDataGenerator.js');
   SampleDataGenerator.setSampleDataGenerationActivated(camaraApiConfig.Models.SampleDataGenerator.activated);
   SampleDataGenerator.setSampleDataCleaningActivated(camaraApiConfig.Models.SampleDataGenerator.cleaningActivated);
   //if it is activated, the SampleDataGenerator is going to generate the sample data
   //for testing purposes
   SampleDataGenerator.load();
});

/*****************************************************************************
********************* MIDDLEWARES CONFIG SECTION *****************************
******************************************************************************/
app.use(httpLog);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//set Cross Origin Resource Sharing (CORS)
//see: http://restlet.com/company/blog/2015/12/15/understanding-and-using-cors/
app.use(cors());
app.options('*', cors());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
//routes config
// portal routes
var portalRoutes = require('./routes/index.js')
app.use('/', portalRoutes);

/*****************************************************************************
************************** ERROR HANDLING SECTION ****************************
/*****************************************************************************/
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// error handlers

// Catch unauthorised errors
app.use(function (err, req, res, next) {
  if (err.name === Util.getUnauthorizedErrorName()) {
       res.status(401);
       res.json({"message" : err.name + ": " + err.message});
   }else{
      next(err);
   }
});

app.use(function(err, req, res, next) {
   Util.sendJSONErrorResponse( res,
                               err.status || 500,
                               err );
});

module.exports = app;
