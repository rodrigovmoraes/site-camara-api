/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var jwt = require('express-jwt');
var _ = require('lodash');
var Util = require('../util/Utils.js');
var winston = require('winston');
var User = require('../models/User.js').getModel();

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _auth = jwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'payload'
});

var _hasRole = function(req, res, next, roleName) {
   var _accessError = function(prmNext) {
      var err = Util.newUnauthorizedError();
      prmNext(err); //security error request
   }
   //check if the logged user has the role
   User.findById(req.payload._id).then(function(user) {
      if (user) {
         if(user.extendedRoles) {
            if(_.indexOf(user.extendedRoles, roleName) >= 0) {
               next();
            } else {
               _accessError(next);
            }
         } else {
            _accessError(next);
         }
      } else {
         _accessError(next);
      }
   }).catch(function(err) {
      winston.error("Server error during role checking process: " + err.message);
      _accessError(next);
   });
}
/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
module.exports.isLogged = function() {
   return _auth;
}

module.exports.hasRole = function(roleName) {
   return [
               _auth, // check first if the user is logged
                      // and save the user info in jwt token
                      // to the request object

               function(req, res, next) {
                  _hasRole(req, res, next, roleName);
               }

          ];
}
