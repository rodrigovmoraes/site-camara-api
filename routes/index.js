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
var publicFilesControllers = require('../controllers/publicFiles.js');

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
router.get('/user/:id', hasRole('READ_USER'), userControllers.getUser);
router.post('/user', hasRole('WRITE_USER'), userControllers.saveUser);
router.put('/user', hasRole('WRITE_USER'), userControllers.newUser);
router.post('/users', hasRole('READ_USER'), userControllers.getUsers);
router.get('/checkUniqueUsername/:username', hasRole('READ_USER'), userControllers.checkUniqueUsername);
router.get('/checkUniqueEmail/:email', hasRole('READ_USER'), userControllers.checkUniqueEmail);
router.get('/rolesFromUser/:userId', hasRole('READ_USER'), userControllers.getRolesFromUser);
router.get('/checkAccess/:roleName', isLogged(), userControllers.checkAccess);
router.post('/changePassword', isLogged(), userControllers.changePasswordController);

//groups
router.get('/userGroups', hasRole('READ_USER_GROUP'), userGroupControllers.getUserGroups);
router.get('/userGroupsTree', hasRole('READ_USER_GROUP'), userGroupControllers.getUserGroupsTree);
router.get('/checkUniqueNameInTheGroup/:parentGroupId/:groupName', hasRole('READ_USER_GROUP'), userGroupControllers.checkUniqueNameInTheGroup);
router.get('/usersFromGroup/:groupId', hasRole('READ_USER_GROUP'), userGroupControllers.getUsers);
router.post('/userGroup', hasRole('WRITE_USER_GROUP'), userGroupControllers.saveUserGroup);
router.put('/userGroup', hasRole('WRITE_USER_GROUP'), userGroupControllers.newUserGroup);
router.delete('/userGroup/deeply/:id', hasRole('DELETE_USER_GROUP'), userGroupControllers.deleteDeeplyUserGroup);

//menu admin
router.get('/menuAdminTree', hasRole('READ_MENU_ADMIN'), menuAdminControllers.getMenuAdminTree);
router.get('/userMenuAdminTree', isLogged(), menuAdminControllers.getMenuAdminTreeForLoggedUser);
router.post('/menuItemAdmin', hasRole('WRITE_MENU_ADMIN'), menuAdminControllers.saveMenuItem);
router.put('/menuItemAdmin', hasRole('WRITE_MENU_ADMIN'), menuAdminControllers.newMenuItem);
router.delete('/menuItemAdmin/deeply/:id', hasRole('DELETE_MENU_ADMIN'), menuAdminControllers.deleteDeeplyMenuItem);
router.post('/menuItemAdmin/updateOrders', hasRole('WRITE_MENU_ADMIN'), menuAdminControllers.updateMenuItemsOrders);

//menu portal
router.get('/menuPortalTree', menuPortalControllers.getMenuPortalTree);
router.post('/menuItemPortal', hasRole('WRITE_MENU_PORTAL'), menuPortalControllers.saveMenuItem);
router.put('/menuItemPortal', hasRole('WRITE_MENU_PORTAL'), menuPortalControllers.newMenuItem);
router.delete('/menuItemPortal/deeply/:id', hasRole('DELETE_MENU_PORTAL'), menuPortalControllers.deleteDeeplyMenuItem);
router.post('/menuItemPortal/updateOrders', hasRole('WRITE_MENU_PORTAL'), menuPortalControllers.updateMenuItemsOrders);

//news
router.get('/newsItems', newsControllers.getNews);
router.get('/newsItem/:newsItemId', newsControllers.getNewsItem);
router.get('/incrementNewsViews/:newsItemId', newsControllers.getIncrementNewsViews);
router.post('/newsItem', hasRole('WRITE_NEWS'), newsControllers.editNewsItem);
router.put('/newsItem', hasRole('WRITE_NEWS'), newsControllers.newNewsItem);
router.put('/newsItem/wysiwyg/fileAttachment', hasRole('WRITE_NEWS'), newsControllers.uploadWysiwygFileAttachment);
router.put('/newsItem/wysiwyg/fileImageAttachment', hasRole('WRITE_NEWS'), newsControllers.uploadWysiwygFileImageAttachment);
router.put('/newsItem/wysiwyg/fileVideoAttachment', hasRole('WRITE_NEWS'), newsControllers.uploadWysiwygFileVideoAttachment);
router.put('/newsItem/thumbnail/:uuid', hasRole('WRITE_NEWS'), newsControllers.uploadThumbnail);
router.delete('/newsItem/thumbnail/:fileName', hasRole('WRITE_NEWS'), newsControllers.deleteThumbnail);
router.delete('/newsItem/:newsItemId', hasRole('DELETE_NEWS'), newsControllers.removeNewsItem);

