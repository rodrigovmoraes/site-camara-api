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
var _modelName = 'PublicFolder';

var _createModelSchema = function(mongoose) {
   //publicFolder schema definition
   var publicFolderSchema = new mongoose.Schema({
     creationDate: {
        type: Date,
        required: true,
        unique: false
     },
     creationUser : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: false
     },
     folder : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PublicFolder',
        required: false,
        unique: false
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
        default: 1
     },
     name: { //name in filesystem
        type: String,
        required: true,
        unique: false,
        unique: false
     },
     description: {
        type: String,
        required: true,
        unique: false
     }
   });

   return publicFolderSchema;
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
