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
var _modelName = 'LegislativePropositionRemoved';

var _createModelSchema = function(mongoose) {
   //legislative proposition schema definition
   var legislativePropositionRemovedSchema = new mongoose.Schema({
     legislativePropositionId: {
        type: String,
        required: true,
        unique: false
     },
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
     date: {
        type: Date,
        required: true,
        unique: false
     },
     description: {
        type: String,
        contentType: String
     },
     text: {
        type: String,
        contentType: String
     },
     consolidatedText: {
        type: String,
        contentType: String
     },
     textAttachment: {
        type: String,
        contentType: String
     },
     consolidatedTextAttachment: {
        type: String,
        contentType: String
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
     creationUser : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
     },
     changeUser : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
     },
     removeDate: {
        type: Date,
        required: false,
        unique: false
     },
     removeUser : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
     },
     type : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LegislativePropositionType',
        required: true
     },
     creationUser : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
     },
     changeUser : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
     },
     tags : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LegislativePropositionTag',
        required: false
     }],
     fileAttachments : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LegislativePropositionFileAttachment',
        required: false
     }],
     consolidatedFileAttachments : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LegislativePropositionFileAttachment',
        required: false
     }],
     relationships : [{
        type : {
           type: mongoose.Schema.Types.ObjectId,
           ref: 'LegislativePropositionRelationshipType',
           required: true
        },
        otherLegislativeProposition: {
           type: mongoose.Schema.Types.ObjectId,
           ref: 'LegislativeProposition',
           required: true
        }
     }]
   });
   // number/type must be unique
   legislativePropositionRemovedSchema.index({ type: 1, number: 1 }, { unique: true });

   return legislativePropositionRemovedSchema;
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
