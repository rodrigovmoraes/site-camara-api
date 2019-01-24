/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var config = require('config');
var GoogleCalendarService = require('../services/GoogleCalendarService.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getEvents = function(req, res, next) {
   var unlimitedMinDate = req.query.unlimitedMinDate ? req.query.unlimitedMinDate === 'true' : false;
   var unlimitedMaxDate = req.query.unlimitedMaxDate ? req.query.unlimitedMaxDate === 'true' : false;
   var fullCalendarFormat = req.query.fullCalendarFormat ? req.query.fullCalendarFormat === 'true' : false;
   var minDate;
   var maxDate;
   if(!unlimitedMinDate) {
      minDate = req.query.minDate ?
                     req.query.minDate :
                     Utils.getDateSomeMonthsBeforeFromNow(config.CamaraApi.GoogleCalendarService.utcOffset, 3);
   } else {
      minDate = null;
   }

   if(!unlimitedMaxDate) {
      maxDate = req.query.maxDate ?
                    req.query.maxDate :
                    Utils.getDateSomeMonthsAfterFromNow(config.CamaraApi.GoogleCalendarService.utcOffset, 3);
   } else {
      maxDate = null;
   }
   GoogleCalendarService
         .getEvents(minDate, maxDate, fullCalendarFormat)
         .then(function(events) {
            Utils.sendJSONresponse(res, 200, { "events" : events });
         }).catch(function(err) {
            winston.error("Error while getting the events from Google Calendar API, err = [%s]", err);
            Utils.next(400, err, next);
         });
}

module.exports.getEvent = function(req, res, next) {
   if(req.query.id) {
      var eventId = req.query.id;
      var fullCalendarFormat = req.query.fullCalendarFormat ? req.query.fullCalendarFormat === 'true' : false;

      GoogleCalendarService
            .getEvent(eventId, fullCalendarFormat)
            .then(function(event) {
               Utils.sendJSONresponse(res, 200, { "event" : event });
            }).catch(function(err) {
               winston.error("Error while getting the an event from Google Calendar API, err = [%s]", err);
               Utils.next(400, err, next);
            });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined event calendar id' });
   }
}
