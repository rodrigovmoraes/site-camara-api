/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var winston = require('winston');
var config = require('config');
var Utils = require('../util/Utils.js');
var _requestService = require('request-promise');

/*****************************************************************************
********************************** CONFIG ************************************
******************************************************************************/
var camaraApiConfig = config.get("CamaraApi");
var googleCalendarConfig = camaraApiConfig.GoogleCalendarService;
var weekdayDescriptions = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/*****************************************************************************
*********************************** PRIVATE ***********************************
******************************************************************************/
var _extractAllDay = function(dateField) {
      if (dateField.date) {
         return true;
      } else {
         return false;
      }
}

var _extractDateDescription = function(dateField) {
   if (dateField.date) {
      var parts = dateField.date.split('-');
      if(parts.length === 3) {
         return parts[2] + "/" + parts[1] + "/" + parts[0];
      } else {
         return "invalid date";
      }
   } else if (dateField.dateTime) {
      var dateTime = new Date(dateField.dateTime);
      return Utils.dateToDDMMYYYY(dateTime);
   } else {
      return "";
   }
}

var _extractWeekDescription = function(dateField) {
      if (dateField.date) {
         var parts = dateField.date.split('-');
         if(parts.length === 3) {
            var year = parseInt(parts[0]);
            var month = parseInt(parts[1]);
            var day = parseInt(parts[2]);
            var date = new Date(year, month, day);
            return weekdayDescriptions[date.getDay()];
         } else {
            return "invalid date";
         }
      } else if (dateField.dateTime) {
         var dateTime = new Date(dateField.dateTime);
         return weekdayDescriptions[dateTime.getDay()];
      } else {
         return "";
      }
}

var _extractDate = function(dateField) {
      if (dateField.date) {
         return dateField.date;
      } else if (dateField.dateTime) {
         var dateTime = new Date(dateField.dateTime);
         return Utils.dateToYYYYMMDD(dateTime);
      } else {
         return "";
      }
}

var _extractTime = function(dateField) {
      if (dateField.date) {
         return "dia inteiro";
      } else if (dateField.dateTime) {
         return dateField.dateTime.substr(11, 5).replace(":", "h");
      } else {
         return "";
      }
}

//extract date from start and end fields from calendar api
var _extractDateFullCalendarFormat = function(dateField) {
   if(dateField) {
      if(dateField.date) {
         return {
           date: dateField.date,
           allDay: true
         }
      } else if(dateField.dateTime) {
         return {
           date: dateField.dateTime,
           allDay: false
         }
      } else {
         return null;
      }
   } else {
       return null;
   }
}

var _extractResult = function(resultItem, isFullCalendarFormat) {
      if(!isFullCalendarFormat) {
         return {
            id: resultItem.id,
            all_day: _extractAllDay(resultItem.start),
            start_date: _extractDate(resultItem.start),
            start_date_description: _extractDateDescription(resultItem.start),
            start_time_description: _extractTime(resultItem.start),
            start_weekday_description: _extractWeekDescription(resultItem.start),
            end_date: _extractDate(resultItem.end),
            end_date_description: _extractDateDescription(resultItem.end),
            end_time_description: _extractTime(resultItem.end),
            end_weekday_description: _extractWeekDescription(resultItem.end),
            title: resultItem.summary,
            place: resultItem.location ?   resultItem.location : null,
            description: resultItem.description ? resultItem.description : null,
         }
      } else {
         return {
            id: resultItem.id,
            start: _extractDateFullCalendarFormat(resultItem.start).date,
            end: _extractDateFullCalendarFormat(resultItem.end).date,
            title: resultItem.summary,
            allDay: _extractDateFullCalendarFormat(resultItem.start).allDay
         }
      }
}

var _getEvents = function (pageToken, isFullCalendarFormat) {
   var url = googleCalendarConfig.baseUrl + googleCalendarConfig.listEventsMethod.replace("{calendarId}", googleCalendarConfig.calendarId);

   return _requestService({
      'url': url,
      method: "GET",
      json: true,
      qs: {
         key: googleCalendarConfig.apiKey,
         calendarId: googleCalendarConfig.calendarId,
         'pageToken': pageToken
      }
   }).then(function(result) {
      //get the first page
      var events = [];
      if(result &&  result.items) {
         var items = result.items;
         var i;
         for(i = 0; i < items.length; i++) {
            var resultItem = items[i];
            events.push(_extractResult(resultItem, isFullCalendarFormat));
         }
         return { 'nextPageToken': events.length > 0 && result.nextPageToken ? result.nextPageToken : null,
                  'items': events };
      } else {
         return { 'nextPageToken': null,
                  'items': [] };
      }
   });
}

/*****************************************************************************
**************************  Module functions *********************************
/*****************************************************************************/
module.exports.getEvents = function(minDate, maxDate, fullCalendarFormat) {
   var isFullCalendarFormat = fullCalendarFormat ? fullCalendarFormat : false;
   var url = googleCalendarConfig.baseUrl + googleCalendarConfig.listEventsMethod.replace("{calendarId}", googleCalendarConfig.calendarId);
   var qs = {
      key: googleCalendarConfig.apiKey,
      timeZone: googleCalendarConfig.timeZone,
      calendarId: googleCalendarConfig.calendarId,
      singleEvents: true,
      orderBy: 'startTime'
   };
   //set date range
   if(minDate) {
      qs['timeMin'] = minDate;
   }
   if(maxDate) {
      qs['timeMax'] = maxDate;
   }
   //make the http request
   return _requestService({
      'url': url,
      method: "GET",
      json: true,
      'qs': qs
   }).then(async function(result) {
      //get the first page
      var events = [];
      if(result && result.items) {
         var items = result.items;
         var i;
         for(i = 0; i < items.length; i++) {
            var resultItem = items[i];
            events.push(_extractResult(resultItem, isFullCalendarFormat));
         }
         //get next pages
         var next = result ? result.nextPageToken : null;
         while(next) {
            var result = await _getEvents(next);
            next = result.nextPageToken;
            var i;
            for(i = 0; i < result.items.length; i++) {
                 var resultItem = result.items[i];
                 events.push(resultItem);
            }
         }
         return events;
      } else {
         return [];
      }
   });
}

module.exports.getEvent = function(eventId, fullCalendarFormat) {
   var isFullCalendarFormat = fullCalendarFormat ? fullCalendarFormat : false;
   var url = googleCalendarConfig.baseUrl +
               googleCalendarConfig
                  .getEventMethod
                  .replace("{calendarId}", googleCalendarConfig.calendarId)
                  .replace("{eventId}", eventId);
   var qs = {
      key: googleCalendarConfig.apiKey,
      timeZone: googleCalendarConfig.timeZone,
      calendarId: googleCalendarConfig.calendarId
   };
   //make the http request
   return _requestService({
      'url': url,
      method: "GET",
      json: true,
      'qs': qs
   }).then(async function(event) {
      if(event) {
         return _extractResult(event, isFullCalendarFormat);
      } else {
         return null;
      }
   });
}
