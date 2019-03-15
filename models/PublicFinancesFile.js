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
var _modelName = 'PublicFinancesFile';

var _createModelSchema = function(mongoose) {
   //publicFinancesFile schema definition
   var publicFinancesFileSchema = new mongoose.Schema({
     creationDate: { //creation date
        type: Date,
        required: true,
        unique: false
     },
     length: { //in bytes
        type: Number,
        required: true,
        unique: false,
        default: 0
     },
     order: {
        type: Number,
        required: true,
        unique: false,
        default: 0
     },
     isFolder: {
        type: Boolean,
        required: true,
        default: 0
     },
     creationUser : { //who create
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: false
     },
     folder : { //who create or who last modified
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PublicFinancesFolder',
        required: false,
        unique: false
     },
     name: { //name in filesystem
        type: String,
        required: true,
        unique: false
     },
     description: {
        type: String,
        required: true,
        unique: false
     },
     extension: {
        type: String,
        required: true,
        unique: false
     },
     contentType: {
        type: String,
        required: true,
        unique: false
     }
   });

   return publicFinancesFileSchema;
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
