/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var passport = require('passport');
var UserModule = require('../models/User.js');
var User = UserModule.getModel();
var LocalStrategy = require('passport-local').Strategy;
var Util = require('../util/Utils.js');
var winston = require('winston');
var messages = require('../services/messages.js');
var UserService = require('../services/UserService.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//config the passport framework
//this method must be executed by app init script (app.js) before
//the router configuration
module.exports.config = function() {
   passport.use(new LocalStrategy({
       usernameField: 'username'
     },
     function(username, password, done) {
       User.findOne({ 'username': username }, function (err, user) {
          if (err) { //something is wrong with db server
             return done(err);
          } else if (!user) { //invalid credentials, user not found
             return done(null,
                         false,
                         { message: messages.invalidCredentials });
          } else if (!user.validPassword(password) || !user.status) {
             //invalid credentials,
             //password error
             return done(null,
                         false,
                         { message:  messages.invalidCredentials });
          } else {
             return done(null, user);
          }
     });
   }));
}

//login process controller
module.exports.loginController = function(req, res) {
  if(!req.body.username || !req.body.password) {
    Util.sendJSONresponse(res, 400, {
      "message":  messages.allFieldsRequired
    });
    return;
  }

  passport.authenticate('local', function(err, user, info){
    var token;

    if (err) {
      //unforeseen error
      //server error, database error or something else
      winston.error("Server error during login process: " + err.message);
      Util.sendJSONErrorResponse(res, 500, err);
      return;
   } else if (user) {
      //ok
      //generate the jwt token and give it to the client
      token = user.generateJwt();
      Util.sendJSONresponse(res, 200, { "token" : token });
      //save calculated roles for future security queries
      UserService.getRolesFromUser(user._id).then(function(roles) {
         user.extendedRoles = roles;
         user.save().catch(function(err) {
            winston.error("Server error while saving roles of the user for future security queries: " + err.message);
         });
      }).catch(function(err) {
         winston.error("Server error while getting roles of the user for future security queries: " + err.message);
      });
    } else {
      //invalid credentials
      Util.sendJSONresponse(res, 401, info);
    }
  })(req, res);
};
