/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var User = require('../models/User.js').getModel();
var UserGroup = require('../models/UserGroup.js').getModel();
var SecurityRole = require('../models/SecurityRole.js').getModel();
var MenuAdmin = require('../models/MenuAdmin.js').getModel();
var MenuPortal = require('../models/MenuPortal.js').getModel();
var Banner = require('../models/Banner.js').getModel();
var HotNewsItem = require('../models/HotNewsItem.js').getModel();
var NewsItem = require('../models/NewsItem.js').getModel();
var Page = require('../models/Page.js').getModel();
var BreakingNews = require('../models/BreakingNewsItem.js').getModel();
var FBreakingNews = require('../models/FBreakingNewsItem.js').getModel();
var async = require("async");
var Util = require("../util/Utils.js");
var fs = require("fs");
var loremIpsum = require("lorem-ipsum");
var Minio = require('minio');
var config = require('config');
var _ = require('lodash');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _sampleDataGenerationActivated = false;
var _sampleDataCleaningActivated = false;

/*****************************************************************************
******************************* PRIVATE **************************************
***************************(LOADING FUNCTIONS)********************************
/*****************************************************************************/
//load breaking news items
var _loadFBreakingNews = function(done) {

   winston.verbose("Creating fixed breaking news items ...");
   var fbreakingNewsList = [];

   var fbreakingNewsItemTestBuffer1 = fs.readFileSync("./test/resources/fbreaking_news_1.jpg", { flag: 'r' });

   //upload the thumbnail test to S3
   var camaraApiConfig = config.get("CamaraApi");
   var fbreakingNewsItemImageFilename1 = "fbreaking_news_1.jpg";

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //send the file to S3 server
   s3Client.putObject( camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Bucket,
                       camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Folder + "/" + fbreakingNewsItemImageFilename1,
                       fbreakingNewsItemTestBuffer1,
                       fbreakingNewsItemTestBuffer1.length,
                       "image/jpeg")
           .then(function(etag) {
             var fbreakingNewsItemTestBuffer2 = fs.readFileSync("./test/resources/fbreaking_news_2.jpg", { flag: 'r' });
             var fbreakingNewsItemImageFilename2 = "fbreaking_news_2.jpg";

             return s3Client.putObject( camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Bucket,
                                        camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Folder + "/" + fbreakingNewsItemImageFilename2,
                                        fbreakingNewsItemTestBuffer2,
                                        fbreakingNewsItemTestBuffer2.length,
                                        "image/jpeg");
           }).then(function(etag) {
             var fbreakingNewsItemTestBuffer3 = fs.readFileSync("./test/resources/fbreaking_news_3.jpg", { flag: 'r' });
             var fbreakingNewsItemImageFilename3 = "fbreaking_news_3.jpg";

             return s3Client.putObject( camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Bucket,
                                        camaraApiConfig.FBreakingNews.s3FBreakingNews.s3Folder + "/" + fbreakingNewsItemImageFilename3,
                                        fbreakingNewsItemTestBuffer3,
                                        fbreakingNewsItemTestBuffer3.length,
                                        "image/jpeg");
           }).then(function(etag) {
                //the upload has been successfully completed
                //then insert the breaking news items
                var fbreakingNewsItems = [];
                var i;
                for (i = 1; i <= 3; i++) {
                   var fbreakingNewsItem = {};
                   fbreakingNewsItem.headline = "Headline #" + i;
                   fbreakingNewsItem.headlineIcon = "ion-ios7-people";
                   fbreakingNewsItem.title = "Fixed breaking news #" + i;
                   fbreakingNewsItem.date = new Date();
                   fbreakingNewsItem.views = 0;
                   fbreakingNewsItem.type = "link";
                   fbreakingNewsItem.imageFile = "fbreaking_news_" + i + ".jpg";
                   fbreakingNewsItem.access = { target : "_blank",
                                               url : "http://uol.com.br"
                                             };
                   fbreakingNewsItem.order = i;
                   fbreakingNewsItem.deleted = false;
                   fbreakingNewsItems.push(fbreakingNewsItem);
                }
                FBreakingNews.insertMany(fbreakingNewsItems, function(err) {
                   if(err) {
                      winston.error("Error while saving fixed breaking news items for testing in SampleDataLoader, err = [%s]", err);
                      done(err, false);
                   } else {
                      winston.verbose("Fixed breaking news items created.");
                      done(null, true);
                   }
               });
           }).catch(function(err) {
             winston.error("Error while uploading image file of the fixed breaking news items, err = [%s]", err);
             done(err, false);
          });
}

