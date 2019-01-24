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
var _modelName = 'LegislativePropositionFileAttachment';

var _createModelSchema = function(mongoose) {
   //legislative proposition file attachment schema definition
   var legislativePropositionFileAttachmentSchema = new mongoose.Schema({
     file: {
        type: String,
        required: true,
        unique: false
     },
     originalFilename: {
        type: String,
        required: true,
        unique: false
     },
     contentType: {
        type: String,
        required: false,
        unique: false
     },
     legislativeProposition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LegislativeProposition',
        required: true
     },
     consolidatedFileAttachment: {
        type: Boolean,
        default: false,
        required: false,
        unique: false
     }
   });

   return legislativePropositionFileAttachmentSchema;
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
