/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var UserGroupModule = require('../models/UserGroup.js');
var UserGroup = UserGroupModule.getModel();
var UserModule = require('../models/User.js');
var User = UserModule.getModel();

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/

/*****************************************************************************
********************************* PRIVATE ************************************
******************************************************************************/
var _user;

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/

module.exports.run = async function () {
   console.log("Creating migration user ...");
   return User
          .findOne({username: "migracao"})
          .then(function(puser) {
             if (!puser) {
                var userGroup = new UserGroup();
                userGroup.name = "migracao";
                userGroup.completeName = "Migração";
                userGroup.isRoot = true;
                return userGroup
                         .save()
                         .then(function(savedUserGroup) {
                            var user = new User();
                            user.username = "migracao";
                            user.name = "migracao";
                            user.email = "migracao@camarasorocaba.sp.gov.br";
                            user.setPassword('migracaotestpassword');
                            user.primaryGroup = userGroup;
                            user.creationDate = new Date();
                            user.status = true;
                            return user.save();
                         }).then(function(savedUser) {
                            _user = savedUser;
                            console.log("Migration user created.");
                         });
             } else {
                console.log("User migration already exists.");
                _user = puser;
             }
          });

}

module.exports.getUser = function () {
   return _user;
}
