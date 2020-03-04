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

var LegislativePropositionModule = require('./models/LegislativeProposition.js');

/*****************************************************************************
********************************* MODELS MODULES *****************************
******************************************************************************/
DbModule.setDbURI(camaraApiConfig.Models.Db.dbURI);
DbModule.useMock(camaraApiConfig.Models.Db.useMock);
DbModule.connect(async function(mongoose, connection) {
   //News Model
   LegislativePropositionModule.setMongoose(mongoose);
   LegislativePropositionModule.setConnection(connection);
   var LegislativeProposition = LegislativePropositionModule.getModel();

   await LegislativeProposition
            .find({})
            .then(async function(legislativePropositions) {
               var k = 0;
               var legislativeProposition;
               if (legislativePropositions) {
                  console.log(legislativePropositions.length);
                  for (k = 0; k < legislativePropositions.length; k++) {
                     legislativeProposition = legislativePropositions[k];
                     //populate search field
                     try {
                        legislativeProposition.textSearch = htmlToText.fromString( ( legislativeProposition.description ? legislativeProposition.description : "" ) + " " + ( legislativeProposition.text ? legislativeProposition.text : "" ) + " " + ( legislativeProposition.textAttachment ? legislativeProposition.textAttachment : "" ), {
                           ignoreHref: true,
                           ignoreImage: true,
                           preserveNewlines: false
                        });
                        legislativeProposition.textSearch = legislativeProposition.textSearch ? legislativeProposition.textSearch.toLowerCase() : "";
                        legislativeProposition.textSearch = legislativeProposition.textSearch ? legislativeProposition.textSearch.replace(/\n/g, " ") : "";
                        await legislativeProposition.save();
                        console.log(k / legislativePropositions.length)
                     } catch (e) {
                        winston.verbose("Error while extracting text from legislative proposition for searching purposes, err = [%s]", e);
                     }
                  }
               }
               return Promise.resolve(true);
            });
   //close mongodb connection
   DbModule.close();
});
