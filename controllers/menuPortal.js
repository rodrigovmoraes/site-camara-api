/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var MenuPortalModule = require('../models/MenuPortal.js');
var MenuPortal = MenuPortalModule.getModel();
var MenuPortalService = require('../services/MenuPortalService.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getMenuPortalTree = function(req, res, next) {
   MenuPortalService.getMenuPortalTree()
                   .then(function(rootMenuItems) {
                      Utils.sendJSONresponse(res, 200, {
                          "menuPortalTree" : rootMenuItems
                      });
                   }).catch(function(err) {
                      winston.error("Error while getting menu items of the portal, err = [%s]", err);
                      Utils.next(400, err, next);
                   });
}

module.exports.saveMenuItem = function(req, res, next) {
   if(req.body.menuItem) {
      var menuItemJSON = req.body.menuItem;

      MenuPortal.findById(menuItemJSON._id).exec().then(function(menuItem) {
         //check if the group was found
         if(!menuItem) {
            Utils.sendJSONresponse(res, 400, { message: 'portal menu item not found' });
            return;
         }

         //form data
         menuItem.title = menuItemJSON.title;
         menuItem.url = menuItemJSON.url;
         menuItem.isRoot = menuItemJSON.isRoot;
         if(menuItemJSON.type) {
            menuItem.type = menuItemJSON.type;
         } else {
            menuItem.type = undefined;
         }
         if(menuItemJSON.access) {
            menuItem.access = menuItemJSON.access;
         } else {
            menuItem.access = undefined;
         }
         if(menuItemJSON.order !== undefined) {
            menuItem.order =  menuItemJSON.order;
         }
         menuItem.menuItems = menuItemJSON.menuItems;
         winston.debug("Saving the menu item...");

         menuItem.save(function(err) {
            if(!err) {
               winston.verbose("Portal menu item saved.");
               Utils.sendJSONresponse(res, 200, { message: 'Portal menu item saved' });
            } else {
               winston.error("Error while saving the portal menu item, err = [%s]", err);
               Utils.next(400, err, next);
            }
         });
      }).catch(function(err) {
         winston.error("Error while saving the portal menu item, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined portal menu item' });
   }
}

module.exports.newMenuItem = function(req, res, next) {
   if(req.body.menuItem) {
      var menuItemJSON = req.body.menuItem;

      var newMenuItem = new MenuPortal({
         'title': menuItemJSON.title,
         'url' : menuItemJSON.url,
         'isRoot' : menuItemJSON.isRoot,
         'menuItems' : []
      });
      if(menuItemJSON.type) {
         newMenuItem.type = menuItemJSON.type;
      }
      if(menuItemJSON.access) {
         newMenuItem.access = menuItemJSON.access;
      }
      winston.debug("Saving the new menu item...");

      newMenuItem.save(function(err, result) {
         if(!err) {
            winston.verbose("Menu item created.");
            Utils.sendJSONresponse(res, 200, { 'message': 'Menu item created.',
                                                'id': result.id
                                             });
         } else {
            winston.error("Error while creating the menu item, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined menu item' });
   }
}

//delete the user group and its children
module.exports.deleteDeeplyMenuItem = function(req, res, next) {

   var collectAndExecuteDeletes = async function(menuItem) {
      var toBeVisited = [];
      var deletes = [];
      //put the root menu item in the list
      //of nodes to be processed
      toBeVisited.push(menuItem._id);

      while(toBeVisited.length > 0) { //there are still nodes to be processed
         var rootId = toBeVisited.pop();

         var rootNode = await new Promise(function(resolve, reject) {
            MenuPortal.findById(rootId).exec().then(function(result) {
               resolve(result);
            }).catch(function(err){
               reject(err);
            });
         });

         //visit
         var children = rootNode.menuItems;

         deletes.push( { deleteOne: {
                          filter: { '_id':  rootId }
                       }
                     });
         //mark the children to be processed
         if(rootNode.menuItems) {
            rootNode.menuItems.forEach(function(menuItemChildId) {
               toBeVisited.push(menuItemChildId);
            });
         }
      }

      //execute the deletes
      return MenuPortal.bulkWrite(deletes);
   }

   if(req.params.id) {
      var menuItemId = req.params.id;

      MenuPortal.findById(menuItemId).exec().then(function(menuItem) {
         //check if the menu item was found
         if(!menuItem) {
            throw new Error("menu item not found");
         }

         //execute a breadth first search collecting the updates in the tree
         return collectAndExecuteDeletes(menuItem);
      }).then(function(result) {
         winston.verbose("Menu item deleted");
         Utils.sendJSONresponse(res, 200, { message: 'Menu item deleted' });
      }).catch(function(err) {
         winston.error("Error while deleting the menu item, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined menu item' });
   }
}

module.exports.updateMenuItemsOrders = function(req, res, next) {
   if(req.body.menuItemsOrders) {
      var menuItemsOrders = req.body.menuItemsOrders;
      if(menuItemsOrders) {
         var updates = [];
         menuItemsOrders.forEach(function(menuItemOrder) {
            updates.push({ updateOne: {
                             filter: { '_id':  menuItemOrder._id },
                             update: {
                                order: menuItemOrder.order
                             }
                           }
                        });
         });
         //execute the updates
         if(updates.length > 0){
            MenuPortal.bulkWrite(updates).then(function(result) {
               winston.verbose("Menu items orders updated");
               Utils.sendJSONresponse(res, 200, { message: 'Menu items orders updated' });
            }).catch(function(err) {
               winston.error("Error while  updating menu items orders, err = [%s]", err);
               Utils.next(400, err, next);
            });
         } else {
            winston.verbose("Menu items orders updated");
            Utils.sendJSONresponse(res, 200, { message: 'Menu items orders updated' });
         }
      }

   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined menu items orders' });
   }
}