//pages
router.get('/pages', pagesControllers.getPages);
router.get('/page/checkUnique/:tag', hasRole('READ_PAGE'), pagesControllers.checkUniqueTag);
router.get('/page/tag/:tag', pagesControllers.getPageByTag);
router.get('/page/:pageId', pagesControllers.getPage);
router.get('/incrementPageViews/:pageId', pagesControllers.getIncrementPageViews);
router.post('/page', hasRole('WRITE_PAGE'), pagesControllers.editPage);
router.put('/page', hasRole('WRITE_PAGE'), pagesControllers.newPage);
router.put('/page/wysiwyg/fileAttachment', hasRole('WRITE_PAGE'), pagesControllers.uploadWysiwygFileAttachment);
router.put('/page/wysiwyg/fileImageAttachment', hasRole('WRITE_PAGE'), pagesControllers.uploadWysiwygFileImageAttachment);
router.put('/page/wysiwyg/fileVideoAttachment', hasRole('WRITE_PAGE'), pagesControllers.uploadWysiwygFileVideoAttachment);
router.delete('/page/:pageId', hasRole('DELETE_PAGE'), pagesControllers.removePage);

//banners
router.put('/banner/image/:uuid', hasRole('WRITE_BANNER'), bannersControllers.uploadBannerImage);
router.put('/banner', hasRole('WRITE_BANNER'), bannersControllers.newBanner);
router.post('/banner', hasRole('WRITE_BANNER'), bannersControllers.editBanner);
router.delete('/banner/image/:fileName', hasRole('WRITE_BANNER'), bannersControllers.deleteBannerImage);
router.get('/banners', bannersControllers.getBanners);
router.get('/banner/:bannerId/moveUp', hasRole('WRITE_BANNER'), bannersControllers.moveBannerUp);
router.get('/banner/:bannerId/moveDown', hasRole('WRITE_BANNER'), bannersControllers.moveBannerDown);
router.get('/banner/:bannerId', hasRole('READ_BANNER'), bannersControllers.getBanner);
router.delete('/banner/:bannerId', hasRole('DELETE_BANNER'), bannersControllers.removeBanner);

//hot news
router.put('/hotnews', hasRole('WRITE_HOTNEWS'), hotNewsControllers.newHotNewsItem);
router.post('/hotnews', hasRole('WRITE_HOTNEWS'), hotNewsControllers.editHotNewsItem);
router.get('/hotnews/:hotNewsItemId', hasRole('READ_HOTNEWS'), hotNewsControllers.getHotNewsItem);
router.get('/hotnews', hotNewsControllers.getHotNewsItems);
router.get('/hotnews/:hotNewsItemId/moveUp', hasRole('WRITE_HOTNEWS'), hotNewsControllers.moveHotNewsItemUp);
router.get('/hotnews/:hotNewsItemId/moveDown', hasRole('WRITE_HOTNEWS'), hotNewsControllers.moveHotNewsItemDown);
router.delete('/hotnews/:hotNewsItemId', hasRole('DELETE_HOTNEWS'), hotNewsControllers.removeHotNewsItem);

