/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _connection;
var _mongoose;
var _model;
var _modelInitialized = false;
var _modelName = 'HotNewsItem';

var _createModelSchema = function(mongoose) {
   //hot news item schema definition
   var hotNewsItemSchema = new mongoose.Schema({
     title: {
        type: String,
        required: true,
        unique: false
     },
     type: {
        type: String,
        required: true,
        unique: false,
        default: 'link' //link, news, page, flickr, youtube
     },
     order: {
        type: Number,
        required: true,
        unique: false,
        default: 0
     },
     access : {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: {}
     }

     /******************
      access
      ******************
      //example for link type
      { "url": "http://addres/page",
        "target": "_blank"
      }

      //TODO: for others types
     */
   });

   return hotNewsItemSchema;
}

/*****************************************************************************
******************************* PUBLIC ***************************************
/*****************************************************************************/
module.exports.setConnection = function(connection) {
   _connection = connection;
}

module.exports.setMongoose = function(mongoose) {
   _mongoose = mongoose;
}

module.exports.getMongoose = function() {
   return _mongoose;
}

module.exports.getModel = function() {
   //if the model hasn´t been initialized, we should create the schema
   if(!_modelInitialized) {
      var schema = _createModelSchema(_mongoose);
      var model = _connection.model(_modelName, schema);
      var deepPopulate = require('mongoose-deep-populate')(_mongoose);
      schema.plugin(deepPopulate, {});
      _modelInitialized = true;
      return model;
   } else {
      return _connection.model(_modelName);
   }
}
