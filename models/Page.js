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
var _modelName = 'Page';

var _createModelSchema = function(mongoose) {
   //page schema definition
   var pageSchema = new mongoose.Schema({
     title: {
        type: String,
        required: true,
        unique: false
     },
     tag: {
        type: String,
        required: false,
        unique: false,
        default: null
     },views: {
        type: Number,
        required: true,
        unique: false,
        default: 0
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
     },
     enableFacebookComments: {
        type: Boolean,
        required: false,
        unique: false
     },
     enableFacebookShareButton: {
        type: Boolean,
        required: false,
        unique: false
     }
   });

   return pageSchema;
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
