/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var winston = require('winston');
var mysql = require( 'mysql' );

/*****************************************************************************
********************************** CONFIG ************************************
******************************************************************************/
module.exports.createConnectionPool = function(config) {
   return mysql.createPool(config);
}

module.exports.openConnection = function(connectionPoolMysql) {
   try
   {
      return new Promise( ( resolve, reject ) => {
          connectionPoolMysql.getConnection(function(err, connectionMysql) {
             if (err) { //connection error
                winston.error("Error while connecting to database, err = [%s]", err);
                reject(err);
             } else if(connectionMysql) { //connection ok
                resolve(connectionMysql);
             } else { //connection error, but the api didn't throw anything
                winston.error("Error while connecting to database, but the api didn't throw anything!");
                reject(new Error("Error while connecting to database, but the api didn't throw anything!"));
             }
          });
      });
   } catch(err) {
      console.log(err);
   }

}

module.exports.query = function(connection, sql, args) {
    return new Promise( (resolve, reject) => {
      if (connection) {
            connection.query(sql, args, (err, rows) => {
                if (err) { //query processing error
                   winston.error("Error while query execution, err = [%s]", err);
                   return reject(err);
                } else { //query processing ok
                   resolve(rows);
                }
            });
      } else {
          //the connection is not set
          winston.error("Error while query execution, the connection is not set!");
          reject(new Error("Error while query execution, the connection is not set!"));
      }
    });
}

module.exports.closeConnection = function(connection) {
    return new Promise( ( resolve, reject ) => {
      if (connection) {
         connection.release();
      }
      resolve();
    });
}

module.exports.endPool = function(connectionPool) {
   if(connectionPool) {
      connectionPool.end(function(err) {
         if(err) {
            console.log(err);
         }
      });
   }
}
