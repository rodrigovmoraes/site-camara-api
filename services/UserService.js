/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var UserGroupModule = require('../models/UserGroup.js');
var SecurityRoleModule = require('../models/SecurityRole.js');
var User = require('../models/User.js').getModel();
var UserGroup = UserGroupModule.getModel();
var SecurityRole = SecurityRoleModule.getModel();
var _ = require('lodash');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//get the parent group of the given group
var _getParentUserGroup = function(groupId) {
   return new Promise(function(resolve, reject) {
      UserGroup.findOne({ 'children' : { '$elemMatch' : { '$eq' : groupId }
                                       }
                       }).then(function(parentGroup) {
                          resolve(parentGroup);
                       }).catch(function(err) {
                          reject(err);
                       });
   });
}

//get all roles from the user group, it includes inherited roles from parents
var _getRolesFromGroup = async function(groupId) {
   var rolesCollection = [];

   var roles = await new Promise(function(resolve, reject) {
      UserGroup.findById(groupId).then(function(group) {
         if(group) {
            resolve(group.roles);
         } else {
            resolve(null);
         }
      }).catch(function(err) {
         reject(err);
      });
   });

   if(roles) {
      roles.forEach(function(role) {
         rolesCollection.push(role);
      });
   }

   var parent = await _getParentUserGroup(groupId);
   while(parent) {
      if(parent.roles) {
         parent.roles.forEach(function(role) {
            rolesCollection.push(role);
         });
      }
      parent = await _getParentUserGroup(parent._id);
   }

   return rolesCollection;
}
/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods

//get all roles from the user
module.exports.getRolesFromUser = async function(userId) {
   //roles from primary group
   var roles = [];
   var user = await new Promise(function(resolve, reject) {
      User.findById(userId).then(function(user) {
         resolve(user);
      }).catch(function(err) {
         reject(err);
      });
   });

   //collect roles from roles property
   if(user.roles) {
      roles = user.roles;
   }

   //collect roles from primaryGroup
   if(user && user.primaryGroup) {
      var rolesPri = await _getRolesFromGroup(user.primaryGroup);
      if(rolesPri) {
         rolesPri.forEach(function(rolePri) {
            roles.push(rolePri);
         });
      }
   }
   //collect roles from secondary groups
   if(user && user.secondaryGroups) {
      var i = 0;
      for(i = 0; i < user.secondaryGroups.length; i++) {
         var secondaryGroup = user.secondaryGroups[i];
         var rolesSec = await _getRolesFromGroup(secondaryGroup);
         if(rolesSec) {
            rolesSec.forEach(function(roleSec) {
               roles.push(roleSec);
            });
         }
      }
   }
   //remove duplicated roles
   roles = _.map(roles, function(role) {
      return role.toString();
   });
   var roles = _.uniq(roles);
   var roleObjs = [];
   var i = 0;
   //build the array of role objects
   for(i = 0; i < roles.length; i++) {
      var role = roles[i];
      var roleObj = await new Promise(function(resolve, reject) {
         SecurityRole.findById(role).then(function(roleInstance) {
            resolve(roleInstance);
         }).catch(function(err) {
            reject(err);
         });
      });
      if(roleObj) {
         roleObjs.push(roleObj);
      }
   }
   return _.map(roleObjs, 'name');
}
