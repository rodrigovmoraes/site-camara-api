/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
require('mongoose-type-email');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _connection;
var _mongoose;
var _model;
var _modelInitialized = false;
var _modelName = 'User';
var _expireInSeconds = 86400; //default 1 day

var _createModelSchema = function(mongoose) {
   //user schema defition
   var userSchema = new mongoose.Schema({
     username: {
        type: String,
        unique: true,
        required: true
     },
     email: {
       type:  mongoose.SchemaTypes.Email,
       unique: false,
       required: false,
       allowBlank: true
     },
     name: {
       type: String,
       required: true
     },
     hash: String,
     salt: String,
     roles: [{  type: mongoose.Schema.Types.ObjectId,
                ref: 'SecurityRole',
                required: true
            }],
     extendedRoles: [String],
     primaryGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup' },
     secondaryGroups: [{ type: mongoose.Schema.Types.ObjectId,
                         ref: 'UserGroup',
                         required: false
                      }],
     creationDate: Date,
     status: Boolean
   });

   userSchema.methods.setPassword = function (password) {
     this.salt = crypto.randomBytes(16).toString('hex');
     this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
   };

   userSchema.methods.validPassword = function (password) {
     var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
     return this.hash === hash;
   };

   userSchema.methods.generateJwt = function () {
     var expiry = new Date();
     expiry.setTime(expiry.getTime() + _expireInSeconds * 1000);

     return jwt.sign({
       _id: this._id,
       email: encodeURIComponent(this.email),
       name: encodeURIComponent(this.name),
       exp: parseInt(expiry.getTime() / 1000),
     }, process.env.JWT_SECRET); // DO NOT KEEP YOUR SECRET IN THE CODE!
   };

   userSchema.methods.getAllRoles = function () {
     return _getRolesFromUser(this._id);
   };

   return userSchema;
}

/*****************************************************************************
******************************* PUBLIC ***************************************
/*****************************************************************************/
//set how long the token will be valid
module.exports.setExpireInSeconds = function(expireInSeconds) {
   _expireInSeconds = expireInSeconds;
}

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
      _modelInitialized = true;
      return model;
   } else {
      return _connection.model(_modelName);
   }
}