//load breaking news items
var _loadBreakingNews = function(done) {

   winston.verbose("Creating breaking news items ...");
   var breakingNewsList = [];

   var breakingNewsItemTestBuffer1 = fs.readFileSync("./test/resources/breaking_news_1.jpg", { flag: 'r' });

   //upload the thumbnail test to S3
   var camaraApiConfig = config.get("CamaraApi");
   var breakingNewsItemImageFilename1 = "breaking_news_1.jpg";

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //send the file to S3 server
   s3Client.putObject( camaraApiConfig.BreakingNews.s3BreakingNews.s3Bucket,
                       camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + breakingNewsItemImageFilename1,
                       breakingNewsItemTestBuffer1,
                       breakingNewsItemTestBuffer1.length,
                       "image/jpeg")
           .then(function(etag) {
             var breakingNewsItemTestBuffer2 = fs.readFileSync("./test/resources/breaking_news_2.jpg", { flag: 'r' });
             var breakingNewsItemImageFilename2 = "breaking_news_2.jpg";

             return s3Client.putObject( camaraApiConfig.BreakingNews.s3BreakingNews.s3Bucket,
                                        camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + breakingNewsItemImageFilename2,
                                        breakingNewsItemTestBuffer2,
                                        breakingNewsItemTestBuffer2.length,
                                        "image/jpeg");
           }).then(function(etag) {
             var breakingNewsItemTestBuffer3 = fs.readFileSync("./test/resources/breaking_news_3.jpg", { flag: 'r' });
             var breakingNewsItemImageFilename3 = "breaking_news_3.jpg";

             return s3Client.putObject( camaraApiConfig.BreakingNews.s3BreakingNews.s3Bucket,
                                        camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + breakingNewsItemImageFilename3,
                                        breakingNewsItemTestBuffer3,
                                        breakingNewsItemTestBuffer3.length,
                                        "image/jpeg");
           }).then(function(etag) {
             var breakingNewsItemTestBuffer4 = fs.readFileSync("./test/resources/breaking_news_4.jpg", { flag: 'r' });
             var breakingNewsItemImageFilename4 = "breaking_news_4.jpg";

             return s3Client.putObject( camaraApiConfig.BreakingNews.s3BreakingNews.s3Bucket,
                                        camaraApiConfig.BreakingNews.s3BreakingNews.s3Folder + "/" + breakingNewsItemImageFilename4,
                                        breakingNewsItemTestBuffer4,
                                        breakingNewsItemTestBuffer4.length,
                                        "image/jpeg");
           }).then(function(etag) {
                //the upload has been successfully completed
                //then insert the breaking news items
                var breakingNewsItems = [];
                var i;
                for (i = 1; i <= 4; i++) {
                   var breakingNewsItem = {};
                   breakingNewsItem.headline = "Headline #" + i;
                   breakingNewsItem.headlineIcon = "ion-ios7-people";
                   breakingNewsItem.title = "Breaking news #" + i;
                   breakingNewsItem.date = new Date();
                   breakingNewsItem.views = 0;
                   breakingNewsItem.type = "link";
                   breakingNewsItem.imageFile = "breaking_news_" + i + ".jpg";
                   breakingNewsItem.access = { target : "_blank",
                                               url : "http://uol.com.br"
                                             };
                   breakingNewsItem.order = i;
                   breakingNewsItems.push(breakingNewsItem);
                }
                BreakingNews.insertMany(breakingNewsItems, function(err) {
                   if(err) {
                      winston.error("Error while saving breaking news items for testing in SampleDataLoader, err = [%s]", err);
                      done(err, false);
                   } else {
                      winston.verbose("Breaking news items created.");
                      done(null, true);
                   }
               });
           }).catch(function(err) {
             winston.error("Error while uploading image file of the breaking news items, err = [%s]", err);
             done(err, false);
          });
}

