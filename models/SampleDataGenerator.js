/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var User = require('../models/User.js').getModel();
var UserGroup = require('../models/UserGroup.js').getModel();
var SecurityRole = require('../models/SecurityRole.js').getModel();
var async = require("async");
var Util = require("../util/Utils.js");
var _ = require('lodash');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _sampleDataGenerationActivated = false;
var _sampleDataCleaningActivated = false;

var _loadUserGroups = function(done) {
      var amount = 100;
      winston.verbose("Creating user groups ...");
      var userGroups = [];
      var i;

      for(i = 0; i < amount; i++) {
         userGroups.push({ name: "Group" + i,
                           completeName: "Group" + i,
                           parent: null
                        });
      }
      var roles = [];

      SecurityRole.find({}).then(function(_roles) {

         roles = _roles;
         return UserGroup.insertMany(userGroups);

      }).then(function(insertedUserGroups) {

         winston.verbose("User groups created.");
         //create random user groups trees
         var i; var bunchSize = 15; var commands = [];
         //process bunches of nodes, one bunch for each step
         for(i = 0; i < insertedUserGroups.length; i = i + bunchSize) {
            //create random user groups tree
            var availableNodes = [];
             //avaliable nodes for this step (the bunch of nodes)
            var j;
            for(j = i; j < insertedUserGroups.length && j < i + bunchSize; j++) {
               availableNodes.push(insertedUserGroups[j]);
            }

            var roots = [];
            var root;

            if(availableNodes.length > 0) {
               root = Util.pushRandom(availableNodes);
               roots.push({ 'root' : root, 'parentCompleteName': '' });
               commands.push({
                   updateOne: {
                        filter: { '_id':  root._id },
                        update: { 'isRoot':  true }
                   }
               });
            }

            while(roots.length > 0) {
               var node = roots.shift();
               var root = node.root;
               //update complete name
               if(node.parentCompleteName !== '') {
                  root.completeName = node.parentCompleteName + " > " + root.name;
               } else {
                  root.completeName = root.name;
               }

               if(availableNodes.length > 0) {
                  var child1 = Util.pushRandom(availableNodes);
                  roots.push({ 'root': child1,
                               'parentCompleteName': root.completeName
                            });
                  root.children.push(child1);
                  if(availableNodes.length > 0) {
                     var child2 = Util.pushRandom(availableNodes);
                     roots.push({ 'root': child2,
                                  'parentCompleteName': root.completeName
                               });
                     root.children.push(child2);
                  }
               }
            }

            insertedUserGroups.forEach(function(node) {
               //set a random set of roles for the user group
               node.roles = Util.randomSubArrayFrom(roles);
               commands.push({
                  updateOne: {
                    filter: { '_id':  node._id },
                    update: { 'children':  node.children,
                              'roles': node.roles,
                              'completeName': node.completeName
                            },
                  }
               });
            });
         }


         UserGroup.bulkWrite(commands, function(err, result){
            if(!err) {
               done(null, true);
            } else {
               done(err, false);
            }
         });
         //END - create random user groups tree

      }).catch(function(err){
         winston.error("Error while saving the user groups for testing in SampleDataLoader, err = [%s]", err);
         done(err, false);
      });
}

var _loadSecurityRoles = function(done){
      winston.verbose("Creating security roles ...");
      var securityRoles = [];
      var i;
      for(i = 0; i < 100; i++) {
         securityRoles.push({ name: "role" + i });
      }
      SecurityRole.insertMany(securityRoles, function(err){
         if(err) {
            winston.error("Error while saving security roles for testing in SampleDataLoader, err = [%s]", err);
            done(err, false);
         } else {
            winston.verbose("Security roles created.");
            done(null, true);
         }
      });
}

//Load an user for testing purposes
var _loadUserTest = function(done) {
   UserGroup.find({}).exec().then(function(groups){
      var userTest = new User();
      userTest.username = "test";
      userTest.name = "Test";
      userTest.email = "test@serv.com";
      userTest.setPassword('testpassword');
      userTest.primaryGroup = groups[0];
      userTest.creationDate = new Date();
      userTest.status = true;

      winston.verbose("Creating user test ...");

      userTest.save(function(err){
         if(err) {
            winston.error("Error while saving the user test in SampleDataLoader, err = [%s]", err);
            done(err, false);
         } else {
            winston.verbose("User test created.");
            done(null, true);
         }
      });
   }).catch(function(err){
      winston.error("Error while getting user groups to create the user test in SampleDataLoader, err = [%s]", err);
      done(err, false);
   });
}

