/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var express = require('express');
var router = express.Router();

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APP MODULES) ********************************
/*****************************************************************************/
var securityMiddlewares = require('../middlewares/security.js');
var hasRole = securityMiddlewares.hasRole;

/*****************************************************************************
********************* REQUIRE CONTROLLERS MODULES ****************************
/*****************************************************************************/
var authenticationControllers = require('../controllers/authentication.js');
var userControllers = require('../controllers/user.js');
var userGroupControllers = require('../controllers/userGroup.js');
var securityRoleControllers = require('../controllers/securityRole.js');

var testController = require('../controllers/test.js');

/*****************************************************************************
***************************** CONTROLLERS CONFIG *****************************
/*****************************************************************************/
//section reserved for controllers configuration, some controllers
//require special configuration which are executed here
authenticationControllers.config();

/*****************************************************************************
***************************** ROUTER DEFINITIONS *****************************
/*****************************************************************************/
//authentication
router.post('/login', authenticationControllers.loginController);

//users
router.get('/user/:id', userControllers.getUser);
router.post('/user', userControllers.saveUser);
router.put('/user', userControllers.newUser);
router.post('/users', userControllers.getUsers);
router.get('/checkUniqueUsername/:username', userControllers.checkUniqueUsername);
router.get('/checkUniqueEmail/:email', userControllers.checkUniqueEmail);

//groups
router.get('/userGroups', userGroupControllers.getUserGroups);
router.get('/userGroupsTree', userGroupControllers.getUserGroupsTree);
router.get('/checkUniqueNameInTheGroup/:parentGroupId/:groupName', userGroupControllers.checkUniqueNameInTheGroup);
router.get('/usersFromGroup/:groupId', userGroupControllers.getUsers);
router.post('/userGroup', userGroupControllers.saveUserGroup);
router.put('/userGroup', userGroupControllers.newUserGroup);
router.delete('/userGroup/deep/:id', userGroupControllers.deepDeleteUserGroup);

//security roles
router.get('/securityRoles', securityRoleControllers.getSecurityRoles);

//tests
router.get('/test', hasRole('role2'), testController);
router.get('/test2', hasRole('rolex'), testController);

module.exports = router;