//load hot news
var _loadHotNewsItems = function(done) {
   winston.verbose("Creating hot news ...");
   var hotNewsList = [];

   var i;
   for (i = 1; i <= 3; i++) {
      var hotNews = {
         title: "#" + i + " " + loremIpsum({ count: 10, units: 'words' }) + ".",
         order: i,
         access : {
            "_id" : "5aa2dbc7779d612628a2e61f",
            "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
            "id" : "5aa2dbc7779d612628a2e61f",
            "creationDate" : "2017-01-05T13:43:00.000Z"
         },
         type : "page"
      };

      hotNewsList.push(hotNews);
   }

   HotNewsItem.insertMany(hotNewsList, function(err) {
      if(err) {
         winston.error("Error while saving hot news for testing in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Hot news.");
         done(null, true);
      }
   });

}

//load banners
var _loadBanners = function(done) {

   winston.verbose("Creating banners ...");
   var bannersList = [];

   var bannerImageTestBuffer1 = fs.readFileSync("./test/resources/banner_test_1.jpg", { flag: 'r' });

   //upload the thumbnail test to S3
   var camaraApiConfig = config.get("CamaraApi");
   var bannerImageFilename1 = "banner_test_1.jpg";

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //send the file to S3 server
   s3Client.putObject( camaraApiConfig.Banners.s3Banners.s3Bucket,
                       camaraApiConfig.Banners.s3Banners.s3Folder + "/" + bannerImageFilename1,
                       bannerImageTestBuffer1,
                       bannerImageTestBuffer1.length,
                       "image/jpeg")
           .then(function(etag) {
             var bannerImageTestBuffer2 = fs.readFileSync("./test/resources/banner_test_2.jpg", { flag: 'r' });
             var bannerImageFilename2 = "banner_test_2.jpg";

             return s3Client.putObject( camaraApiConfig.Banners.s3Banners.s3Bucket,
                                 camaraApiConfig.Banners.s3Banners.s3Folder + "/" + bannerImageFilename2,
                                 bannerImageTestBuffer2,
                                 bannerImageTestBuffer2.length,
                                 "image/jpeg");
           }).then(function(etag) {
             var bannerImageTestBuffer3 = fs.readFileSync("./test/resources/banner_test_3.jpg", { flag: 'r' });
             var bannerImageFilename3 = "banner_test_3.jpg";

             return s3Client.putObject( camaraApiConfig.Banners.s3Banners.s3Bucket,
                                        camaraApiConfig.Banners.s3Banners.s3Folder + "/" + bannerImageFilename3,
                                        bannerImageTestBuffer3,
                                        bannerImageTestBuffer3.length,
                                        "image/jpeg");
           }).then(function(etag) {
                //the upload has been successfully completed
                //then insert the banners
                var banners = [];
                var i;
                for (i = 1; i <= 3; i++) {
                   var banner = {};
                   banner.type = "link";
                   banner.imageFile = "banner_test_" + i + ".jpg";
                   banner.access = { target : "_blank",
                                     url : "http://uol.com.br"
                                   };
                   banner.order = i;
                   banners.push(banner);
                }
                Banner.insertMany(banners, function(err) {
                   if(err) {
                      winston.error("Error while saving banners for testing in SampleDataLoader, err = [%s]", err);
                      done(err, false);
                   } else {
                      winston.verbose("Banners created.");
                      done(null, true);
                   }
               });
           }).catch(function(err) {
             winston.error("Error while uploading image file of the banners, err = [%s]", err);
             done(err, false);
          });
}

