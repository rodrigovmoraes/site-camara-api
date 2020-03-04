/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
require('dotenv').load();
var config = require('config');
var winston = require('winston');
var htmlToText = require('html-to-text');

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('./util/Utils.js');

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
var DbModule = require('./models/Db.js');

var NewsItemModule = require('./models/NewsItem.js');

/*****************************************************************************
********************************* MODELS MODULES *****************************
******************************************************************************/
DbModule.setDbURI(camaraApiConfig.Models.Db.dbURI);
DbModule.useMock(camaraApiConfig.Models.Db.useMock);
DbModule.connect(async function(mongoose, connection) {
   //News Model
   NewsItemModule.setMongoose(mongoose);
   NewsItemModule.setConnection(connection);
   var NewsItem = NewsItemModule.getModel();

   await NewsItem
            .find({})
            .then(async function(newsItems) {
               var k = 0;
               var newsItem;
               if (newsItems) {
                  console.log(newsItems.length);
                  for (k = 0; k < newsItems.length; k++) {
                     newsItem = newsItems[k];
                     //populate search field
                     try {
                        newsItem.textSearch = htmlToText.fromString(( newsItem.title ? newsItem.title : "" ) + " " + ( newsItem.headline ? newsItem.headline : "" ) + " " + ( newsItem.body ? newsItem.body : "" ), {
                           ignoreHref: true,
                           ignoreImage: true,
                           preserveNewlines: false
                        });
                        newsItem.textSearch = newsItem.textSearch ? newsItem.textSearch.toLowerCase() : "";
                        newsItem.textSearch = newsItem.textSearch ? newsItem.textSearch.replace(/\n/g, " ") : "";
                        await newsItem.save();
                        console.log(k / newsItems.length)
                     } catch(e) {
                        winston.verbose("Error while extracting text from news item for searching purposes, err = [%s]", e);
                     }
                  }
               }
               return Promise.resolve(true);
            });
   //close mongodb connection
   DbModule.close();
});