//breaking news
router.put('/breakingNews/image/:uuid', hasRole('WRITE_BREAKINGNEWS'), breakingNewsControllers.uploadBreakingNewsItemImage);
router.put('/breakingNews', hasRole('WRITE_BREAKINGNEWS'), breakingNewsControllers.newBreakingNewsItem);
router.post('/breakingNews', hasRole('WRITE_BREAKINGNEWS'), breakingNewsControllers.editBreakingNewsItem);
router.delete('/breakingNews/image/:fileName', hasRole('WRITE_BREAKINGNEWS'), breakingNewsControllers.deleteBreakingNewsItemImage);
router.get('/breakingNews/:breakingNewsItemId', hasRole('READ_BREAKINGNEWS'), breakingNewsControllers.getBreakingNewsItem);
router.get('/breakingNews', breakingNewsControllers.getBreakingNewsItems);
router.get('/breakingNews/:breakingNewsItemId/moveUp', hasRole('WRITE_BREAKINGNEWS'), breakingNewsControllers.moveBreakingNewsItemUp);
router.get('/breakingNews/:breakingNewsItemId/moveDown', hasRole('WRITE_BREAKINGNEWS'), breakingNewsControllers.moveBreakingNewsItemDown);
router.delete('/breakingNews/:breakingNewsItemId', hasRole('DELETE_BREAKINGNEWS'), breakingNewsControllers.removeBreakingNewsItem);

//fixed breaking news
router.put('/fbreakingNews/image/:uuid', hasRole('WRITE_FIXED_BREAKINGNEWS'), fbreakingNewsControllers.uploadFBreakingNewsItemImage);
router.post('/fbreakingNews', hasRole('WRITE_FIXED_BREAKINGNEWS'), fbreakingNewsControllers.editFBreakingNewsItem);
router.delete('/fbreakingNews/image/:fileName', hasRole('WRITE_FIXED_BREAKINGNEWS'), fbreakingNewsControllers.deleteFBreakingNewsItemImage);
router.get('/fbreakingNews/:fbreakingNewsItemId', hasRole('READ_FIXED_BREAKINGNEWS'), fbreakingNewsControllers.getFBreakingNewsItem);
router.get('/fbreakingNews', fbreakingNewsControllers.getFBreakingNewsItems);
router.delete('/fbreakingNews/:fbreakingNewsItemId', hasRole('DELETE_FIXED_BREAKINGNEWS'), fbreakingNewsControllers.removeFBreakingNewsItem);

//licitacoes
router.get('/licitacoes', licitacoesControllers.getLicitacoes);
router.post('/licitacao', hasRole('WRITE_LICITACAO'), licitacoesControllers.editLicitacao);
router.put('/licitacao', hasRole('WRITE_LICITACAO'), licitacoesControllers.newLicitacao);
router.delete('/licitacao/event/file/:fileName', hasRole('WRITE_LICITACAO'), licitacoesControllers.deleteEventFile);
router.delete('/licitacao/event/:licitacaoId/:eventId', hasRole('DELETE_LICITACAO'), licitacoesControllers.removeLicitacaoEvent);
router.delete('/licitacao/:licitacaoId', hasRole('DELETE_LICITACAO'), licitacoesControllers.removeLicitacao);
router.get('/licitacao/publish/:licitacaoId', hasRole('WRITE_LICITACAO'), licitacoesControllers.publishLicitacao);
router.get('/licitacao/unpublish/:licitacaoId', hasRole('WRITE_LICITACAO'), licitacoesControllers.unpublishLicitacao);
router.get('/licitacao/checkUniqueNumber/:year/:number/:category', hasRole('READ_LICITACAO'), licitacoesControllers.checkUniqueNumber);
router.get('/licitacao/nextNumber/:year/:category', hasRole('READ_LICITACAO'), licitacoesControllers.getNextNumberOfTheYear);
router.get('/licitacao/event/download/:eventId', licitacoesControllers.downloadEventFile);
//10/07/2019: commented by Rodrigo
//replace by direct http download (apache sharing the minio folder via http)
//router.get('/licitacao/event/raw/download/:fileName', licitacoesControllers.rawDownloadEventFile);
router.get('/licitacao/events/last', licitacoesControllers.getLastLicitacoesEvents);
router.get('/licitacao/events/all', licitacoesControllers.getAllLicitacoesEvents);
router.get('/licitacao/event/:eventId', hasRole('READ_LICITACAO'), licitacoesControllers.getLicitacaoEvent);
router.get('/licitacao/:licitacaoId', licitacoesControllers.getLicitacao);
router.put('/licitacao/event/file/:uuid', hasRole('WRITE_LICITACAO'), licitacoesControllers.uploadEventFile);
router.put('/licitacao/event/:licitacaoId', hasRole('WRITE_LICITACAO'), licitacoesControllers.newLicitacaoEvent);
router.post('/licitacao/event', hasRole('WRITE_LICITACAO'), licitacoesControllers.editLicitacaoEvent);

