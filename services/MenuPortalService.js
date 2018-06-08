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
      if(rootMenuItems) {
         var i;
         for(i = 0; i < rootMenuItems.length; i++) {
            var rootMenuItem = rootMenuItems[i];
            var availableNodes = [];
            availableNodes.push(rootMenuItem);

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
                  currentNode.menuItems.forEach(function(child) {
                     availableNodes.push(child);
                  });
               }
            }
         }

         return rootMenuItems;
      } else {
         return {}; //nothing found in the database
      }
   });
}