//Load ramdom users for testing purposes
var _loadRandomUsersTest = function(done) {
   var groups = [];
   var roles = [];

   UserGroup.find({}).exec().then( function(_groups) {
      groups = _groups;

      return SecurityRole.find({}).exec();
   }).then(function(_roles) {
      roles = _roles;

      winston.verbose("Creating random users ...");

      var _createRandomUser = function(count) {
         if(count < 1000) {
            var randomUser = new User();
            randomUser.username = 'user' + count;
            randomUser.name = 'User' + count;
            randomUser.email = 'user' + count + "@serv.com";
            randomUser.setPassword('user' + count + 'password');
            randomUser.roles = Util.randomSubArrayFrom(roles);
            randomUser.primaryGroup = Util.randomFrom(groups);
            randomUser.secondaryGroups = Util.randomSubArrayFrom(groups);
            randomUser.creationDate = Util.randomDate(2000,11,1, 2017,0,10);
            randomUser.status = Util.random(0, 1) ? true : false;
            randomUser.save().then(function(newUser){
               _createRandomUser(count + 1);
            }).catch(function(err){
               winston.error("Error while saving the random user test in SampleDataLoader, err = [%s]", err);
               done(err, false);
            });
         } else {
            winston.verbose("Random users created.");
            done(null, true);
         }
      }
       _createRandomUser(0);
   }).catch(function(err) {
      winston.error("Error while getting creating random users in SampleDataLoader, err = [%s]", err);
      done(err, false);
   });
}

//remove the user that was created for testing purposes
var _removeUserTest = function(done) {
   var userTest = User.remove({ email: 'test@serv.com' }, function(err) {
      if(err) {
         winston.error("Error while removing the user test in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("User test removed");
         done(null, true);
      }
   });
}

//remove the users that were created for testing purposes
var _removeRandomUsersTest = function(done) {
   User.remove({ username: /^user/ }, function(err) {
      if(err) {
         winston.error("Error while removing random users in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Random users removed");
         done(null, true);
      }
   });
}

//remove the user groups that were created for testing purposes
var _removeUserGroups = function(done) {
   UserGroup.remove({ name: /^Group/ }, function(err) {
      if(err) {
         winston.error("Error while removing random user groups in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Random user groups removed");
         done(null, true);
      }
   });
}

//remove the user groups that were created for testing purposes
var _removeSecurityRoles = function(done) {
   SecurityRole.remove({ name: /^role/ }, function(err) {
      if (err) {
         winston.error("Error while removing security roles in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Security roles removed");
         done(null, true);
      }
   });
}

//put the desired sample data routines here, they will be executed in the
//order by this sample data generator
var _loadRoutines = [
   _loadSecurityRoles,
   _loadUserGroups,
   _loadUserTest,
   _loadRandomUsersTest
];

//put the desired sample data clear routines here, they will be executed in the
//order by this sample data generator to clear data generated before
var _clearRoutines = [
   _removeUserTest,
   _removeRandomUsersTest,
   _removeUserGroups,
   _removeSecurityRoles
];

//execute the cleaning routines to remove a previous sample data
var _clear = function(done) {
   if(_sampleDataCleaningActivated) {
      winston.verbose("========== Cleaning sample data ...");

      //execute the cleaning routines in serie, each one running once
      //the previous function has completed
      var clearRoutinesWithErrorHandling = _.map(_clearRoutines, Util.handleErrorForAsync);
                                          //Each routine should be
                                          //surronded by an error handler in order to
                                          //improve error reporting
      async.series(clearRoutinesWithErrorHandling, function(errSeries, results) {
         if(errSeries) {
            winston.error("Error while cleaning sample data, err = [%s]", errSeries);
         }
         winston.verbose("========== Cleaning process ended");
         done();
      });
   } else {
      done();
   };
}

/*****************************************************************************
******************************* PUBLIC ***************************************
/*****************************************************************************/
//module properties, set and gets
module.exports.setSampleDataGenerationActivated = function(sampleDataGenerationActivated) {
   _sampleDataGenerationActivated = sampleDataGenerationActivated;
}

module.exports.setSampleDataCleaningActivated = function(sampleDataCleaningActivated) {
   _sampleDataCleaningActivated = sampleDataCleaningActivated;
}

//module methods

//execute the sample data routines in order to build a data sample
//for testing purposes
module.exports.load = function() {
   _clear(function(){
      if(_sampleDataGenerationActivated) {
         winston.verbose("========== Generating sample data ...");

         //execute the sample data routines in serie, each one running once
         //the previous function has completed
         var loadRoutinesWithErrorHandling = _.map(_loadRoutines, Util.handleErrorForAsync);
                                             //Each routine should be
                                             //surronded by an error handler in order to
                                             //improve error reporting
         async.series(loadRoutinesWithErrorHandling, function(errSeries, results) {
            if(errSeries) {
               winston.error("Error while generating sample data. err = [%s]", errSeries);
            }
            winston.verbose("========== Sample data generation ended");
         });
      }
   });

}
