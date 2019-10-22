/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var UserGroupModule = require('../models/UserGroup.js');
var UserModule = require('../models/User.js');
var UserGroup = UserGroupModule.getModel();
var User = UserModule.getModel();
var Utils = require('../util/Utils.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getUserGroups = function(req, res, next) {
   UserGroup.find({}).exec().then(function(result) {
      Utils.sendJSONresponse(res, 200, {
          "userGroups" : result
      });
   }).catch(function(err){
      winston.error("Error while getting user groups, err = [%s]", err);
      Utils.next(400, err, next);
   });
}

module.exports.getUserGroups = function(req, res, next) {
   UserGroup.find({}).exec().then(function(result){
      Utils.sendJSONresponse(res, 200, {
          "userGroups" : result
      });
   }).catch(function(err){
      winston.error("Error while getting user groups, err = [%s]", err);
      Utils.next(400, err, next);
   });
}

module.exports.getUserGroupsTree = function(req, res, next) {
   UserGroup.find({ isRoot: true }).populate("roles").exec().then(async function(rootGroups) {
      if(rootGroups) {
         var i;
         for(i = 0; i < rootGroups.length; i++) {
            var rootGroup = rootGroups[i];
            var availableNodes = [];
            availableNodes.push(rootGroup);

            //while it has nodes to be visited
            while(availableNodes.length > 0) {
               //get a node from the list of nodes to be visited
               var currentNode = availableNodes.pop();
               //visit, process the node
               if(currentNode.children && currentNode.children.length > 0) {
                  var j;
                  var nodeChildren = [];
                  for(j = 0; j < currentNode.children.length; j++) {
                     var child;
                     if(currentNode.children[j]) {
                        var child = await new Promise(function(resolve, reject) {
                           UserGroup.findById(currentNode.children[j].toString())
                                    .populate("roles")
                                    .then(function(result)
                           {
                              resolve(result);
                           }).catch(function(err){
                              reject(err);
                           });
                        });
                     }

                     if(child) {
                        nodeChildren.push(child);
                     }
                  }
                  currentNode.children = nodeChildren;
                  //put the children of the node in the list of nodes
                  //to be visited
                  currentNode.children.forEach(function(child) {
                     availableNodes.push(child);
                  });
               }
            }
         }

         Utils.sendJSONresponse(res, 200, {
             "userGroupsTree" : rootGroups
         });

      } else {
         Utils.sendJSONresponse(res, 200, {
             "userGroupsTree" : {}
         });
      }

   }).catch(function(err){
      winston.error("Error while getting user groups [subgroups populated], err = [%s]", err);
      Utils.next(400, err, next);
   });
}

