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
var _modelName = 'NewsItem';

var _createModelSchema = function(mongoose) {
   //news item schema definition
   var newsItemSchema = new mongoose.Schema({
     title: {
        type: String,
        required: true,
        unique: false
     },
     headline: {
        type: String,
        contentType: String
     },
     views: {
        type: Number,
        required: true,
        unique: false,
        default: 0
     },
     publish: {
        type: Boolean,
        required: true,
        unique: false
     },
     publicationDate: {
        type: Date,
        required: false,
        unique: false
     },
     thumbnailFile: {
        type: String,
        required: true,
        unique: false
     },
     creationDate: {
        type: Date,
        required: true,
        unique: false
     },
     changedDate: {
        type: Date,
        required: false,
        unique: false
     },
     body: {
        type: String,
        contentType: String
     }
   });

   return newsItemSchema;
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
