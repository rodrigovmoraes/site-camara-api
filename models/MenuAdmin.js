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
var _modelName = 'MenuAdmin';

var _createModelSchema = function(mongoose) {
   //menu admin schema definition
   var menuAdminSchema = new mongoose.Schema({
     title: {
        type: String,
        required: true,
        unique: false
     },
     order: {
        type: Number,
        required: true,
        default: -1
     },
     sref: {
        type: String,
        required: false
     },
     icon: {
        type: String,
        required: true
     },
     role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SecurityRole',
        required: false
     },
     isRoot: {
        type: Boolean,
        required: true,
        default: false
     },
     menuItems: [{ type: mongoose.Schema.Types.ObjectId,
                  ref: 'MenuAdmin',
                  required: false
                }]
   });

   return menuAdminSchema;
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