//load news
var _loadNewsItems = function(done) {

   winston.verbose("Creating news ...");
   var newsList = [];

   var newsItemThumbnailTestBuffer = fs.readFileSync("./test/resources/news_item_thumbnail_test.jpg", { flag: 'r' });

   //upload the thumbnail test to S3
   var camaraApiConfig = config.get("CamaraApi");
   var newsThumbnailFilename = "news_item_thumbnail_test.jpg";

   var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
   //send the file to S3 server
   s3Client.putObject( camaraApiConfig.News.s3Thumbnails.s3Bucket,
                       camaraApiConfig.News.s3Thumbnails.s3Folder + "/" + newsThumbnailFilename,
                       newsItemThumbnailTestBuffer,
                       newsItemThumbnailTestBuffer.length,
                       "image/jpeg",
   function (err, etag) {
      if(!err) {
         //the upload has been successfully completed
         //then insert the news
         var i;
         for (i = 0; i < 1000; i++) {
            var newsItem = {};
            var publish = Util.random(0, 1) ? true : false;
            var futurePublication = publish ? ( Util.random(0, 1) ? true : false ) : false;
            var changed = Util.random(0, 1) ? true : false;
            var now = new Date();
            now.setSeconds(0);
            now.setMilliseconds(0);
            var randomDate = Util.randomDateAndTimeInMinutes(2000,11,1, 2017,0,10); //now
            randomDate.setMilliseconds(0);
            randomDate.setSeconds(0);
            var changedDate = changed ? new Date(randomDate.getTime() + Util.random(1, 3) * 86400000) : null;
            var futurePublicationDate = futurePublication ? new Date(randomDate.getTime() + Util.random(1, 7 * 86400) * 1000) : randomDate;
            futurePublicationDate.setMilliseconds(0);
            futurePublicationDate.setSeconds(0);
            newsItem.title = "News " + i + " " + loremIpsum({ count: 10, units: 'words' }) + ".";
            newsItem.headline = loremIpsum({ count: 1, units: 'sentences', sentenceLowerBound: 5, sentenceUpperBound: 15 });
            newsItem.publish = publish;
            newsItem.thumbnailFile = newsThumbnailFilename;
            newsItem.publicationDate = ( publish ?  ( futurePublication ? futurePublicationDate :
                                                                          randomDate
                                                    )
                                                 : null
                                       );
            newsItem.creationDate = randomDate;
            newsItem.changedDate = changedDate;
            newsItem.body = loremIpsum({ count: 5,
                                         units: 'paragraphs',
                                         sentenceLowerBound: 5,
                                         sentenceUpperBound: 15,
                                         paragraphLowerBound: 3,
                                         paragraphUpperBound: 7,
                                         format: 'html' });
            newsList.push(newsItem);
         }

         NewsItem.insertMany(newsList, function(err) {
            if(err) {
               winston.error("Error while saving news for testing in SampleDataLoader, err = [%s]", err);
               done(err, false);
            } else {
               winston.verbose("News created.");
               done(null, true);
            }
         });
      } else {
         winston.error("Error while uploading thumbnail file of the news item, err = [%s]", err);
         done(err, false);
      }
   });
}

//load news
var _loadPages = function(done) {
   winston.verbose("Creating pages ...");
   var pageList = [];

   //insert the pages
   var i;
   for (i = 0; i < 1000; i++) {
      var page = {};
      var changed = Util.random(0, 1) ? true : false;
      var now = new Date();
      now.setSeconds(0);
      now.setMilliseconds(0);
      var randomDate = Util.randomDateAndTimeInMinutes(2000,11,1, 2017,0,10); //now
      randomDate.setMilliseconds(0);
      randomDate.setSeconds(0);
      var changedDate = changed ? new Date(randomDate.getTime() + Util.random(1, 3) * 86400000) : null;
      page.title = "Page " + i + " " + loremIpsum({ count: 10, units: 'words' }) + ".";
      page.creationDate = randomDate;
      page.changedDate = changedDate;
      page.body = loremIpsum({ count: 5,
                               units: 'paragraphs',
                               sentenceLowerBound: 5,
                               sentenceUpperBound: 15,
                               paragraphLowerBound: 3,
                               paragraphUpperBound: 7,
                               format: 'html' });
      pageList.push(page);
   }

   Page.insertMany(pageList, function(err) {
      if(err) {
         winston.error("Error while saving pages for testing in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Pages created.");
         done(null, true);
      }
   });
}

