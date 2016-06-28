'use strict';

var http = require('http'),
  https = require('https'),
  fs = require('fs'),
  path = require('path'),
  uuid = require('node-uuid'),
  socketIo, direct;

class OracleSocketServer {
  constructor(port, options) {
    if(!direct) { direct = require('./direct'); }
    if(!socketIo) {
      try {
        socketIo = require('socket.io');
      } catch(err) {
        throw new Error('To run oracle-client in serve mode, you need to npm install socket.io');
      }
    }
    port = port || 80;

    this.app = (options) ? https.createServer(options, this.handleRequest) : http.createServer(this.handleRequest);
    this.io = socketIo(this.app);
    this.client = direct();

    this.io.on('connection', socket => this.onSocketConnection(socket));
    this.app.listen(port, () => console.log(`listening on port ${port}`));
  }
  connect(config) {
    return this.client.connect(config);
  }
  handleRequest(req, res) {
    fs.readFile(path.join(__dirname, '../webclient/dist/index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }

      res.writeHead(200);
      res.end(data);
    });
  }
  onSocketConnection(socket) {
    socket.connections = {};

    var onDbConnect = (config, callback) =>
      this.onDbConnect(socket, config, callback);
    var onDbExecute = (connectionId, sql, parameters, options, callback) =>
      this.onDbExecute(socket, connectionId, sql, parameters, options, callback);
    var onDbRelease = (connectionId, callback) =>
      this.onDbRelease(socket, connectionId, callback);
    var onSocketDisconnect = () => {
      socket.removeListener('db-connect', onDbConnect);
      socket.removeListener('db-execute', onDbExecute);
      socket.removeListener('db-release', onDbRelease);
      socket.removeListener('disconnect', onSocketDisconnect);

      return this.onSocketDisconnect(socket);
    };

    socket.on('db-connect', onDbConnect);
    socket.on('db-execute', onDbExecute);
    socket.on('db-release', onDbRelease);
    socket.on('disconnect', onSocketDisconnect);
  }
  onSocketDisconnect(socket) {
    return Promise.all(Object.keys(socket.connections)
      .map(id => {
        var conn = socket.connections[id];
        return conn
          .close()
          .then(() => {
            delete socket.connections[id];
            console.log(`closed hanging connection ${id}`);
          })
          .catch(err => {
            console.error(`failed to close hanging connection ${id}`);
            console.error(err.toString());
          });
      }));
  }
  onDbConnect(socket, config, callback) {
    return this.connect(config)
      .then(connection => {
        var connectionId = uuid.v4();
        socket.connections[connectionId] = connection;
        callback(null, connectionId);
      })
      .catch(err => callback(err.toString()));
  }
  onDbExecute(socket, connectionId, sql, parameters, options, callback) {
    var connection = socket.connections[connectionId];
    if(!connection) {
      return callback(new Error(`No connection found with id: ${connectionId}`).toString());
    }
    return connection
      .execute(sql, parameters, options)
      .then(result => callback(null, result))
      .catch(err => callback(err.toString()));
  }
  onDbRelease(socket, connectionId, callback) {
    var connection = socket.connections[connectionId];
    if(!connection) {
      return callback(new Error(`No connection found with id: ${connectionId}`).toString());
    }
    return connection
      .close()
      .then(() => {
        delete socket.connections[connectionId];
        callback(null, connectionId);
      })
      .catch(err => callback(err.toString()));
  }
}

module.exports = (port, options) => new OracleSocketServer(port, options);
