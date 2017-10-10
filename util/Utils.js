/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _unauthorizedErrorName = "UnauthorizedError";
var _unauthorizedErrorMessage = "You don't have permission to access the resource";

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/

//Error handler for functions that are to be used in async.series method.
//This should be done in order to improve error reporting,
//if a function is not surronded by this handler in the async.series method,
//the async will not be able to catch an error thrown by the function

module.exports.handleErrorForAsync = function(fn, resultOnError) {
   if(resultOnError == undefined){
      resultOnError = false;
   }
   return function(done) {
      try{
         fn(done);
      }catch(err){
         done(err, resultOnError);
      }
   }
};

//send a HTTP response like a JSON object
module.exports.sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

//send a HTTP response like a JSON object for an error
module.exports.sendJSONErrorResponse = function(res, status, err) {
  res.status(status);
  var errObject = { 'message': err.message };
  if(err.code){
     errObject['mongoCodeError'] = err.code;
 }
 if (res.app.get('env') === 'development') {
     errObject['error'] = err.toString();
 }
  res.json(errObject);
};

module.exports.next = function(httpStatus, err, next){
   err.status = httpStatus;
   next(err);
}

module.exports.getUnauthorizedErrorName = function() {
   return _unauthorizedErrorName;
}

module.exports.newUnauthorizedError = function() {
   var error = new Error();
   error.name = _unauthorizedErrorName;
   error.message = _unauthorizedErrorMessage
   return error;
}

module.exports.isEqnewUnauthorizedError = function() {
   var error = new Error();
   error.name = _unauthorizedErrorName;
   error.message = _unauthorizedErrorMessage
   return error;
}

module.exports.randomSubArrayFrom = function(arr, max) {
   if(max === undefined){
      max = 10;
   }
   var l = module.exports.random(0, Math.min(max, arr.length));
   var arrCopy = [];
   var i;
   for(i = 0; i < arr.length; i++) {
      arrCopy.push(arr[i]);
   }
   var r = [];
   for(i = 0; i < l; i++) {
      var k = module.exports.random(0, arrCopy.length - 1);
      r.push(arrCopy.splice(k, 1)[0]);
   }

   return r;
};

module.exports.randomFrom = function(arr) {
   var i = Math.floor((Math.random() * arr.length));
   return arr[i];
};

module.exports.pushRandom = function(arr) {
   var i = module.exports.random(0, arr.length - 1);
   return arr.splice(i, 1)[0];
};

module.exports.random = function(rangeStart, rangeEnd) {
   return  Math.floor( Math.random() * (rangeEnd - rangeStart + 1) + rangeStart );
};

module.exports.randomDate = function(ys, ms, ds, ye, me, de) {
   var rdate = new Date( module.exports.random( (new Date(ys,ms,ds)).getTime(),
                                                (new Date(ye,me,de)).getTime()
                                              )
                       );
   rdate.setHours(0);
   rdate.setMinutes(0);
   rdate.setSeconds(0);
   rdate.setMilliseconds(0);
   return rdate;
};

//get the ids from um array of objects
module.exports.collectIds = function(arr) {
   var ids = [];
   if(arr) {
      arr.forEach(function(element) {
         ids.push(element._id);
      });
   }
   return ids;
};

//build a hash indexed by the id from um collection of objects
module.exports.buildHashByIds = function(objects) {
   var hash = {};
   if(objects) {
      objects.forEach(function(element) {
         hash[element._id] = element;
      });
   }

   return hash;
}
