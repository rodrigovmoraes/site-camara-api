/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var _ = require("lodash");
var async = require('async');

/*****************************************************************************
******************************* PRIVATE **************************************
*****************************************************************************/

//filtering
//convert paginationOptions.filtering to an object that can be used as
//argument of the find method
//paginationOptions.filtering is an array and it must be converted to a object
//(array elements to object properties)
var _filtering = function(paginationOptions) {
   var filtering = {};
   if(paginationOptions.filtering){
      var arrFiltering = paginationOptions.filtering;
      arrFiltering.forEach(function(filter){
         if( filter.filterType &&
             filter.filterType === 'select' &&
             filter.term !== null &&
             filter.term !== '' ) {
            filtering[filter.field] = filter.term;
         }else if( filter.type &&
                   filter.type === 'date' &&
                   filter.term !== null){
            var arrTerm = filter.term;
            var dateFilterObject = {};
            var dateFiltering = false;
            if(arrTerm[0]){
               dateFilterObject['$gte'] = arrTerm[0];
               dateFiltering = true;
            }
            if(arrTerm[1]){
               dateFilterObject['$lte'] = arrTerm[1];
               dateFiltering = true;
            }
            if(dateFiltering) {
               filtering[filter.field] = dateFilterObject;
            }
         }else if(filter.term !== null && filter.term !== ''){
            filtering[filter.field] = new RegExp("^" + filter.term, "i");
         }
      });
   }
   return filtering;
}

var _sorting = function(paginationOptions) {
   var sortingObject = {};
   if(paginationOptions.sortColumns){
      var arrSorting = paginationOptions.sortColumns;
      arrSorting = _.sortBy(arrSorting, ['priority']);
      arrSorting.forEach(function(sorting){
         sortingObject[sorting.field] = sorting.direction;
      });
   }
   return sortingObject;
}

var _pagination = function(paginationOptions) {
   var skip = 0;
   var limit = 10;
   if(paginationOptions && paginationOptions.pageNumber && paginationOptions.pageSize){
      skip = (paginationOptions.pageNumber - 1) * paginationOptions.pageSize;
      limit = paginationOptions.pageSize;
   }
   return { 'skip': skip,
            'limit': limit
          }
}

var _getUniqueValuesOfTheField = function(DataModel, fieldObject){
   return function(callback) {
      var match = {'$match' : { '$and' : [{}, {}, {}] }};
      match['$match']['$and'][0][fieldObject.field] = { $exists: true };
      match['$match']['$and'][1][fieldObject.field] = { $not: { $eq: '' } };
      match['$match']['$and'][2][fieldObject.field] = { $not: { $type: 'null' } };
      //get unique values of the desired field
      DataModel.aggregate([ match, { $group: { '_id': '$' + fieldObject.field } } ],
         function (err, elements) {
            if(!err){
               var values = _.map(elements, function(element) {
                                               return {
                                                         value: element._id,
                                                         label: element._id
                                                       }
                                            }
                            );
               if(fieldObject.ref){
                  DataModel.db.model(fieldObject.ref)
                              .populate( values,
                                         { 'path': 'label',
                                           'model': fieldObject.ref,
                                           'select': fieldObject.descriptionField
                                         })
                              .then(function(populatedValues) {
                                 var rValues = [];
                                 populatedValues.forEach(function(populatedValue) {
                                    if(populatedValue.label){
                                       rValues.push({value: populatedValue.value, label: populatedValue.label[fieldObject.descriptionField]})
                                    }
                                 });
                                 callback( null, { 'field': fieldObject.field,
                                                    'values': _.sortBy(rValues, 'label')
                                                 }
                                         );
                              }).catch(function(err){
                                 callback(err);
                              });
               } else {
                  callback( null, { 'field': fieldObject.field,
                                    'values': values
                                  }
                          );
               }
            } else {
               callback(err);
            }
         }
      );
   }
}

var _getUniqueValuesOfTheFields = function(DataModel, querySelectFields, callback) {
   //get unique values for fields with filters of type select
   async.series(   _.map( querySelectFields,  function(field) {
                                return _getUniqueValuesOfTheField(DataModel, field);
                        }),
                  //callback: after queue of sequential tasks
                  function(err, selectFilters) {
                     callback(err, selectFilters);
                  }
               );

}

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/

//module methods

//*getDataGrid
//
// handle request from a Angular Grid UI, handle filtering, sorting and pagination
// Example of use:
/*

var UserQuery = User.find({}).select("status creationDate primaryGroup email name username");
var querySelectFields = [ "primaryGroup", "status" ];

ServerGridUtils.getDataGrid(User, UserQuery, querySelectFields, req, res, next, function(data, count, selectFilters){
   Utils.sendJSONresponse(res, 200, {
       "users" : data,
       "totalLength" : count,
       "selectFilters" : selectFilters
   });
});

The method acccept an object in the request body which set the options for filtering,
sorting and pagination. Below, an example of this object follows:

    req.body.paginationOptions = '{
       "pageNumber": 3,
       "pageSize": 10,
       "sortColumns": null,
       "filtering": [
          {
             "field": "username",
             "type": "string",
             "term": "user",
             "filterType": "ordinary"
          },
          {
             "field": "primaryGroup",
             "type": "string",
             "term": "group4",
             "filterType":  "select"
          },
          {
             "field": "creationDate",
             "type": "date",
             "term":[
                "2010-05-05T03:00:00.000Z",
                "2015-06-05T03:00:00.000Z"
             ],
             "filterType": "ordinary"
          },
          {
             "field": "status",
             "type": "string",
             "term": "Ativo",
             "filterType": "select"
          }
       ]
    }'

*/
module.exports.getDataGrid = function(DataModel, InitialQuery, querySelectFields, req, res, next, callback) {
   var count = 0;
   var paginationOptions = req.body.paginationOptions ? JSON.parse(req.body.paginationOptions) : null;

   //filtering
   //convert paginationOptions.filtering to an object that can be used as
   //argument of the find method
   //paginationOptions.filtering is an array and it must be converted to a object (array elements to object properties)
   var filtering = _filtering(paginationOptions);

   //sorting
   var sortingObject = _sorting(paginationOptions);

   //pagination
   var page = _pagination(paginationOptions);

   //count total THEN apply filters THEN apply sorting THEN apply pagination THEN get unique values of the
   //fields for filters (for select options in the grid at the client-side)
   InitialQuery.count(filtering).exec().then(function(result){
      count = result;
      return InitialQuery.find(filtering).sort(sortingObject).skip(page.skip).limit(page.limit).exec();
   }).then(function (data) {
         var selectFilters = [];
         // querySelectFields is an array of strings which contains the fields
         // that have to be retrived to populate filters arguments with select options (combox) in the grid at the client-side
         if(!querySelectFields) querySelectFields = [];

         _getUniqueValuesOfTheFields(DataModel, querySelectFields, function(err, selectFilters){ /*then*/
            if (!err) {
               callback(data, count, selectFilters);
            } else {
               if(next !== undefined){
                  next(err);
               }
            }
         });
   }).catch(function(err){
      if(next !== undefined){
         next(err);
      }
   });
}