//load a menu to the admin module for testing purposes
var _loadMenuAdmin = function(done) {
   //process a menu item
   var _processMenuItemAdmin = async function(rootMenuItem, prmIsRoot) {
      var isRoot = prmIsRoot !== undefined ? prmIsRoot : false;

      if(rootMenuItem.menuItems && rootMenuItem.menuItems.length > 0) {
         var i;
         var childrenIds = [];
         for(i = 0; i < rootMenuItem.menuItems.length; i++) {
            var childMenuItem = rootMenuItem.menuItems[i];
            var id = await new Promise(function(resolve, reject) {
               _processMenuItemAdmin(childMenuItem).then(function(result) {
                  resolve(result);
               }).catch(function(err) {
                  reject(err);
               });
            });
            childrenIds.push(id);
         }
         var menuItem = new MenuAdmin();
         menuItem.title = rootMenuItem.title;
         menuItem.sref = rootMenuItem.sref;
         menuItem.icon = rootMenuItem.icon;
         menuItem.isRoot = isRoot;
         menuItem.order = rootMenuItem.order !== undefined ? rootMenuItem.order : -1;
         menuItem.menuItems = childrenIds;
         var id = await new Promise(function(resolve, reject) {
            menuItem.save().then(function(result) {
               resolve(result._id);
            }).catch(function(err) {
               reject(err);
            });
         });
         return id;
      } else {
         var menuItem = new MenuAdmin();
         menuItem.title = rootMenuItem.title;
         menuItem.sref = rootMenuItem.sref;
         menuItem.icon = rootMenuItem.icon;
         menuItem.isRoot = isRoot;
         menuItem.order = rootMenuItem.order !== undefined ? rootMenuItem.order : -1;
         menuItem.menuItems = [];

         var id = await new Promise(function(resolve, reject) {
            menuItem.save().then(function(result) {
               resolve(result._id);
            }).catch(function(err) {
               reject(err);
            });
         });
         return id;
      }
   }
   //process the root menu items
   var _processMenuAdmin = async function(menuAdmin) {
      if(menuAdmin) {
         var i;
         for (i = 0; i < menuAdmin.length; i++) {
            var menuItem = menuAdmin[i];
            var id = await new Promise(function(resolve, reject) {
               _processMenuItemAdmin(menuItem, true).then(function(result) {
                  resolve(result);
               }).catch(function(err) {
                  reject(err);
               });
            });
         }
         return true;
      }
   }
   //menu defition
   var menuItemsArr =  [{  title: 'Dashboard - Mock',
                           sref:  'dashboard',
                           icon:  'icon-home',
                           isRoot: true,
                           order: 0
                        },
                        {  icon: 'icon-settings',
                           title: 'AngularJS Features',
                           isRoot: true,
                           order: 1,
                           menuItems:
                               [ { title: 'UI Bootstrap',
                                   icon: 'icon-home',
                                   sref: 'uibootstrap',
                                   isRoot: false
                                 },
                                 { title: 'File Upload',
                                   icon: 'icon-puzzle',
                                   sref: 'fileupload',
                                   isRoot: false
                                 },
                                 { title: 'UI Select',
                                   icon: 'icon-paper-clip',
                                   sref: 'uiselect',
                                   isRoot: false
                                 },
                                 { title: 'Test security',
                                   icon: 'icon-paper-clip',
                                   sref: 'testsecurity',
                                   isRoot: false
                                 }
                              ]
                        },
                        { icon: 'icon-wrench',
                          title: 'jQuery Plugins',
                          isRoot: true,
                          order: 2,
                          menuItems:
                               [{ title: 'Form Tools',
                                  icon: 'icon-puzzle',
                                  sref: 'formtools',
                                  isRoot: false
                                 },
                                 { title: 'Date & Time Pickers',
                                   icon: 'icon-calendar',
                                   sref: 'pickers',
                                   isRoot: false
                                 },
                                 { title: 'Custom Dropdowns',
                                   icon: 'icon-refresh',
                                   sref: 'dropdowns',
                                   isRoot: false
                                 },
                                 { title: 'Tree View',
                                   icon: 'icon-share',
                                   sref: 'tree',
                                   isRoot: false
                                 },
                                 { title: 'Datatables',
                                   icon: 'icon-briefcase',
                                   isRoot: false,
                                   menuItems:
                                    [{ title: 'Managed Datatables',
                                       icon: 'icon-tag',
                                       sref: 'datatablesmanaged',
                                       isRoot: false
                                      },
                                      { title: 'Ajax Datatables',
                                        icon: 'icon-refresh',
                                        sref: 'datatablesajax',
                                        isRoot: false
                                      }]
                                 }]
                        },
                        { title: 'User Profile',
                          icon: 'icon-user',
                          sref: 'profile.dashboard',
                          order: 3,
                          isRoot: true
                        },
                        { title: 'Task & Todo',
                          icon: 'icon-check',
                          sref: 'todo',
                          order: 4,
                          isRoot: true
                        },
                        {  title: 'Blank Page',
                           icon: 'icon-refresh',
                           sref: 'blank',
                           order: 5,
                           isRoot: true
                        },
                        { title: 'Usuários',
                          icon: 'icon-user',
                          sref: 'users',
                          order: 6,
                          isRoot: true
                        },
                        { title: 'Grupos de usuários',
                          icon: 'icon-grid',
                          sref: 'userGroups',
                          order: 7,
                          isRoot: true
                        },
                        { title: 'Menu - Admin',
                          icon: 'icon-film',
                          sref: 'menuAdmin.list',
                          order: 8,
                          isRoot: true
                       },{ title: 'Menu - Portal',
                          icon: 'icon-list',
                          sref: 'menuPortal.list',
                          order: 9,
                          isRoot: true
                        },
                        { title: 'Notícias',
                          icon: 'icon-docs',
                          sref: 'newsItem.list',
                          order: 10,
                          isRoot: true
                        },
                        { title: 'Páginas',
                          icon: 'icon-globe',
                          sref: 'page.list',
                          order: 10,
                          isRoot: true
                        },{ title: 'Banners',
                          icon: 'icon-film',
                          sref: 'banner.list',
                          order: 11,
                          isRoot: true
                       },{ title: 'Destaques Cabeçalho',
                          icon: 'icon-energy',
                          sref: 'hotNews.list',
                          order: 12,
                          isRoot: true
                       },{ title: 'Destaques Rotativos',
                          icon: 'icon-star',
                          sref: 'breakingNews.list',
                          order: 13,
                          isRoot: true
                       },{ title: 'Destaques Fixos',
                          icon: 'icon-direction',
                          sref: 'fixedBreakingNews.list',
                          order: 14,
                          isRoot: true
                       },{ title: 'Eventos',
                          icon: 'icon-calendar',
                          sref: 'eventsCalendar.list',
                          order: 15,
                          isRoot: true
                       },{ title: 'Login',
                          icon: 'icon-user',
                          sref: 'login',
                          order: 16,
                          isRoot: true
                        }];
   //do the job
   winston.verbose("Creating menu admin ...");
   _processMenuAdmin(menuItemsArr).then(function(result) {
      winston.verbose("Menu admin created.");
      done(null, true);
   }).catch(function(err) {
      done(err, false);
   });
}