module.exports.saveUserGroup = function(req, res, next) {
   if(req.body.userGroup) {
      var userGroupJSON = req.body.userGroup;

      UserGroup.findById(userGroupJSON._id).exec().then(function(userGroup) {
         //check if the group was found
         if(!userGroup) {
            Utils.sendJSONresponse(res, 400, { message: 'user group not found' });
            return;
         }

         userGroup.name = userGroupJSON.name;
         userGroup.completeName = userGroupJSON.completeName;
         userGroup.roles = userGroupJSON.roles;
         userGroup.children = userGroupJSON.children;
         userGroup.isRoot = userGroupJSON.isRoot;

         winston.debug("Saving the user group...");

         userGroup.save(function(err) {
            if(!err) {
               winston.verbose("User group saved.");
               Utils.sendJSONresponse(res, 200, { message: 'User group saved' });
            } else {
               winston.error("Error while saving the user group, err = [%s]", err);
               Utils.next(400, err, next);
            }
         });
      }).catch(function(err){
         winston.error("Error while saving the user group, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined user group' });
   }
}

module.exports.newUserGroup = function(req, res, next) {
   if(req.body.userGroup) {
         var userGroupJSON = req.body.userGroup;

         var userGroup = new UserGroup({
            'name': userGroupJSON.name,
            'completeName': userGroupJSON.completeName,
            'children': userGroupJSON.children,
            'roles': userGroupJSON.roles,
            'isRoot': userGroupJSON.isRoot === undefined ? false : userGroupJSON.isRoot
         });

         winston.debug("Saving the new user group...");

         userGroup.save(function(err, result) {
            if(!err) {
               winston.verbose("User group created.");
               Utils.sendJSONresponse(res, 200, { 'message': 'User group created.',
                                                   'id': result.id
                                                });
            } else {
               winston.error("Error while creating the user group, err = [%s]", err);
               Utils.next(400, err, next);
            }
         });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined user group' });
   }
}

//delete the user group and its children
module.exports.deleteDeeplyUserGroup = function(req, res, next) {

   var collectAndExecuteDeletes = async function(userGroup) {
      var toBeVisited = [];
      var deletes = [];
      //put the root user group in the list
      //of nodes to be processed
      toBeVisited.push(userGroup._id);

      while(toBeVisited.length > 0) { //there are still nodes to be processed
         var rootId = toBeVisited.pop();

         var rootNode = await new Promise(function(resolve, reject) {
            UserGroup.findById(rootId).exec().then(function(result) {
               resolve(result);
            }).catch(function(err){
               reject(err);
            });
         });

         //visit
         var children = rootNode.children;

         deletes.push( { deleteOne: {
                          filter: { '_id':  rootId }
                       }
                     });
         //mark the children to be processed
         if(rootNode.children) {
            rootNode.children.forEach(function(childId) {
               toBeVisited.push(childId);
            });
         }
      }

      //execute the deletes
      return UserGroup.bulkWrite(deletes);
   }

   if(req.params.id) {
      var userGroupId = req.params.id;

      UserGroup.findById(userGroupId).exec().then(function(userGroup) {
         //check if the group was found
         if(!userGroup) {
            throw new Error("user group not found");
         }

         //execute a breadth first search collecting the updates in the tree
         return collectAndExecuteDeletes(userGroup);
      }).then(function(result) {
         winston.verbose("User group deleted");
         Utils.sendJSONresponse(res, 200, { message: 'User group deleted' });
      }).catch(function(err) {
         winston.error("Error while deleting the user group, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined user group' });
   }
}

module.exports.checkUniqueNameInTheGroup = function(req, res, next) {
   var groupName = req.params.groupName;
   var parentGroupId = req.params.parentGroupId;
   var nameRegex = new RegExp("^" + groupName + "$", "i");

   if(groupName && parentGroupId && parentGroupId !== 'null') {
      UserGroup.findById(parentGroupId)
               .populate("children")
               .then(function(parentGroup) {
          if (parentGroup.children) {
             var anyMatch = false;
             var i = 0;
             while(!anyMatch && i < parentGroup.children.length) {
                var childGroup = parentGroup.children[i];
                anyMatch = nameRegex.test(childGroup.name);
                i++;
             }
             Utils.sendJSONresponse(res, 200, { 'exists': anyMatch });
          }
      });
   } else if(groupName && parentGroupId && parentGroupId === 'null') {
      UserGroup.count({ 'name': { '$regex' : nameRegex },
                        'isRoot': true
                     }).then(function(result) {
                        Utils.sendJSONresponse(res, 200, { 'exists': result > 0 });
                     });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined group name and parent group id' });
   }
}

module.exports.getUsers = function(req, res, next) {
   var groupId = req.params.groupId;
   if(groupId) {
      var usersCollection = [];

      //add users retrived from the database to the array
      //wich will be returned to the client
      var addUsers = function(usersEntities, usersCollection, groupName, groupType) {
         if(usersEntities) {
            usersEntities.forEach(function(user) {
               usersCollection.push({ 'username' : user.username,
                                      'name' : user.name,
                                      'groupName' : groupName,
                                      'groupType' : groupType
                                    });
            });
         }
      }

      //collect users
      var collectUsers = async function (groupId) {
         try {
            var groupsToBeVisited = [];
            groupsToBeVisited.push({ 'groupId': groupId, 'parentName': '' });
            while(groupsToBeVisited.length > 0) {

               var nodeInfo = groupsToBeVisited.pop();
               var groupId = nodeInfo.groupId;
               var parentName = nodeInfo.parentName;

               var groupEntity = await new Promise(function(resolve, reject) {
                  UserGroup.findById(groupId).then(function(result) {
                     resolve(result);
                  }).catch(function(err){
                     reject(err);
                  });
               });

               if(groupEntity) {
                  var groupCompleteName = ( parentName !== "" ? parentName + " > " : "" ) +  groupEntity.name;
                  //visit
                  //primary group
                  var userFromPrimaryGroup = await new Promise(function(resolve, reject) {
                     User.find({ 'primaryGroup' : groupEntity._id }).then(function(usersEntities) {
                        resolve(usersEntities);
                     }).catch(function(err){
                        reject(err);
                     });
                  });
                  addUsers(userFromPrimaryGroup, usersCollection, groupCompleteName, 'Primário');

                  //secondary group
                  var userFromSecondaryGroups = await new Promise(function(resolve, reject) {
                     User.find({ 'secondaryGroups' : { '$elemMatch' : { '$eq' : groupEntity._id }
                                                                      }
                                                     })
                     .then(function(usersEntities) {
                         resolve(usersEntities);
                     }).catch(function(err){
                         reject(err);
                     });
                  });

                  addUsers(userFromSecondaryGroups, usersCollection, groupCompleteName, 'Secundário');

                  //mark the children to be visited
                  if (groupEntity.children) {
                     groupEntity.children.forEach( function(childGroupId) {
                        groupsToBeVisited.push({ 'groupId': childGroupId, 'parentName': groupCompleteName });
                     });
                  }
               }
            }

            Utils.sendJSONresponse(res, 200, {
                "users" : usersCollection
            });

         } catch(err) {
            Utils.next(400, err, next);
         }
      }

      collectUsers(groupId);
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined group id' });
   }
}
