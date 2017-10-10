function RequestPromiseMock(pparams) {
   this.data = null;
   this.error = null;
   this.params = null;
}

var handleError = function(requestPromiseMock, error) {
   var errorPrototype = Object.getPrototypeOf(error);
   if(errorPrototype.name && errorPrototype.name === 'AssertionError') {
      throw error;
   }else {
      requestPromiseMock.error = error;
   }
}

RequestPromiseMock.prototype.promise = function() {
   var promiseMock = this;
   return function(pparams) {
      promiseMock.params = pparams;
      return promiseMock;
   };
}

RequestPromiseMock.prototype.then = function(callback) {
   if(this.error === null) {
      try {
         this.data = callback(this.data);
      } catch (e) {
         handleError(this, e);
      }
   }
   return this;
}

RequestPromiseMock.prototype.catch = function(callback) {
   if(this.error !== null) {
      try {
         this.data = callback(this.error);
         this.error = null;
      } catch (e) {
         handleError(this, e);
      }
   }
   return this;
}

RequestPromiseMock.prototype.setData = function(pdata) {
   this.data = pdata;
}

RequestPromiseMock.prototype.getData = function() {
   return this.data;
}

RequestPromiseMock.prototype.setError = function(perror) {
   this.error = perror;
}

RequestPromiseMock.prototype.getError = function() {
   return this.error;
}

RequestPromiseMock.prototype.getParams = function() {
   return this.params;
}

RequestPromiseMock.prototype.flushErrors = function() {
   if(this.error !== null) {
      throw this.error;
   }
}

module.exports = RequestPromiseMock;
