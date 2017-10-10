var Util = require('../util/Utils.js');

module.exports = function(req, res) {
      console.log("TEST CONTROLLER CALLED");
      Util.sendJSONresponse(res, 200, {
        "message" : "Message from test controller"
      });
}
