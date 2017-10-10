/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var User = require('../models/User.js').getModel();
var ServerGridUtils = require('../util/ServerGridUtils.js');
var Utils = require('../util/Utils.js');

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
      User.populate(data,  { path: 'primaryGroup', model: 'UserGroup' }).then(function(users){
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
      newUser.status = 'Ativo';

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
         if(result > 0){
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
   }else{
      Utils.sendJSONresponse(res, 400, { message: 'undefined email' });
   }
}
