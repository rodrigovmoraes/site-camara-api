/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var _requestService = require('request-promise');
var config = require('config');
var cachePurgeServiceConfig = config.get("CachePurgeService");

module.exports = function(req, res, next) {
   if (cachePurgeServiceConfig.enabled) {
      _requestService({
         'url': cachePurgeServiceConfig.url,
         method: "GET",
         json: true
      }).then(function(data) {
         winston.debug("PURGE CACHE REQUEST OK MESSAGE= [%s]", data.message);
      }).catch(function(error) {
         winston.debug("PURGE CACHE REQUEST ERROR MESSAGE= [%s]", data.message);
      });
      winston.verbose("PURGE CACHE REQUESTED URL = [%s]", cachePurgeServiceConfig.url);
   }
   next();
}