//load a menu to the portal module for testing purposes
var _loadMenuPortal = function(done) {
   //process a menu item
   var _processMenuItemPortal = async function(rootMenuItem, prmIsRoot) {
      var isRoot = prmIsRoot !== undefined ? prmIsRoot : false;

      if(rootMenuItem.menuItems && rootMenuItem.menuItems.length > 0) {
         var i;
         var childrenIds = [];
         for(i = 0; i < rootMenuItem.menuItems.length; i++) {
            var childMenuItem = rootMenuItem.menuItems[i];
            var id = await new Promise(function(resolve, reject) {
               _processMenuItemPortal(childMenuItem).then(function(result) {
                  resolve(result);
               }).catch(function(err) {
                  reject(err);
               });
            });
            childrenIds.push(id);
         }
         var menuItem = new MenuPortal();
         menuItem.title = rootMenuItem.title;
         menuItem.url = rootMenuItem.url;
         menuItem.isRoot = isRoot;
         menuItem.order = rootMenuItem.order !== undefined ? rootMenuItem.order : -1;
         menuItem.menuItems = childrenIds;
         var id = await new Promise(function(resolve, reject) {
            menuItem.save().then(function(result) {
               resolve(result._id);
            }).catch(function(err) {
               reject(err);
            });
         });
         return id;
      } else {
         var menuItem = new MenuPortal();
         menuItem.title = rootMenuItem.title;
         menuItem.url = rootMenuItem.url;
         menuItem.isRoot = isRoot;
         menuItem.order = rootMenuItem.order !== undefined ? rootMenuItem.order : -1;
         menuItem.menuItems = [];

         var id = await new Promise(function(resolve, reject) {
            menuItem.save().then(function(result) {
               resolve(result._id);
            }).catch(function(err) {
               reject(err);
            });
         });
         return id;
      }
   }

   //process the root menu items
   var _processMenuPortal = async function(menuPortal) {
      if(menuPortal) {
         var i;
         for (i = 0; i < menuPortal.length; i++) {
            var menuItem = menuPortal[i];
            var id = await new Promise(function(resolve, reject) {
               _processMenuItemPortal(menuItem, true).then(function(result) {
                  resolve(result);
               }).catch(function(err) {
                  reject(err);
               });
            });
         }
         return true;
      }
   }
   //menu defition
   var menuItemsArr =  [{  title: 'Menu A',
                           isRoot: true,
                           order: 0,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu B',
                           isRoot: true,
                           order: 1,
                           menuItems: [
                              {  title: 'Menu B C',
                                 isRoot: false,
                                 order: 0,
                                 access : {
                                    "_id" : "5aa2dbc7779d612628a2e61f",
                                    "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                    "id" : "5aa2dbc7779d612628a2e61f",
                                    "creationDate" : "2017-01-05T13:43:00.000Z"
                                 },
                                 type : "page"
                              },
                              {  title: 'Menu B D',
                                 isRoot: false,
                                 order: 1,
                                 access : {
                                    "_id" : "5aa2dbc7779d612628a2e61f",
                                    "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                    "id" : "5aa2dbc7779d612628a2e61f",
                                    "creationDate" : "2017-01-05T13:43:00.000Z"
                                 },
                                 type : "page"
                              },
                              {  title: 'Menu B E',
                                 isRoot: false,
                                 order: 2,
                                 access : {
                                    "_id" : "5aa2dbc7779d612628a2e61f",
                                    "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                    "id" : "5aa2dbc7779d612628a2e61f",
                                    "creationDate" : "2017-01-05T13:43:00.000Z"
                                 },
                                 type : "page"
                              }
                           ]
                        },
                        {  title: 'Menu C',
                           isRoot: true,
                           order: 2,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu D',
                           isRoot: true,
                           order: 3,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu E',
                           isRoot: true,
                           order: 4,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu F',
                           isRoot: true,
                           order: 5,
                           menuItems: [
                              {  title: 'Menu F C',
                                 isRoot: false,
                                 order: 0,
                                 access : {
                                    "_id" : "5aa2dbc7779d612628a2e61f",
                                    "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                    "id" : "5aa2dbc7779d612628a2e61f",
                                    "creationDate" : "2017-01-05T13:43:00.000Z"
                                 },
                                 type : "page"
                              },
                              {  title: 'Menu F D',
                                 isRoot: false,
                                 order: 1,
                                 menuItems: [
                                    {  title: 'Menu F D A',
                                       isRoot: false,
                                       order: 0,
                                       access : {
                                          "_id" : "5aa2dbc7779d612628a2e61f",
                                          "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                          "id" : "5aa2dbc7779d612628a2e61f",
                                          "creationDate" : "2017-01-05T13:43:00.000Z"
                                       },
                                       type : "page"
                                    },
                                    {  title: 'Menu F D B',
                                       isRoot: false,
                                       order: 1,
                                       access : {
                                          "_id" : "5aa2dbc7779d612628a2e61f",
                                          "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                          "id" : "5aa2dbc7779d612628a2e61f",
                                          "creationDate" : "2017-01-05T13:43:00.000Z"
                                       },
                                       type : "page"
                                    }
                                 ]
                              },
                              {  title: 'Menu F E',
                                 isRoot: false,
                                 order: 2,
                                 access : {
                                    "_id" : "5aa2dbc7779d612628a2e61f",
                                    "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                                    "id" : "5aa2dbc7779d612628a2e61f",
                                    "creationDate" : "2017-01-05T13:43:00.000Z"
                                 },
                                 type : "page"
                              }
                           ]

                        },
                        {  title: 'Menu G',
                           isRoot: true,
                           order: 6,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu H',
                           isRoot: true,
                           order: 7,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        },
                        {  title: 'Menu I',
                           isRoot: true,
                           order: 8,
                           access : {
                              "_id" : "5aa2dbc7779d612628a2e61f",
                              "title" : "Page 431 labore dolore consectetur veniam non tempor laborum esse dolor nisi.",
                              "id" : "5aa2dbc7779d612628a2e61f",
                              "creationDate" : "2017-01-05T13:43:00.000Z"
                           },
                           type : "page"
                        }];
   //do the job
   winston.verbose("Creating portal menu ...");
   _processMenuPortal(menuItemsArr).then(function(result) {
      winston.verbose("Portal menu created.");
      done(null, true);
   }).catch(function(err) {
      done(err, false);
   });
}

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

         UserGroup.bulkWrite(commands, function(err, result) {
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
      //BEGIN: additional roles here
      securityRoles.push({ name: "news_upload_thumbnail" });
      //END: additional roles here

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

//Load random users for testing purposes
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

/*****************************************************************************
******************************* PRIVATE **************************************
**************************(CLEANING FUNCTIONS)********************************
/*****************************************************************************/
var _removeFBreakingNews = function(done) {
   FBreakingNews.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing fixed breaking news items SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Fixed breaking news items removed");
         done(null, true);
      }
   });
}

