'use strict';

var oracledb,
  changeCase = require('change-case');

class OracleConnection {
  constructor(dbConn) {
    this.dbConn = dbConn;
  }
  execute(sql, params, options) {
    return new Promise((resolve, reject) => {
      params = params || [];
      options = options || {};
      this.dbConn.execute(sql, params, options, (err, result) => {
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
  if(config.autoCommit) {
    oracledb.autoCommit = true;
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
  if(result && result.rows) {
    return result.rows.map(row => {
      return row.reduce((obj, colVal, colIndex) => {
        var prop = changeCase.camelCase(result.metaData[colIndex].name);
        obj[prop] = colVal;
        return obj;
      }, {});
    });
  } else {
    return result;
  }
}

module.exports = () => { return {connect}; };
