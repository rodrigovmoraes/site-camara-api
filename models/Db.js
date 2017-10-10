/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var _connection;
var _mongoose;
var _useMock = false;

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//url db connection
var _dbURI;

//util function to close the connection
var _gracefulShutdown = function(msg, callback) {
    _mongoose.connection.close(function() {
        winston.verbose('Mongoose disconnected through %s', msg);
        callback();
    });
};
//util function to set connection event handlers
var _setConnectionEventHandlers = function(connection) {
   // CONNECTION EVENTS
   connection.on('connected', function() {
      winston.verbose('Mongoose connected to %s', _dbURI);
   });
   connection.on('error', function(err) {
      winston.error('Mongoose connection error: ' + err);
   });
   connection.on('disconnected', function() {
      winston.verbose('Mongoose disconnected');
   });
}

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module properties, set and gets

//DbURI
module.exports.setDbURI = function(dbURI) {
   _dbURI = dbURI;
}

//set the application to use a memory mondodb(volatile) for testing purposes
module.exports.useMock = function(useMock) {
   _useMock = useMock;
}

//module methods

//connect to database, the callback funcion accept a mongoose
//instance and a connection instance
module.exports.connect = function(callback) {
   if(_connection === undefined)   {
      var Mongoose =  require('mongoose').Mongoose;
      _mongoose = new Mongoose();

      if(_useMock) {
         //if the mock is actived, create a mongoose mock instance
         var Mockgoose = require('mockgoose').Mockgoose;
         var _mockgoose = new Mockgoose(_mongoose);

         _mockgoose.prepareStorage().then( function() {
            winston.debug('Processsing Mockgoose configuration ...');
            var _connection = _mongoose.createConnection(_dbURI);
            winston.debug('Mockgoose is ready: %s', _dbURI);
            _setConnectionEventHandlers(_connection);
            callback(_mongoose, _connection);
         });
      } else {
         winston.debug("Connecting to mongodb, _dbURI = [%s]", _dbURI);
         var _connection = _mongoose.createConnection(_dbURI);
         _setConnectionEventHandlers(_connection);
         callback(_mongoose, _connection);
      }
   }else{
      callback(_mongoose, _connection);
   }
}

// For nodemon restarts
process.once('SIGUSR2', function() {
    _gracefulShutdown('nodemon restart', function() {
        process.kill(process.pid, 'SIGUSR2');
    });
});
// For app termination
process.on('SIGINT', function() {
    _gracefulShutdown('app termination', function() {
        process.exit(0);
    });
});
// For Heroku app termination
process.on('SIGTERM', function() {
    _gracefulShutdown('Heroku app termination', function() {
        process.exit(0);
    });
});
