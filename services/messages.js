/*****************************************************************************
/* Define messages which are sent by this API to the clients
*****************************************************************************/
module.exports.invalidCredentials = 'Invalid credentials';
module.exports.allFieldsRequired = 'All fields required';

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/

module.exports.setProp = function(prop) {
   _prop = prop;
}

//prop get
module.exports.getProp = function() {
   return _prop;
}

//module methods
