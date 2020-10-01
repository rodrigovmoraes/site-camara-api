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
var _modelName = 'Licitacao';

var _createModelSchema = function(mongoose) {
   //licitacao schema definition
   var licitacaoSchema = new mongoose.Schema({
     number: {
        type: Number,
        required: true,
        unique: false
     },
     year: {
        type: Number,
        required: true,
        unique: false
     },
     description: {
        type: String,
        required: true,
        unique: false
     },
     creationDate: {
        type: Date,
        required: true,
        unique: false
     },
     publicationDate: {
        type: Date,
        required: false,
        unique: false
     },
     changedDate: {
        type: Date,
        required: false,
        unique: false
     },
     state : {
        type: Number,
        required: true,
        unique: false,
        default: 0
        //0: created
        //1: published
        //2: invisible
     },
     category : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LicitacaoCategory',
        required: true
     },
     events : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LicitacaoEvent',
        required: true
     }],
     covid: {
        type: Boolean,
        required: false,
        unique: false,
        default: false
     }
   });
   // number/year must be unique
   licitacaoSchema.index({ year: 1, number: 1, category: 1 }, { unique: true });

   return licitacaoSchema;
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
