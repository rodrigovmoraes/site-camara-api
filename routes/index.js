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
var eventsCalendarControllers = require('../controllers/eventsCalendar.js');
var licitacoesControllers = require('../controllers/licitacoes.js');
var licitacoesCategoriesControllers = require('../controllers/licitacoesCategories.js');
var legislativePropositionsControllers = require('../controllers/legislativePropositions.js');
var legislativePropositionTypesControllers = require('../controllers/legislativePropositionTypes.js');
var legislativePropositionTagsControllers = require('../controllers/legislativePropositionTags.js');
var legislativePropositionRelationshipTypesControllers = require('../controllers/legislativePropositionRelationshipTypes.js');
var publicFinancesControllers = require('../controllers/publicFinances.js');

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
router.put('/newsItem/wysiwyg/fileAttachment', newsControllers.uploadWysiwygFileAttachment);
router.put('/newsItem/wysiwyg/fileImageAttachment', newsControllers.uploadWysiwygFileImageAttachment);
router.put('/newsItem/wysiwyg/fileVideoAttachment', newsControllers.uploadWysiwygFileVideoAttachment);
router.put('/newsItem/thumbnail/:uuid', newsControllers.uploadThumbnail);
router.delete('/newsItem/thumbnail/:fileName', newsControllers.deleteThumbnail);
router.delete('/newsItem/:newsItemId', newsControllers.removeNewsItem);

//pages
router.get('/pages', pagesControllers.getPages);
router.get('/page/:pageId', pagesControllers.getPage);
router.get('/incrementPageViews/:pageId', pagesControllers.getIncrementPageViews);
router.post('/page', pagesControllers.editPage);
router.put('/page', pagesControllers.newPage);
router.put('/page/wysiwyg/fileAttachment', pagesControllers.uploadWysiwygFileAttachment);
router.put('/page/wysiwyg/fileImageAttachment', pagesControllers.uploadWysiwygFileImageAttachment);
router.put('/page/wysiwyg/fileVideoAttachment', pagesControllers.uploadWysiwygFileVideoAttachment);
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

//licitacoes
router.get('/licitacoes', licitacoesControllers.getLicitacoes);
router.post('/licitacao', licitacoesControllers.editLicitacao);
router.put('/licitacao', licitacoesControllers.newLicitacao);
router.delete('/licitacao/event/file/:fileName', licitacoesControllers.deleteEventFile);
router.delete('/licitacao/event/:licitacaoId/:eventId', licitacoesControllers.removeLicitacaoEvent);
router.delete('/licitacao/:licitacaoId', licitacoesControllers.removeLicitacao);
router.get('/licitacao/publish/:licitacaoId', licitacoesControllers.publishLicitacao);
router.get('/licitacao/unpublish/:licitacaoId', licitacoesControllers.unpublishLicitacao);
router.get('/licitacao/checkUniqueNumber/:year/:number', licitacoesControllers.checkUniqueNumber);
router.get('/licitacao/nextNumber/:year', licitacoesControllers.getNextNumberOfTheYear);
router.get('/licitacao/event/download/:eventId', licitacoesControllers.downloadEventFile);
router.get('/licitacao/event/raw/download/:fileName', licitacoesControllers.rawDownloadEventFile);
router.get('/licitacao/events/last', licitacoesControllers.getLastLicitacoesEvents);
router.get('/licitacao/event/:eventId', licitacoesControllers.getLicitacaoEvent);
router.get('/licitacao/:licitacaoId', licitacoesControllers.getLicitacao);
router.put('/licitacao/event/file/:uuid', licitacoesControllers.uploadEventFile);
router.put('/licitacao/event/:licitacaoId', licitacoesControllers.newLicitacaoEvent);
router.post('/licitacao/event', licitacoesControllers.editLicitacaoEvent);
//licitacoes categories
router.get('/licitacoesCategories', licitacoesCategoriesControllers.getLicitacoesCategories);

//legislative propositions
router.get('/legislativePropositions', legislativePropositionsControllers.getLegislativePropositions);
router.post('/legislativeProposition', isLogged(), legislativePropositionsControllers.editLegislativeProposition);

router.put('/legislativeProposition/wysiwyg/textFileAttachment', legislativePropositionsControllers.uploadWysiwygTextFileAttachment);
router.put('/legislativeProposition/wysiwyg/textFileImageAttachment', legislativePropositionsControllers.uploadWysiwygTextFileImageAttachment);
router.put('/legislativeProposition/wysiwyg/textAttachmentFileAttachment', legislativePropositionsControllers.uploadWysiwygTextAttachmentFileAttachment);
router.put('/legislativeProposition/wysiwyg/textAttachmentFileImageAttachment', legislativePropositionsControllers.uploadWysiwygTextAttachmentFileImageAttachment);
router.put('/legislativeProposition/wysiwyg/consolidatedTextFileAttachment', legislativePropositionsControllers.uploadWysiwygConsolidatedTextFileAttachment);
router.put('/legislativeProposition/wysiwyg/consolidatedTextFileImageAttachment', legislativePropositionsControllers.uploadWysiwygConsolidatedTextFileImageAttachment);
router.put('/legislativeProposition/wysiwyg/consolidatedTextAttachmentFileAttachment', legislativePropositionsControllers.uploadWysiwygConsolidatedTextAttachmentFileAttachment);
router.put('/legislativeProposition/wysiwyg/consolidatedTextAttachmentFileImageAttachment', legislativePropositionsControllers.uploadWysiwygConsolidatedTextAttachmentFileImageAttachment);

