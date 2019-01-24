/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var LegislativePropositionRelationshipTypeModule = require('../models/LegislativePropositionRelationshipType.js');
var LegislativePropositionRelationshipType = LegislativePropositionRelationshipTypeModule.getModel();
var Utils = require('../util/Utils.js');
var _ = require('lodash');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...
//..
//.

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
module.exports.getLegislativePropositionRelationshipTypes = function(req, res, next) {
   LegislativePropositionRelationshipType.find({}).then(function(legislativePropositionRelationshipTypes) {
      Utils.sendJSONresponse(res, 200, {
         'legislativePropositionRelationshipTypes' : legislativePropositionRelationshipTypes
      });
   }).catch(function(err) {
      winston.error("Error while getting legislative proposition relationship types, err = [%s]", err);
      Utils.next(400, err, next);
   });
}