//licitacoes categories
router.get('/licitacoesCategories', licitacoesCategoriesControllers.getLicitacoesCategories);

//legislative propositions
router.get('/legislativePropositions', legislativePropositionsControllers.getLegislativePropositions);
router.post('/legislativeProposition', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.editLegislativeProposition);

router.put('/legislativeProposition/wysiwyg/textFileAttachment', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.uploadWysiwygTextFileAttachment);
router.put('/legislativeProposition/wysiwyg/textFileImageAttachment', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.uploadWysiwygTextFileImageAttachment);
router.put('/legislativeProposition/wysiwyg/textAttachmentFileAttachment', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.uploadWysiwygTextAttachmentFileAttachment);
router.put('/legislativeProposition/wysiwyg/textAttachmentFileImageAttachment', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.uploadWysiwygTextAttachmentFileImageAttachment);
router.put('/legislativeProposition/wysiwyg/consolidatedTextFileAttachment', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.uploadWysiwygConsolidatedTextFileAttachment);
router.put('/legislativeProposition/wysiwyg/consolidatedTextFileImageAttachment', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.uploadWysiwygConsolidatedTextFileImageAttachment);
router.put('/legislativeProposition/wysiwyg/consolidatedTextAttachmentFileAttachment', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.uploadWysiwygConsolidatedTextAttachmentFileAttachment);
router.put('/legislativeProposition/wysiwyg/consolidatedTextAttachmentFileImageAttachment', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.uploadWysiwygConsolidatedTextAttachmentFileImageAttachment);

