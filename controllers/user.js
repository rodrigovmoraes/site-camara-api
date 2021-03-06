/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var UserModule = require('../models/User.js');
var User = UserModule.getModel();
var UserService = require('../services/UserService.js');
var ServerGridUtils = require('../util/ServerGridUtils.js');
var Utils = require('../util/Utils.js');
var messages = require('../services/messages.js');
var _ = require('lodash');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getUsers = function(req, res, next) {
   var UserQuery = User.find({}).select("status creationDate primaryGroup email name username");
   var querySelectFields = [ { field: "primaryGroup", ref: "UserGroup", descriptionField: "completeName" } ];

   ServerGridUtils.getDataGrid(User, UserQuery, querySelectFields, req, res, next, function(data, count, selectFilters){
      User.populate(data,  { path: 'primaryGroup', model: 'UserGroup' }).then(function(users) {
         Utils.sendJSONresponse(res, 200, {
             "users" : data,
             "totalLength" : count,
             "selectFilters" : selectFilters
         });
      }).catch(function(err){
         winston.error("Error while getting users, err = [%s]", err);
         Utils.next(400, err, next);
      });
   });
}

module.exports.getUser = function(req, res, next) {
   User.findOne({ _id: req.params.id })
       .select("username name email status creationDate primaryGroup secondaryGroups roles")
       .populate("primaryGroup secondaryGroups roles")
       .exec().then(function(result) {
      Utils.sendJSONresponse(res, 200, {
          "user" : result
      });
   }).catch(function(err){
      winston.error("Error while getting user, err = [%s]", err);
      Utils.next(400, err, next);
   });
}

module.exports.newUser = function(req, res, next) {
   if(req.body.user){
      var newUserJSON = req.body.user;

      var newUser = new User();
      newUser.username = newUserJSON.username;
      newUser.name = newUserJSON.name;
      newUser.email = newUserJSON.email;
      newUser.setPassword(newUserJSON.password);
      newUser.roles = [];
      newUser.primaryGroup = newUserJSON.primaryGroup;
      newUser.creationDate = new Date();
      newUser.status = true;

      winston.debug("Saving new user ...");

      newUser.save(function(err, newUser) {
         if(!err) {
            winston.verbose("New user saved.");
            Utils.sendJSONresponse(res, 200, { message: 'new user saved', id: newUser._id });
         } else {
            winston.error("Error while saving the new user, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined user' });
   }
}

module.exports.saveUser = function(req, res, next) {
   if(req.body.user){
      var userJSON = req.body.user;

      User.findById(userJSON._id).exec().then(function(user) {
         //check if the user was found
         if(!user) {
            Utils.sendJSONresponse(res, 400, { message: 'user not found' });
            return;
         }

         user.name = userJSON.name;
         user.email = userJSON.email;
         user.status = userJSON.status;
         user.primaryGroup = userJSON.primaryGroup;
         user.secondaryGroups = userJSON.secondaryGroups;
         user.roles = userJSON.roles;
         if(userJSON.keepPassword === "false") {
            user.setPassword(userJSON.password);
         }

         winston.debug("Saving user ...");

         user.save(function(err) {
            if(!err) {
               winston.verbose("User saved.");
               Utils.sendJSONresponse(res, 200, { message: 'User saved' });
            } else {
               winston.error("Error while saving the user, err = [%s]", err);
               Utils.next(400, err, next);
            }
         });
      }).catch(function(err){
         winston.error("Error while saving the user, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined user' });
   }
}

module.exports.checkUniqueUsername = function(req, res, next) {
   var username = req.params.username;
   if(username) {
      User.count({'username' : username}).exec().then(function(result){
         if(result > 0) {
               Utils.sendJSONresponse(res, 200, { exists: true });
         } else {
               Utils.sendJSONresponse(res, 200, { exists: false });
         }
      });
   }else{
      Utils.sendJSONresponse(res, 400, { message: 'undefined username' });
   }
}

module.exports.checkUniqueEmail = function(req, res, next) {
   var email = req.params.email;
   if(email) {
      User.count({'email' : email}).exec().then(function(result){
         if(result > 0){
               Utils.sendJSONresponse(res, 200, { exists: true });
         } else {
               Utils.sendJSONresponse(res, 200, { exists: false });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined email' });
   }
}

module.exports.getRolesFromUser = function(req, res, next) {
   var userId = req.params.userId;
   if(userId) {

      User.findById(userId).then(function(user) {
         if(user) {
            UserService.getRolesFromUser(userId).then(function(roles) {
               Utils.sendJSONresponse(res, 200, { 'roles':  roles });
            }).catch(function(err) {
               Utils.next(400, err, next);
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'user not found' });
         }

      }).catch(function(err) {
         Utils.next(400, err, next);
      });

   } else {
      Utils.sendJSONresponse(res, 400, { message: 'user id undefined' });
   }
}

module.exports.checkAccess = function(req, res, next) {
   var role = req.params.roleName;
   if(role) {
      //check if the logged user has the role
      User.findById(req.payload._id).then(function(user) {
         if (user) {
            if(user.extendedRoles) {
               Utils.sendJSONresponse(res, 200, { 'ok':  _.indexOf(user.extendedRoles, role) >= 0 });
            } else {
               Utils.sendJSONresponse(res, 200, { 'ok':  false });
            }
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'user not found' });
         }
      }).catch(function(err) {
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'role undefined' });
   }
}

//change password process controller
module.exports.changePasswordController = function(req, res) {
   if (!req.payload) {
      Utils.sendJSONresponse(res, 403, { message: 'you must be logged in' });
   } else if (!req.body.password || !req.body.newPassword) {
      Utils.sendJSONresponse(res, 400, {
         "message":  messages.allFieldsRequired
      });
   } else {
      var password = req.body.password;
      var newPassword = req.body.newPassword;

      User.findOne({ '_id':  UserModule.getMongoose().Types.ObjectId(req.payload._id) }, function (err, user) {
         if (err) { //something is wrong with db server
            winston.error("Error while checking password in order to change the user password, err = [%s]", err);
            Utils.next(400, err, next);
         } else if (!user) { //invalid credentials, user not found
           Utils.sendJSONresponse(res, 400, { message: messages.invalidCredentials, passwordError: true });
         } else if (!user.validPassword(password) || !user.status) {
            Utils.sendJSONresponse(res, 400, { message: messages.invalidCredentials, passwordError: true });
         } else {
            //change the password
            user.setPassword(newPassword);
            user.save(function (err) {
              if (err) {
                 Utils.next(400, err, next);
              } else {
                 Utils.sendJSONresponse(res, 200, { message: 'password changed' });
              }
            });
         }
      });
   }
};
