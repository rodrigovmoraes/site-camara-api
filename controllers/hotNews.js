/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var HotNewsItemModule = require('../models/HotNewsItem.js');
var HotNewsItem = HotNewsItemModule.getModel();
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var Minio = require('minio');
var config = require('config');
var kue = require('kue');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.newHotNewsItem = function(req, res, next) {
   if(req.body.hotNewsItem) {
      winston.debug("Saving new hot news item ...");

      //count the amount of hot news items
      HotNewsItem.count({}).then(function(count) {
         var hotNewsItemJSON = req.body.hotNewsItem;

         var hotNewsItem = new HotNewsItem();
         hotNewsItem.title = hotNewsItemJSON.title;
         hotNewsItem.type = hotNewsItemJSON.type;
         hotNewsItem.access = hotNewsItemJSON.access;
         hotNewsItem.order = count + 1;
         hotNewsItem.save(function(err, savedHotNewsItem) {
            if(!err) {
               winston.verbose("New hot news item saved.");
               Utils.sendJSONresponse(res, 200, { message: 'new hot news item saved', id: savedHotNewsItem._id });
            } else {
               winston.error("Error while saving the new hot news item, err = [%s]", err);
               Utils.next(400, err, next);
            }
         });
      }).catch(function(err) {
         winston.error("Error while saving the new hot news item (counting the amount of hot news items), err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined hotNewsItem' });
   }
}

module.exports.editHotNewsItem = function(req, res, next) {
   if(req.body.hotNewsItem) {
      var hotNewsItemJSON = req.body.hotNewsItem;

      HotNewsItem.findById({ _id: hotNewsItemJSON.id }).then( function(hotNewsItem) {
         if(hotNewsItem) {
            var now = new Date();

            hotNewsItem.title = hotNewsItemJSON.title;
            hotNewsItem.type = hotNewsItemJSON.type;
            hotNewsItem.access = hotNewsItemJSON.access;

            winston.debug("Saving hot news item ...");

            hotNewsItem.save(function(err, savedHotNewsItem) {
               if(!err) {
                  winston.verbose("hot news item saved.");
                  Utils.sendJSONresponse(res, 200, { message: 'hot news item saved', id: savedHotNewsItem._id });
               } else {
                  winston.error("Error while saving the hot news item, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'hot news item not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined hotNewsItem' });
   }
}

module.exports.getHotNewsItem = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.hotNewsItemId) {
      var hotNewsItemId = req.params.hotNewsItemId;
      var hotNewsItem = null;
      var order = null;

      HotNewsItem.findById({ _id: HotNewsItemModule.getMongoose().Types.ObjectId(hotNewsItemId) })
                 .then( function(retrivedHotNewsItem) {
         if(retrivedHotNewsItem) {
            var hotNewsItemToSend = {
              'id': retrivedHotNewsItem._id,
              'title' : retrivedHotNewsItem.title,
              'access': retrivedHotNewsItem.access,
              'order': retrivedHotNewsItem.order,
              'type': retrivedHotNewsItem.type
            };
            Utils.sendJSONresponse(res, 200, { "hotNewsItem" : hotNewsItemToSend });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'hot news item not found' });
         }
      }).catch(function(err) {
         winston.error("Error while getting the hot news item, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined hotNewsItem id' });
   }
}

module.exports.getHotNewsItems = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");
   HotNewsItem.find({}).sort({ order: 'asc' }).then(function(hotNewsItems) {
      if(hotNewsItems) {
         var hotNewsItemsToSend = [];
         var i;
         for(i = 0; i < hotNewsItems.length; i++) {
            var hotNewsItemToSend = {
              'id': hotNewsItems[i]._id,
              'title' : hotNewsItems[i].title,
              'access': hotNewsItems[i].access,
              'order': hotNewsItems[i].order,
              'type': hotNewsItems[i].type
           };
           hotNewsItemsToSend.push(hotNewsItemToSend);
         }
         Utils.sendJSONresponse(res, 200, { 'hotNewsItems' : hotNewsItemsToSend });
      } else {
         Utils.sendJSONresponse(res, 200, { 'hotNewsItems' : [] });
      }
   });
}

module.exports.moveHotNewsItemUp = function(req, res, next) {
   if(req.params.hotNewsItemId) {
      var hotNewsItemId = req.params.hotNewsItemId;
      var hotNewsItem = null;
      var order = null;

      HotNewsItem.findById({ _id: HotNewsItemModule.getMongoose().Types.ObjectId(hotNewsItemId) })
                 .then( function(retrivedHotNewsItem) {
         hotNewsItem = retrivedHotNewsItem;
         if (hotNewsItem) {
            order = hotNewsItem.order;
            if(order > 1) {
               //get the upper hotNewsItem
               return HotNewsItem.findOne({ "order" : order - 1 });
            } else {
               return null;
            }
         } else {
            return null;
         }
      }).then(function(aboveHotNewsItem) {
         if(hotNewsItem) {
            if(aboveHotNewsItem) {
               return HotNewsItem.bulkWrite([
                  {
                     updateOne: {
                        filter: { '_id': aboveHotNewsItem._id },
                        update: { 'order': order}
                     },
                 },{
                     updateOne: {
                        filter: { '_id': hotNewsItem._id },
                        update: { 'order': order - 1}
                    }
                 }]);
            } else {
               return 1;
            }
         } else {
            return -1; //sign that the hotNewsItem was not found
         }
      }).then(function(result) {
         if(result === -1) {
            Utils.sendJSONresponse(res, 400, { message: 'hot news item not found' });
         } else if(result === 1) {
            Utils.sendJSONresponse(res, 200, { message: 'the hot news item was kept in the same order' });
         } else {
            Utils.sendJSONresponse(res, 200, { 'message': 'the hot news item was moved up' });
         }
      }).catch(function(err) {
         winston.error("Error while moving the hot news item to up, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined hotNewsItemId' });
   }
}

module.exports.moveHotNewsItemDown = function(req, res, next) {
   if(req.params.hotNewsItemId) {
      var hotNewsItemId = req.params.hotNewsItemId;
      var hotNewsItem = null;
      var order = null;

      HotNewsItem.findById({ _id: HotNewsItemModule.getMongoose().Types.ObjectId(hotNewsItemId) })
                 .then( function(retrivedHotNewsItem) {
         hotNewsItem = retrivedHotNewsItem;
         if (hotNewsItem) {
            order = hotNewsItem.order;
            //get the below hotNewsItem
            return HotNewsItem.findOne({ "order" : order + 1 });
         } else {
            return null;
         }
      }).then(function(belowHotNewsItem) {
         if(hotNewsItem) {
            if(belowHotNewsItem) {
               return HotNewsItem.bulkWrite([
                  {
                     updateOne: {
                        filter: { '_id': belowHotNewsItem._id },
                        update: { 'order': order}
                     },
                 },{
                     updateOne: {
                        filter: { '_id': hotNewsItem._id },
                        update: { 'order': order + 1}
                    }
                 }]);
            } else {
               return 1;
            }
         } else {
            return -1; //sign that the hotNewsItem was not found
         }
      }).then(function(result) {
         if(result === -1) {
            Utils.sendJSONresponse(res, 400, { message: 'hot news item not found' });
         } else if(result === 1) {
            Utils.sendJSONresponse(res, 200, { message: 'the hot news item was kept in the same order' });
         } else {
            Utils.sendJSONresponse(res, 200, { 'message': 'the hot news item was moved down' });
         }
      }).catch(function(err) {
         winston.error("Error while moving the hot news item to up, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined hotNewsItemId' });
   }
}

module.exports.removeHotNewsItem = function(req, res, next) {
   if(req.params.hotNewsItemId) {
      var hotNewsItemId = req.params.hotNewsItemId;

      HotNewsItem.findById({ _id: HotNewsItemModule.getMongoose().Types.ObjectId(hotNewsItemId) })
                 .then(function(hotNewsItemToBeRemoved) {
         if(hotNewsItemToBeRemoved) {
            return hotNewsItemToBeRemoved.remove();
         } else {
            return null;
         }
      }).then(function(removedHotNewsItem) {
         if(removedHotNewsItem) {
            return HotNewsItem.find({ order: { $gt: removedHotNewsItem.order } });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'hot news item not found' });
            return -1; //sign that the hot news item was not found
         }
      }).then(function(hotNewsItemsToBeMoved) {
         if(hotNewsItemsToBeMoved !== -1) { //the hot news item was found
            if(hotNewsItemsToBeMoved) {
               var commands = [];
               hotNewsItemsToBeMoved.forEach(function(hotNewsItemToBeMoved) {
                  commands.push({   'updateOne': {
                                       'filter': { '_id': hotNewsItemToBeMoved._id },
                                       'update': { 'order': hotNewsItemToBeMoved.order - 1 }
                                    }
                                });
               });
               HotNewsItem.bulkWrite(commands);
            }
            winston.verbose("Hot news item removed.");
            Utils.sendJSONresponse(res, 200, { message: 'hot news item removed' });
         }
      }).catch(function(err) {
         winston.error("Error while deleting the hot news item, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined hotNewsItemId' });
   }
}
