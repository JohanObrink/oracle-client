'use strict';

var oracledb,
  changeCase = require('change-case');

class OracleConnection {
  constructor(dbConn) {
    this.dbConn = dbConn;
  }
  execute(sql, params) {
    return new Promise((resolve, reject) => {
      params = params || [];
      this.dbConn.execute(sql, params, (err, result) => {
        if(err) {
          reject(err);
        } else {
          resolve(objectify(result));
        }
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.dbConn.release(err => {
        if(err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

function connect(config) {
  if(!oracledb) {
    try {
      oracledb = require('oracledb');
    } catch(err) {
      throw new Error('To run oracle-client in direct or serve mode, you need to npm install oracledb');
    }
  }
  config.connectString = config.host + '/' + config.database;
  return new Promise((resolve, reject) => {
    oracledb.getConnection(config, (err, connection) => {
      if(err) {
        reject(err);
      } else {
        resolve(new OracleConnection(connection));
      }
    });
  });
}

function objectify(result) {
  return result.rows.map(row => {
    return row.reduce((obj, colVal, colIndex) => {
      var prop = changeCase.camelCase(result.metaData[colIndex].name);
      obj[prop] = colVal;
      return obj;
    }, {});
  });
}

module.exports = () => { return {connect}; };
