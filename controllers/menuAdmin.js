/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var MenuAdminModule = require('../models/MenuAdmin.js');
var MenuAdmin = MenuAdminModule.getModel();
var MenuAdminService = require('../services/MenuAdminService.js');
var UserModule = require('../models/User.js');
var User = UserModule.getModel();
var UserService = require('../services/UserService.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getMenuAdminTree = function(req, res, next) {
   MenuAdminService.getMenuAdminTree()
                   .then(function(rootMenuItems) {
                      Utils.sendJSONresponse(res, 200, {
                          "menuAdminTree" : rootMenuItems
                      });
                   }).catch(function(err) {
                      winston.error("Error while getting menu admin items, err = [%s]", err);
                      Utils.next(400, err, next);
                   });
}

module.exports.saveMenuItem = function(req, res, next) {
   if(req.body.menuItem) {
      var menuItemJSON = req.body.menuItem;

      MenuAdmin.findById(menuItemJSON._id).exec().then(function(menuItem) {
         //check if the group was found
         if(!menuItem) {
            Utils.sendJSONresponse(res, 400, { message: 'menu item not found' });
            return;
         }

         //form data
         menuItem.title = menuItemJSON.title;
         menuItem.sref = menuItemJSON.sref;
         menuItem.role = menuItemJSON.role ? menuItemJSON.role : null;
         menuItem.icon = menuItemJSON.icon;
         menuItem.isRoot = menuItemJSON.isRoot;
         if(menuItemJSON.order !== undefined) {
            menuItem.order =  menuItemJSON.order;
         }
         menuItem.menuItems = menuItemJSON.menuItems;
         winston.debug("Saving the menu item...");

         menuItem.save(function(err) {
            if(!err) {
               winston.verbose("Menu item saved.");
               Utils.sendJSONresponse(res, 200, { message: 'Menu item saved' });
            } else {
               winston.error("Error while saving the menu item, err = [%s]", err);
               Utils.next(400, err, next);
            }
         });
      }).catch(function(err) {
         winston.error("Error while saving the menu item, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined menu item' });
   }
}

module.exports.newMenuItem = function(req, res, next) {
   if(req.body.menuItem) {
      var menuItemJSON = req.body.menuItem;

      var newMenuItem = new MenuAdmin({
         'title': menuItemJSON.title,
         'sref' : menuItemJSON.sref,
         'role' : menuItemJSON.role,
         'icon' : menuItemJSON.icon,
         'isRoot' : menuItemJSON.isRoot,
         'menuItems' : []
      });

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
      }).catch(function(err) {
         winston.error("Error while saving the new menu item, err = [%s]", err);
         Utils.next(400, err, next);
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
            MenuAdmin.findById(rootId).exec().then(function(result) {
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
      return MenuAdmin.bulkWrite(deletes);
   }

   if(req.params.id) {
      var menuItemId = req.params.id;

      MenuAdmin.findById(menuItemId).exec().then(function(menuItem) {
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
            MenuAdmin.bulkWrite(updates).then(function(result) {
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

module.exports.getMenuAdminTreeForLoggedUser = function(req, res, next) {

   var _stripNotAuthorizedMenuItems = function(rootMenuItem, roles) {
      if(rootMenuItem.menuItems) {
         var children = [];
         var i;
         for(i = 0; i < rootMenuItem.menuItems.length; i++) {
            var childMenuItem = rootMenuItem.menuItems[i];

            if(!childMenuItem.role || _.indexOf(roles, childMenuItem.role.name) >= 0 ) {
               var theChildHasChildrenBefore = childMenuItem.menuItems ? childMenuItem.menuItems.length > 0 : false;
               _stripNotAuthorizedMenuItems(childMenuItem, roles);
               var theChildHasChildrenAfter = childMenuItem.menuItems ? childMenuItem.menuItems.length > 0 : false;
               //don´t add items that become without children after the strip process, however
               //items that hasn´t already had children before the strip are added
               if(!theChildHasChildrenBefore || theChildHasChildrenAfter) {
                  children.push(childMenuItem);
               }
            }
         }
         rootMenuItem.menuItems = children;
      }
   }

   if(req.payload) { //check if the user is logged
      var userId = req.payload._id;
      //get user´s roles
      User.findById(userId).then(function(user) {
         if (user) {
            var userRoles = user.extendedRoles;
            if(userRoles) {
               MenuAdminService.getMenuAdminTree()
                               .then(function(rootMenuItems) {
                                  if(rootMenuItems) {
                                     var menuAdminTree = [];
                                     var i;
                                     for(i = 0; i < rootMenuItems.length; i++) {
                                        var rootMenuItem = rootMenuItems[i];

                                        if(!rootMenuItem.role || _.indexOf(userRoles, rootMenuItem.role.name) >= 0 ) {
                                           _stripNotAuthorizedMenuItems(rootMenuItem, userRoles);
                                           menuAdminTree.push(rootMenuItem);
                                        }
                                     }
                                     Utils.sendJSONresponse(res, 200, {
                                         "menuAdminTree" : menuAdminTree
                                     });
                                  } else {
                                     Utils.sendJSONresponse(res, 200, {
                                         "menuAdminTree" : {}
                                     });
                                  }
                               }).catch(function(err) {
                                  winston.error("Error while getting the menu items for logged user, err = [%s]", err);
                                  Utils.next(400, err, next);
                               });
            }
         } else {
            Utils.sendJSONresponse(res, 401, { message: 'access denied' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 401, { message: 'access denied' });
   }
}
