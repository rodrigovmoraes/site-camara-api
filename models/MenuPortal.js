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
var _modelName = 'MenuPortal';

var _createModelSchema = function(mongoose) {
   //menu portal schema definition
   var menuPortalSchema = new mongoose.Schema( {
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
     url: {
        type: String,
        required: false
     },
     isRoot: {
        type: Boolean,
        required: true,
        default: false
     },
     menuItems: [{ type: mongoose.Schema.Types.ObjectId,
                   ref: 'MenuPortal',
                   required: false
                }],
     type: {
       type: String,
       required: false,
       unique: false,
       default: null
       //link, news, page, flickr, youtube
    },
    access : {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: {}
    }
   });

   return menuPortalSchema;
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
