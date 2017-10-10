/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var jwt = require('express-jwt');
var _ = require('lodash');
var Util = require('../util/Utils.js')

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _auth = jwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'payload'
});

var _hasRole = function(req, res, next, roleName) {
   //check if the logged user has the role
   if(req.payload.roles && _.find(req.payload.roles, _.curry(_.eq)(roleName) )) {
      next(); //ok - pass to the next middleware
   }else {
      var err = Util.newUnauthorizedError();
      next(err); //security error request
   }
}
/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
module.exports.isLoged = function() {
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
