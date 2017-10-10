/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var SecurityRole = require('../models/SecurityRole.js').getModel();
var Utils = require('../util/Utils.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getSecurityRoles = function(req, res, next) {
   SecurityRole.find({}).exec().then(function(result){
      Utils.sendJSONresponse(res, 200, {
          "securityRoles" : result
      });
   }).catch(function(err){
      winston.error("Error while getting security roles, err = [%s]", err);
      Utils.next(400, err, next);
   });
}
