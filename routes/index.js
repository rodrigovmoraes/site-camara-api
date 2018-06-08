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
var isLogged = securityMiddlewares.isLogged;

/*****************************************************************************
********************* REQUIRE CONTROLLERS MODULES ****************************
/*****************************************************************************/
var authenticationControllers = require('../controllers/authentication.js');
var userControllers = require('../controllers/user.js');
var userGroupControllers = require('../controllers/userGroup.js');
var securityRoleControllers = require('../controllers/securityRole.js');
var menuAdminControllers = require('../controllers/menuAdmin.js');
var menuPortalControllers = require('../controllers/menuPortal.js');
var newsControllers = require('../controllers/news.js');
var pagesControllers = require('../controllers/pages.js');
var bannersControllers = require('../controllers/banners.js');
var hotNewsControllers = require('../controllers/hotNews.js');
var breakingNewsControllers = require('../controllers/breakingNews.js');
var fbreakingNewsControllers = require('../controllers/fbreakingNews.js');

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
router.get('/rolesFromUser/:userId', userControllers.getRolesFromUser);
router.get('/checkAccess/:roleName', isLogged(), userControllers.checkAccess);

//groups
router.get('/userGroups', userGroupControllers.getUserGroups);
router.get('/userGroupsTree', userGroupControllers.getUserGroupsTree);
router.get('/checkUniqueNameInTheGroup/:parentGroupId/:groupName', userGroupControllers.checkUniqueNameInTheGroup);
router.get('/usersFromGroup/:groupId', userGroupControllers.getUsers);
router.post('/userGroup', userGroupControllers.saveUserGroup);
router.put('/userGroup', userGroupControllers.newUserGroup);
router.delete('/userGroup/deeply/:id', userGroupControllers.deleteDeeplyUserGroup);

//menu admin
router.get('/menuAdminTree', menuAdminControllers.getMenuAdminTree);
router.get('/userMenuAdminTree', isLogged(), menuAdminControllers.getMenuAdminTreeForLoggedUser);
router.post('/menuItemAdmin', menuAdminControllers.saveMenuItem);
router.put('/menuItemAdmin', menuAdminControllers.newMenuItem);
router.delete('/menuItemAdmin/deeply/:id', menuAdminControllers.deleteDeeplyMenuItem);
router.post('/menuItemAdmin/updateOrders', menuAdminControllers.updateMenuItemsOrders);

//menu portal
router.get('/menuPortalTree', menuPortalControllers.getMenuPortalTree);
router.post('/menuItemPortal', menuPortalControllers.saveMenuItem);
router.put('/menuItemPortal', menuPortalControllers.newMenuItem);
router.delete('/menuItemPortal/deeply/:id', menuPortalControllers.deleteDeeplyMenuItem);
router.post('/menuItemPortal/updateOrders', menuPortalControllers.updateMenuItemsOrders);

//news
router.get('/newsItems', newsControllers.getNews);
router.get('/newsItem/:newsItemId', newsControllers.getNewsItem);
router.get('/incrementNewsViews/:newsItemId', newsControllers.getIncrementNewsViews);
router.post('/newsItem', newsControllers.editNewsItem);
router.put('/newsItem', newsControllers.newNewsItem);
router.put('/newsItem/thumbnail/:uuid', newsControllers.uploadThumbnail);
router.delete('/newsItem/thumbnail/:fileName', newsControllers.deleteThumbnail);
router.delete('/newsItem/:newsItemId', newsControllers.removeNewsItem);

//pages
router.get('/pages', pagesControllers.getPages);
router.get('/page/:pageId', pagesControllers.getPage);
router.get('/incrementPageViews/:pageId', pagesControllers.getIncrementPageViews);
router.post('/page', pagesControllers.editPage);
router.put('/page', pagesControllers.newPage);
router.delete('/page/:pageId', pagesControllers.removePage);

//banners
router.put('/banner/image/:uuid', bannersControllers.uploadBannerImage);
router.put('/banner', bannersControllers.newBanner);
router.post('/banner', bannersControllers.editBanner);
router.delete('/banner/image/:fileName', bannersControllers.deleteBannerImage);
router.get('/banners', bannersControllers.getBanners);
router.get('/banner/:bannerId/moveUp', bannersControllers.moveBannerUp);
router.get('/banner/:bannerId/moveDown', bannersControllers.moveBannerDown);
router.get('/banner/:bannerId', bannersControllers.getBanner);
router.delete('/banner/:bannerId', bannersControllers.removeBanner);

//hot news
router.put('/hotnews', hotNewsControllers.newHotNewsItem);
router.post('/hotnews', hotNewsControllers.editHotNewsItem);
router.get('/hotnews/:hotNewsItemId', hotNewsControllers.getHotNewsItem);
router.get('/hotnews', hotNewsControllers.getHotNewsItems);
router.get('/hotnews/:hotNewsItemId/moveUp', hotNewsControllers.moveHotNewsItemUp);
router.get('/hotnews/:hotNewsItemId/moveDown', hotNewsControllers.moveHotNewsItemDown);
router.delete('/hotnews/:hotNewsItemId', hotNewsControllers.removeHotNewsItem);

//breaking news
router.put('/breakingNews/image/:uuid', breakingNewsControllers.uploadBreakingNewsItemImage);
router.put('/breakingNews', breakingNewsControllers.newBreakingNewsItem);
router.post('/breakingNews', breakingNewsControllers.editBreakingNewsItem);
router.delete('/breakingNews/image/:fileName', breakingNewsControllers.deleteBreakingNewsItemImage);
router.get('/breakingNews/:breakingNewsItemId', breakingNewsControllers.getBreakingNewsItem);
router.get('/breakingNews', breakingNewsControllers.getBreakingNewsItems);
router.get('/breakingNews/:breakingNewsItemId/moveUp', breakingNewsControllers.moveBreakingNewsItemUp);
router.get('/breakingNews/:breakingNewsItemId/moveDown', breakingNewsControllers.moveBreakingNewsItemDown);
router.delete('/breakingNews/:breakingNewsItemId', breakingNewsControllers.removeBreakingNewsItem);

//fixed breaking news
router.put('/fbreakingNews/image/:uuid', fbreakingNewsControllers.uploadFBreakingNewsItemImage);
router.post('/fbreakingNews', fbreakingNewsControllers.editFBreakingNewsItem);
router.delete('/fbreakingNews/image/:fileName', fbreakingNewsControllers.deleteFBreakingNewsItemImage);
router.get('/fbreakingNews/:fbreakingNewsItemId', fbreakingNewsControllers.getFBreakingNewsItem);
router.get('/fbreakingNews', fbreakingNewsControllers.getFBreakingNewsItems);
router.delete('/fbreakingNews/:fbreakingNewsItemId', fbreakingNewsControllers.removeFBreakingNewsItem);

//security roles
router.get('/securityRoles', securityRoleControllers.getSecurityRoles);

//tests
router.get('/test', hasRole('role2'), testController);
router.get('/test2', hasRole('rolex'), testController);

module.exports = router;
