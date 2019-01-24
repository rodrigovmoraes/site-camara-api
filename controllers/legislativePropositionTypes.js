/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var LegislativePropositionTypeModule = require('../models/LegislativePropositionType.js');
var LegislativePropositionType = LegislativePropositionTypeModule.getModel();
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
module.exports.getLegislativePropositionTypes = function(req, res, next) {
   LegislativePropositionType.find({}).then(function(legislativePropositionTypes) {
      Utils.sendJSONresponse(res, 200, {
         'legislativePropositionTypes' : legislativePropositionTypes
      });
   }).catch(function(err) {
      winston.error("Error while getting legislative proposition types, err = [%s]", err);
      Utils.next(400, err, next);
   });
}
