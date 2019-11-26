/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var _requestService = require('request-promise');
var config = require('config');
var cachePurgeServiceConfig = config.get("CachePurgeService");
var Utils = require('../util/Utils.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...
//..
//.

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/

//purge cache
module.exports.purgeCache = function(req, res, next) {
   _requestService({
      'url': cachePurgeServiceConfig.url,
      method: "GET",
      json: true
  }).then(function(data) {
      winston.debug("Purge cache request ok, message = [%s]", data.message);
      winston.verbose("Cache purged.");
      Utils.sendJSONresponse(res, 200, { message: 'cache purged' });
  }).catch(function(error) {
     winston.error("Error while purging the cache, err = [%s]", error);
     Utils.next(400, error, next);
  });
};
