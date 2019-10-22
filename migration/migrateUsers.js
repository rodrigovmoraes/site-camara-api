/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var config = require('config');
var winston = require('winston');
var _ = require('lodash');
var MySQLDatabase = require('./MySQLDatabase');
var UserGroupModule = require('../models/UserGroup.js');
var UserGroup = UserGroupModule.getModel();
var UserModule = require('../models/User.js');
var User = UserModule.getModel();
var migrateUserGroupScript = require('./migrateUserGroup');

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');

//query to get users associtated with profile description
/* SELECT user.str_login,
       user.str_senha,
       perfil.cod_perfil,
       perfil.desc_perfil
FROM   tb_usuario user,
       tb_perfil  perfil
WHERE  user.cod_perfil = perfil.cod_perfil */
var queryGetUsers  =  "SELECT str_login, " +
                      "       str_senha, " +
                      "       cod_perfil " +
                      "FROM   tb_usuario; ";
/*****************************************************************************/

//*****************************************************************************
var _migrate = async function(users) {
   var userGroup = new UserGroup();
   userGroup.name = "grupoinicial";
   userGroup.completeName = "Grupo Inicial de Migração";
   userGroup.isRoot = true;
   return userGroup
            .save()
            .then(async function(savedUserGroup) {
               try {
                  if (users) {
                     for (k = 0; k < users.length; k++) {
                        var user = new User();
                        user.username = users[k].str_login;
                        user.name = users[k].str_login;
                        user.email = users[k].str_login + "@camarasorocaba.sp.gov.br";
                        user.setPassword(users[k].str_senha);
                        user.primaryGroup = migrateUserGroupScript.groups[users[k].cod_perfil];
                        user.creationDate = new Date();
                        user.status = true;
                        await user.save();
                     }
                  }
                  return Promise.resolve(true);
               } catch(error) {
                  console.log("Error while migrating users, err = [" + error + "].");
                  return Promise.reject(error);
               }
            });
}
/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.run = async function () {
   winston.info("************migrateUsers");
   var connectionPool = MySQLDatabase.createConnectionPool({
            "host": "camarasorocaba.sp.gov.br",
            "user": "admin",
            "password": "PnbdpC725",
            "database": "controleacesso",
            "queueLimit": 50,
            "connectionLimit": 50
   });

   var connection;
   var filesCount;
   return MySQLDatabase
            .openConnection(connectionPool).then(function(pconnection) {
               connection = pconnection;
               return MySQLDatabase.query(connection, queryGetUsers);
            }).then(function(users) {
               return _migrate(users);
            }).catch(function(error) {
               console.log("Error while migrating users, err = [" + error + "].");
            });
}
