/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var winston = require('winston');
var config = require('config');

/*****************************************************************************
********************************** CONFIG ************************************
******************************************************************************/
var camaraApiConfig = config.get("CamaraApi");
var jobs = require('../jobs.js');

/*****************************************************************************
*********************************** PRIVATE ***********************************
******************************************************************************/
var _validateQueue = function(pqueue, callback) {
   if(!pqueue) {
      callback({ message: 'Queue jobs was not created.' });
      return false;
   } else {
      return true;
   }
}

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.resizeImage = function(s3Path, width, height, callback) {
   var queue = jobs.getQueue();
   if(!_validateQueue(queue, callback)) {
      return;
   }
   var job = queue.create('imageProcessingResize', {
               's3Path': s3Path,
               'width': width,
               'height' : height
             }).attempts(2).save();
   //job completed
   job.on('complete', function(result) {
      callback(null);
   });
   //job error
   job.on('failed', function(err) {
      callback(err);
   });

}
