'use strict';

var clients = {},
  io;

class OracleSocketConnection {
  constructor(client, connectionId) {
    this.client = client;
    this.connectionId = connectionId;
  }
  execute(sql, parameters, options) {
    return new Promise((resolve, reject) => {
      this.client.socket.emit('db-execute', this.connectionId, sql, parameters, options, (err, res) => {
        if(err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.client.socket.emit('db-release', this.connectionId, (err) => {
        if(err) {
          reject(err);
        } else {
          delete this.client.connections[this.connectionId];
          resolve(this.connectionId);
        }
      });
    });
  }
}

class OracleSocketClient {
  constructor(address, options) {
    if(!io) {
      try {
        io = require('socket.io-client');
      } catch(err) {
        throw new Error('To run oracle-client in connect mode, you need to npm install socket.io-client');
      }
    }

    this.socket = io(address, options);
    this.connections = {};
  }
  connect(config) {
    return new Promise((resolve, reject) => {
      this.socket.emit('db-connect', config, (err, connectionId) => {
        if(err) {
          reject(err);
        } else {
          var connection = new OracleSocketConnection(this, connectionId);
          this.connections[connectionId] = connection;
          resolve(connection);
        }
      });
    });
  }
}

module.exports = (address, options) => {
  var key = address + JSON.stringify(options || {});
  if(!clients[key]) {
    clients[key] = new OracleSocketClient(address, options);
  }
  return clients[key];
};