router.put('/legislativeProposition/attachment/file/:uuid', legislativePropositionsControllers.uploadAttachmentFile);
router.put('/legislativeProposition/consolidatedAttachment/file/:uuid', legislativePropositionsControllers.uploadConsolidatedAttachmentFile);
router.put('/legislativeProposition/attachment', legislativePropositionsControllers.newAttachmentFile);
router.put('/legislativeProposition', isLogged(), legislativePropositionsControllers.newLegislativeProposition);
router.delete('/legislativeProposition/attachment/:legislativePropositionFileAttachmentId', legislativePropositionsControllers.deleteFileAttachment);
router.delete('/legislativeProposition/:legislativePropositionId', isLogged(), legislativePropositionsControllers.removeLegislativeProposition);
router.get('/legislativeProposition/byNumber/:legislativePropositionTypeId/:number', legislativePropositionsControllers.getLegislativePropositionByNumber);
router.get('/legislativeProposition/checkUniqueNumber/:legislativePropositionTypeId/:number', legislativePropositionsControllers.checkUniqueNumber);
router.get('/legislativeProposition/nextNumber/:legislativePropositionTypeId', legislativePropositionsControllers.getNextNumberOfTheType);
router.get('/legislativeProposition/attachment/download/:legislativePropositionFileAttachmentId', legislativePropositionsControllers.downloadLegislativePropositionFileAttachment);
router.get('/legislativeProposition/:legislativePropositionId', legislativePropositionsControllers.getLegislativeProposition);
//legislative proposition types
router.get('/legislativePropositionTypes', legislativePropositionTypesControllers.getLegislativePropositionTypes);
//legislative proposition tags
router.get('/legislativePropositionTag/:legislativePropositionTagId', legislativePropositionTagsControllers.getLegislativePropositionTag);
router.put('/legislativePropositionTag', legislativePropositionTagsControllers.newLegislativePropositionTag);
router.post('/legislativePropositionTag', legislativePropositionTagsControllers.editLegislativePropositionTag);
router.get('/legislativePropositionTags/:legislativePropositionTypeId', legislativePropositionTagsControllers.getLegislativePropositionTags);
router.get('/legislativePropositionTags', legislativePropositionTagsControllers.getAllLegislativePropositionTags);
router.get('/checkUniquelegislativePropositionTagDescription/:legislativePropositionTypeId', legislativePropositionTagsControllers.checkUniqueDescription);
router.delete('/legislativePropositionTag/:legislativePropositionTagId', legislativePropositionTagsControllers.removeLegislativePropositionTag);

//legislative proposition relationship types
router.get('/legislativePropositionRelationshipTypes', legislativePropositionRelationshipTypesControllers.getLegislativePropositionRelationshipTypes);

//public Finances
router.get('/publicFinances/folder/amountOfElements/:folderId', publicFinancesControllers.getAmountOfElements);
router.get('/publicFinances/folder/amountOfElements', publicFinancesControllers.getAmountOfElements);
router.get('/publicFinances/folder/:folderId', publicFinancesControllers.listFolderContents);
router.get('/publicFinances/folder', publicFinancesControllers.listFolderContents);
router.get('/publicFinances/folderPath/:folderId', publicFinancesControllers.getFolderPath);
router.get('/publicFinances/file/:fileId', publicFinancesControllers.downloadPublicFinancesFile);
router.put('/publicFinances/file/upload/:folderId/:fileName', publicFinancesControllers.uploadPublicFinancesFile);
router.put('/publicFinances/file', isLogged(), publicFinancesControllers.newFile);
router.put('/publicFinances/folder', isLogged(), publicFinancesControllers.newFolder);
router.get('/publicFinances/moveFolder/up/:folderId', publicFinancesControllers.moveFolderUp);
router.get('/publicFinances/moveFolder/down/:folderId', publicFinancesControllers.moveFolderDown);
router.get('/publicFinances/moveFile/up/:fileId', publicFinancesControllers.moveFileUp);
router.get('/publicFinances/moveFile/down/:fileId', publicFinancesControllers.moveFileDown);
router.get('/publicFinances/checkUniqueDescription/:folderId', publicFinancesControllers.checkUniqueDescription);
router.delete('/publicFinances/file/raw', publicFinancesControllers.deleteRawFile);
router.delete('/publicFinances/file/:fileId', publicFinancesControllers.removePublicFinancesFile);
router.delete('/publicFinances/folder/:folderId', publicFinancesControllers.removePublicFinancesFolder);
router.post('/publicFinances/folder', isLogged(), publicFinancesControllers.editFolder);

//events from Google Calendar API Service
router.get('/eventsCalendar', eventsCalendarControllers.getEvents);
router.get('/eventCalendar', eventsCalendarControllers.getEvent);

//security roles
router.get('/securityRoles', securityRoleControllers.getSecurityRoles);

//tests
router.get('/test', hasRole('role2'), testController);
router.get('/test2', hasRole('rolex'), testController);

module.exports = router;
