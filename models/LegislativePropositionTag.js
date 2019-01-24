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
var _modelName = 'LegislativePropositionTag';

var _createModelSchema = function(mongoose) {
   //legislative proposition tag schema definition
   var legislativePropositionTagSchema = new mongoose.Schema({
     propositionType : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LegislativePropositionType',
        required: true
     },
     description: {
        type: String,
        required: true,
        unique: false
     }
   });

   return legislativePropositionTagSchema;
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
