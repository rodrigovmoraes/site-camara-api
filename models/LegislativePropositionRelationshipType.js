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
var _modelName = 'LegislativePropositionRelationshipType';

var _createModelSchema = function(mongoose) {
   //legislative proposition relationship type schema definition
   var legislativePropositionRelationshipTypeSchema = new mongoose.Schema({
     description: {
        type: String,
        required: true,
        unique: false
     },
     code: {
        type: Number,
        required: true,
        unique: true
     },
     antonymCode: {
        type: Number,
        required: true,
        unique: true
     },
     antonym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LegislativePropositionRelationshipType',
        required: false
     }
   });

   return legislativePropositionRelationshipTypeSchema;
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
