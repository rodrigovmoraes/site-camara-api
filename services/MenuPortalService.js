/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var MenuPortalModule = require('../models/MenuPortal.js');
var MenuPortal = MenuPortalModule.getModel();

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getMenuPortalTree = async function() {
   return MenuPortal.find({ isRoot: true })
            .sort("order")
            .then(async function(rootMenuItems) {
      if (rootMenuItems) {
         var rootMenuItemsJson = [];
         var rootMenuItemJson = null;
         var i;
         //store the leaf items of each root menu item
         var leafMenuItemsMap = {};

         for(i = 0; i < rootMenuItems.length; i++) {
            var rootMenuItem = rootMenuItems[i];
            var availableNodes = [];
            availableNodes.push(rootMenuItem);
            if (rootMenuItem) {
               //initialize the array that will store the
               //leaf items of this root item
               //leafs menu items is used to display a hierarchy with maximum depth of two
               //this is util for devices that not support multi level menu
               leafMenuItemsMap[rootMenuItem.id] = [];
            }

            //while it has nodes to be visited
            while(availableNodes.length > 0) {
               //get a node from the list of nodes to be visited
               var currentNode = availableNodes.pop();
               //visit, process the node
               if(currentNode.menuItems && currentNode.menuItems.length > 0) {
                  var j;
                  var nodeChildren = [];
                  for(j = 0; j < currentNode.menuItems.length; j++) {
                     var child;
                     if(currentNode.menuItems[j]) {
                        var child = await new Promise(function(resolve, reject) {
                           MenuPortal.findById(currentNode.menuItems[j].toString())
                                    .then(function(result) {
                                       resolve(result);
                                    }).catch(function(err) {
                                       reject(err);
                                    });
                           });
                     }

                     if(child) {
                        nodeChildren.push(child);
                     }
                  }
                  currentNode.menuItems = nodeChildren;
                  //put the children of the node in the list of nodes
                  //to be visited
                  for(j = currentNode.menuItems.length - 1; j >= 0; j--) {
                     availableNodes.push(currentNode.menuItems[j]);
                  }
               } else {
                  //store the leaf item of the root item
                  leafMenuItemsMap[rootMenuItem.id].push(currentNode);
               }
            }
         }
         for (i = 0; i < rootMenuItems.length; i++) {
            rootMenuItemJson = rootMenuItems[i].toJSON();
            //build the leaf menu items
            //leafs menu items is used to display a hierarchy with maximum depth of two
            //this is util for devices that not support multi level menu
            rootMenuItemJson.leafMenuItems = leafMenuItemsMap[rootMenuItems[i].id];
            rootMenuItemsJson.push(rootMenuItemJson);
         }
         return rootMenuItemsJson;
      } else {
         return {}; //nothing found in the database
      }
   });
}
