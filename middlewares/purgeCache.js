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
      winston.verbose("PURGE CACHE REQUESTED URL = [%s]", cachePurgeServiceConfig.url);
      _requestService({
         'url': cachePurgeServiceConfig.url,
         method: "GET",
         json: true
      }).then(function(data) {
         winston.debug("PURGE CACHE REQUEST OK MESSAGE= [%s]", data.message);
         if (cachePurgeServiceConfig.refreshEnable) {
            setTimeout(function() {
               winston.debug("REFRESH CACHE REQUESTED URL = [%s]", cachePurgeServiceConfig.refreshUrl);
               return _requestService({
                  'url': cachePurgeServiceConfig.refreshUrl,
                  method: "GET",
                  headers: {
                    'Purge-Content': '1'
                  }
               });
            }, cachePurgeServiceConfig.refreshDelay);
         }
      }).catch(function(error) {
         winston.error("PURGE CACHE REQUEST ERROR MESSAGE= [%s]", error.message);
      });
   }
   next();
}