router.put('/legislativeProposition/attachment/file/:uuid', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.uploadAttachmentFile);
router.put('/legislativeProposition/consolidatedAttachment/file/:uuid', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.uploadConsolidatedAttachmentFile);
router.put('/legislativeProposition/attachment', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.newAttachmentFile);
router.put('/legislativeProposition', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.newLegislativeProposition);
router.delete('/legislativeProposition/attachment/:legislativePropositionFileAttachmentId', hasRole('WRITE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.deleteFileAttachment);
router.delete('/legislativeProposition/:legislativePropositionId', hasRole('DELETE_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.removeLegislativeProposition);
router.get('/legislativeProposition/byNumber/:legislativePropositionTypeId/:number', hasRole('READ_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.getLegislativePropositionByNumber);
router.get('/legislativeProposition/checkUniqueNumber/:legislativePropositionTypeId/:number', hasRole('READ_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.checkUniqueNumber);
router.get('/legislativeProposition/nextNumber/:legislativePropositionTypeId', hasRole('READ_LEGISLATIVE_PROPOSITION'), legislativePropositionsControllers.getNextNumberOfTheType);
router.get('/legislativeProposition/attachment/download/:legislativePropositionFileAttachmentId', legislativePropositionsControllers.downloadLegislativePropositionFileAttachment);
router.get('/legislativeProposition/:legislativePropositionId', legislativePropositionsControllers.getLegislativeProposition);
router.get('/legislativeProposition', legislativePropositionsControllers.getLegislativeProposition);
//legislative proposition types
router.get('/legislativePropositionTypes', legislativePropositionTypesControllers.getLegislativePropositionTypes);

//legislative proposition tags
router.get('/legislativePropositionTag/:legislativePropositionTagId', hasRole('READ_LEGISLATIVE_PROPOSITION_TAG'), legislativePropositionTagsControllers.getLegislativePropositionTag);
router.put('/legislativePropositionTag', hasRole('WRITE_LEGISLATIVE_PROPOSITION_TAG'), legislativePropositionTagsControllers.newLegislativePropositionTag);
router.post('/legislativePropositionTag', hasRole('WRITE_LEGISLATIVE_PROPOSITION_TAG'), legislativePropositionTagsControllers.editLegislativePropositionTag);
router.get('/legislativePropositionTags/:legislativePropositionTypeId', legislativePropositionTagsControllers.getLegislativePropositionTags);
router.get('/legislativePropositionTags', legislativePropositionTagsControllers.getAllLegislativePropositionTags);
router.get('/checkUniquelegislativePropositionTagDescription/:legislativePropositionTypeId', hasRole('READ_LEGISLATIVE_PROPOSITION_TAG'), legislativePropositionTagsControllers.checkUniqueDescription);
router.delete('/legislativePropositionTag/:legislativePropositionTagId', hasRole('DELETE_LEGISLATIVE_PROPOSITION_TAG'), legislativePropositionTagsControllers.removeLegislativePropositionTag);

//legislative proposition relationship types
router.get('/legislativePropositionRelationshipTypes', hasRole('READ_LEGISLATIVE_PROPOSITION_RELATIONSHIP_TYPE'), legislativePropositionRelationshipTypesControllers.getLegislativePropositionRelationshipTypes);

//public files
router.get('/publicFiles/folder/amountOfElements/:folderId', hasRole('READ_PUBLIC_FILES'), publicFilesControllers.getAmountOfElements);
router.get('/publicFiles/folder/amountOfElements', hasRole('READ_PUBLIC_FILES'), publicFilesControllers.getAmountOfElements);
router.get('/publicFiles/folder/:folderId', publicFilesControllers.listFolderContents);
router.get('/publicFiles/folder', publicFilesControllers.listFolderContents);
router.get('/publicFiles/folderPath/:folderId', publicFilesControllers.getFolderPath);
router.get('/publicFiles/file/all', publicFilesControllers.getAllFiles);
router.get('/publicFiles/file/meta/:fileId', publicFilesControllers.getMetaFile);
router.get('/publicFiles/file/:fileId', publicFilesControllers.downloadPublicFile);
router.put('/publicFiles/file/upload/:folderId/:fileName', hasRole('WRITE_PUBLIC_FILES'), publicFilesControllers.uploadPublicFile);
router.put('/publicFiles/file', hasRole('WRITE_PUBLIC_FILES'), publicFilesControllers.newFile);
router.put('/publicFiles/folder', hasRole('WRITE_PUBLIC_FILES'), publicFilesControllers.newFolder);
router.get('/publicFiles/moveFolder/up/:folderId', hasRole('WRITE_PUBLIC_FILES'), publicFilesControllers.moveFolderUp);
router.get('/publicFiles/moveFolder/down/:folderId', hasRole('WRITE_PUBLIC_FILES'), publicFilesControllers.moveFolderDown);
router.get('/publicFiles/moveFile/up/:fileId', hasRole('WRITE_PUBLIC_FILES'), publicFilesControllers.moveFileUp);
router.get('/publicFiles/moveFile/down/:fileId', hasRole('WRITE_PUBLIC_FILES'), publicFilesControllers.moveFileDown);
router.get('/publicFiles/checkUniqueDescription/:folderId', hasRole('READ_PUBLIC_FILES'), publicFilesControllers.checkUniqueDescription);
router.delete('/publicFiles/file/raw', hasRole('WRITE_PUBLIC_FILES'), publicFilesControllers.deleteRawFile);
router.delete('/publicFiles/file/:fileId', hasRole('DELETE_PUBLIC_FILES'), publicFilesControllers.removePublicFile);
router.delete('/publicFiles/folder/:folderId', hasRole('DELETE_PUBLIC_FILES'), publicFilesControllers.removePublicFolder);
router.post('/publicFiles/folder', hasRole('WRITE_PUBLIC_FILES'), publicFilesControllers.editFolder);

//events from Google Calendar API Service
router.get('/eventsCalendar', eventsCalendarControllers.getEvents);
router.get('/eventCalendar', eventsCalendarControllers.getEvent);

//security roles
router.get('/securityRoles', hasRole('READ_SECURITY_ROLES'), securityRoleControllers.getSecurityRoles);

module.exports = router;
