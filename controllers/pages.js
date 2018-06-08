/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var PageModule = require('../models/Page.js');
var Page = PageModule.getModel();
var Utils = require('../util/Utils.js');
var _ = require('lodash');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.newPage = function(req, res, next) {
   if(req.body.page) {
      var pageJSON = req.body.page;

      var page = new Page();
      var now = new Date();
      page.title = pageJSON.title;
      page.creationDate = now;
      page.changedDate = null;
      page.body = pageJSON.body;

      winston.debug("Saving page ...");

      page.save(function(err, page) {
         if(!err) {
            winston.verbose("Page saved.");
            Utils.sendJSONresponse(res, 200, { message: 'page saved', id: page._id });
         } else {
            winston.error("Error while saving the page, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined page' });
   }
}

module.exports.editPage = function(req, res, next) {
   if(req.body.page) {
      var pageJSON = req.body.page;

      Page.findById({ _id: pageJSON.id }).then( function(page) {
         if(page) {
            var now = new Date();
            page.title = pageJSON.title;
            page.changedDate = now;
            page.body = pageJSON.body;

            winston.debug("Saving page ...");

            page.save(function(err, page) {
               if(!err) {
                  winston.verbose("Page saved.");
                  Utils.sendJSONresponse(res, 200, { message: 'page saved', id: page._id });
               } else {
                  winston.error("Error while saving the page, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'page not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined page' });
   }
}

module.exports.removePage = function(req, res, next) {
   if(req.params.pageId) {
      var pageId = req.params.pageId;

      Page.findById({ _id: pageId }).then( function(page) {
         if(page) {
            page.remove().then(function(page) {
               winston.verbose("Page removed.");
               Utils.sendJSONresponse(res, 200, { message: 'page removed' });
            }).catch(function(err) {
               winston.error("Error while deleting the page, err = [%s]", err);
               Utils.next(400, err, next);
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'page not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined page id' });
   }
}

module.exports.getPages = function(req, res, next) {
   //pagination options
   var page = req.query.page ? parseInt(req.query.page) : 1;
   var pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
   var keywords = req.query.keywords ?  req.query.keywords : null;
   var date1 = req.query.date1 ?  req.query.date1 : null;
   var date2 = req.query.date2 ?  req.query.date2 : null;

   //filter options
   var filter = { };
   var filterAnd = [];
   filter['$and'] = filterAnd;

   if(keywords) {
      var keywordsRegex = new RegExp(keywords, "i");
      filterAnd.push({ title : { $regex : keywordsRegex } });
   }
   if(date1) {
      filterAnd.push({ 'creationDate': { '$gte' : date1 } });
   }
   if(date2) {
      filterAnd.push({ 'creationDate': { '$lte' : date2 } });
   }

   //if there is just one statement, then remove the "and" clausule
   if(filterAnd.length === 0) {
      filter = { };
   } else if(filterAnd.length === 1) {
      filter = filterAnd[0];
   }

   //id filter
   if(req.query.id) {
      filter = { _id : PageModule.getMongoose().Types.ObjectId(req.query.id) }
   }

   Page.count(filter).then(function(count) {
      if(count > 0) {
         if(page * pageSize - pageSize >= count) {
            page = Math.ceil(count / pageSize); //last page
         }
         return Page.find(filter)
                 .sort({ publish: 1, creationDate: -1, changedDate: -1 })
                 .skip(page * pageSize - pageSize)
                 .limit(pageSize)
                 .then(function(pages) {
                   return {
                      "pages" : pages,
                      "totalLength": count,
                      "page": page,
                      "pageSize": pageSize
                   };
                 });
      } else {
         return {
            "pages" : [],
            "totalLength": 0,
            "page": 1,
            "pageSize": 1
         }
      }
   }).then(function(result) {
      Utils.sendJSONresponse(res, 200, result);
   }).catch(function(err) {
      winston.error("Error while getting pages, err = [%s]", err);
      Utils.next(400, err, next);
   });
}

module.exports.getPage = function(req, res, next) {
   if(req.params.pageId) {
      Page.findOne({ _id: PageModule.getMongoose().Types.ObjectId(req.params.pageId) }).then( function(page) {
         if(page) {
            Utils.sendJSONresponse(res, 200, {
                "page" : page
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'page not found' });
         }
      }).catch(function(err) {
         winston.error("Error while getting page, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined page id' });
   }

}

module.exports.getIncrementPageViews = function(req, res, next) {
   if(req.params.pageId) {
      Page.findOne({ _id: req.params.pageId }).then( function(page) {
         if(page) {
            var views = page.views;
            if(views && views > 0) {
               views = views + 1;
            } else {
               views = 1;
            }
            page.views = views;
            page.save(function(err, pageUpdated) {
               if(!err) {
                  winston.verbose("The views of the page was incremented.");
                  Utils.sendJSONresponse(res, 200, { message: 'views incremented', views: pageUpdated.views });
               } else {
                  winston.error("Error while incrementing views of the page, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'page not found' });
         }
      }).catch(function(err) {
         winston.error("Error while getting page, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined page id' });
   }

}