var _removeBreakingNews = function(done) {
   BreakingNews.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing breaking news items SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Breaking news items removed");
         done(null, true);
      }
   });
}

var _removeHotNewsItems = function(done) {
   HotNewsItem.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing hot news items SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Hot news items removed");
         done(null, true);
      }
   });
}

var _removeMenuAdmin = function(done) {
   MenuAdmin.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing menu admin in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Menu admin removed");
         done(null, true);
      }
   });
}

var _removeMenuPortal = function(done) {
   MenuPortal.remove({}, function(err) {
      if(err) {
         winston.error("Error while removing menu portal in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Menu portal removed");
         done(null, true);
      }
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
   SecurityRole.remove({ }, function(err) {
      if (err) {
         winston.error("Error while removing security roles in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Security roles removed");
         done(null, true);
      }
   });
}

//remove the news
var _removeNewsItems = function(done) {
   NewsItem.remove({ title: /^News/ }, function(err) {
      if (err) {
         winston.error("Error while removing news in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("News removed");
         done(null, true);
      }
   });
}

//remove the pages
var _removePages = function(done) {
   Page.remove({ title: /^Page/ }, function(err) {
      if (err) {
         winston.error("Error while removing pages in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Pages removed");
         done(null, true);
      }
   });
}

//remove the pages
var _removeBanners = function(done) {
   Banner.remove({}, function(err) {
      if (err) {
         winston.error("Error while removing banners in SampleDataLoader, err = [%s]", err);
         done(err, false);
      } else {
         winston.verbose("Banners removed");
         done(null, true);
      }
   });
}

//put the desired sample data routines here, they will be executed in the
//order by this sample data generator
var _loadRoutines = [
   _loadFBreakingNews,
   _loadBreakingNews,
   _loadBanners,
   _loadHotNewsItems,
   _loadPages,
   _loadNewsItems,
   _loadMenuPortal,
   _loadMenuAdmin,
   _loadSecurityRoles,
   _loadUserGroups,
   _loadUserTest,
   _loadRandomUsersTest
];

//put the desired sample data clear routines here, they will be executed in the
//order by this sample data generator to clear data generated before
var _clearRoutines = [
   _removeFBreakingNews,
   _removeBreakingNews,
   _removeHotNewsItems,
   _removeMenuPortal,
   _removeMenuAdmin,
   _removeUserTest,
   _removeRandomUsersTest,
   _removeUserGroups,
   _removeSecurityRoles,
   _removeNewsItems,
   _removePages,
   _removeBanners
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
