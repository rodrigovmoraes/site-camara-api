/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var LegislativePropositionModule = require('../models/LegislativeProposition.js');
var LegislativeProposition = LegislativePropositionModule.getModel();
var LegislativePropositionTypeModule = require('../models/LegislativePropositionType.js');
var LegislativePropositionType = LegislativePropositionTypeModule.getModel();
var LegislativePropositionRelationshipTypeModule = require('../models/LegislativePropositionRelationshipType.js');
var LegislativePropositionRelationshipType = LegislativePropositionRelationshipTypeModule.getModel();

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//compare a relationship in JSON format and other from mongodb
//-1 relationshipA is less than relationshipB
//0 relationshipA is equal to relationshipB
//1 relationshipA greater than relationshipB
var _compareRelationships = function (relationshipA, relationshipB) {
   if (relationshipB && relationshipA && relationshipB.type &&
          relationshipB.otherLegislativeProposition && relationshipA.type &&
                 relationshipA.otherLegislativeProposition ) {
      var typeCmp = relationshipA.type.localeCompare(relationshipB.type);
      if (!typeCmp) {
         return relationshipA.otherLegislativeProposition.localeCompare(relationshipB.otherLegislativeProposition);
      } else {
         return typeCmp;
      }
   } else {
      return NaN;
   }
}

//compare the list of relationships  with other
//return the difference, all itens in the first list
//and not in the second
var _calcDiffRelationships = function(relationshipsA, relationshipsB) {
   var _toJSON = function (it) {
      return {
         "type": it.type
               ? ( typeof(it.type) === "string"
                    ? it.type
                    : it.type.toString()
                 )
               : "" ,
         "otherLegislativeProposition": it.otherLegislativeProposition
                                      ? (  typeof(it.otherLegislativeProposition) === "string"
                                           ? it.otherLegislativeProposition
                                           : it.otherLegislativeProposition.toString()
                                        )
                                      : ""
      }
   }
   var pRelationshipsA = _.map(relationshipsA, _toJSON);
   var prelationshipsB = _.map(relationshipsB, _toJSON);
   //order
   var sortedRelationshipsA = _.orderBy(pRelationshipsA, ['type', 'otherLegislativeProposition']);
   var sortedRelationshipsB = _.orderBy(prelationshipsB, ['type', 'otherLegislativeProposition']);
   var diff = [];
   var relationshipDb = null, relationshipJSON = null;
   var i = 0, j = 0, cmp = 0;

   while (i < sortedRelationshipsA.length || j < sortedRelationshipsB.length) {
      relationshipA = i < sortedRelationshipsA.length ? sortedRelationshipsA[i] : null;
      relationshipB = j < sortedRelationshipsB.length ? sortedRelationshipsB[j] : null;
      cmp = _compareRelationships(relationshipA, relationshipB);
      if (isNaN(cmp)) {
         if (relationshipA == null) {
            cmp = 1;
         } else if (relationshipB == null) {
            cmp = -1
         } else {
            break;
         }
      }
      if (cmp < 0) {
         i++;
         diff.push(relationshipA);
      } else if (cmp > 0) {
         j++;
      } else {
         i++;
         j++;
      }
   }

   return diff;
}

//save the relationships of legislative proposition
var _addReverseRelationships = async function (legislativePropositionId, relationships) {
   //return a promise to process a relationship in the array
   //relationships
   var _getAddReverseRelationshipPromise = function(relationship, lpId) {
      return LegislativeProposition
               .findById({ _id: relationship.otherLegislativeProposition })
               .then(function(legislativeProposition) {
                  return LegislativePropositionRelationshipType
                                    .findById({ _id:relationship.type })
                                    .then(function(legislativePropositionRelationshipType) {
                                       legislativeProposition.relationships.push({
                                          type: legislativePropositionRelationshipType.antonym,
                                          otherLegislativeProposition: lpId
                                       });
                                       return legislativeProposition.save();
                                    });
               });
   }
   var i;
   var p = [];
   if (relationships) {
      //array of process in order to process the items in
      //relationships
      for (i = 0; i < relationships.length; i++) {
         p.push(_getAddReverseRelationshipPromise(relationships[i], legislativePropositionId));
      }
      return Promise.all(p);
   } else {
      return Promise.resolve(true);
   }
}

//remove the relationships of legislative proposition
var _removeReverseRelationships = async function (legislativePropositionId, relationships) {
   //return a promise to process a relationship in the array
   //relationships
   var _getRemoveReverseRelationshipPromise = function(relationship, lpId) {
      return LegislativeProposition
               .findById({ _id: relationship.otherLegislativeProposition })
               .then(function(legislativeProposition) {
                  return LegislativePropositionRelationshipType
                                    .findById({ _id: relationship.type })
                                    .then(function(legislativePropositionRelationshipType) {
                                       var i;
                                       var newRelationshipsList = [];
                                       for (i = 0; i < legislativeProposition.relationships.length; i++) {
                                          if ( legislativeProposition.relationships[i].otherLegislativeProposition.toString() !== lpId.toString() ||
                                               legislativeProposition.relationships[i].type.toString() !== legislativePropositionRelationshipType.antonym.toString()
                                             )
                                          {
                                             newRelationshipsList.push(legislativeProposition.relationships[i]);
                                          }
                                       }
                                       legislativeProposition.relationships = newRelationshipsList;
                                       return legislativeProposition.save();
                                    });
               });
   }
   var i;
   var p = [];
   if (relationships) {
      //array of process in order to process the items in
      //relationships
      for (i = 0; i < relationships.length; i++) {
         p.push(_getRemoveReverseRelationshipPromise(relationships[i], legislativePropositionId));
      }
      return Promise.all(p);
   } else {
      return Promise.resolve(true);
   }
}

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.addReverseRelationships = _addReverseRelationships;
module.exports.removeReverseRelationships = _removeReverseRelationships;
module.exports.calcDiffRelationships = _calcDiffRelationships;
