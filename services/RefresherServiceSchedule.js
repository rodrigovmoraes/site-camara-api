/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var winston = require('winston');
var config = require('config');
var cachePurgeServiceConfig = config.get("CachePurgeService");
var Utils = require('../util/Utils.js');
var _requestService = require('request-promise');
var nodeSchedule = require('node-schedule');

/*****************************************************************************
********************************** CONFIG ************************************
******************************************************************************/
var camaraApiConfig = config.get("CamaraApi");

var _getRefreshTasks = function() {
   return cachePurgeServiceConfig.refreshSchedule;
}

var _refresh = async function() {
   winston.verbose("REFRESH CACHE REQUESTED BY SCHEDULE, URL = [%s]", cachePurgeServiceConfig.refreshUrl);
   return _requestService({
      'url': cachePurgeServiceConfig.refreshUrl,
      method: "GET",
      headers: {
        'Purge-Content': '1'
      }
   }).then(async function(result) {
      winston.verbose("REFRESH CACHE REQUEST OK");
   }).catch(function(error) {
      winston.error("REFRESH CACHE REQUEST ERROR MESSAGE= [%s]", error.message);
   });
}

module.exports.scheduleAllRefresherTasks = function() {
   var schedule = _getRefreshTasks();

   if (cachePurgeServiceConfig.refreshEnable && cachePurgeServiceConfig.refreshScheduleEnable) {
      if (schedule && schedule.length > 0) {
         var k;
         for (k = 0; k < schedule.length; k++) {
            nodeSchedule.scheduleJob(schedule[k], _refresh);
         }
      }
   }
}
