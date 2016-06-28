var chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  proxyquire = require('proxyquire');

chai.use(require('sinon-chai'));
require('sinon-as-promised');

describe('oracleClient.serve()', () => {
  var oracleClientServe,  http, https, app, fs, uuid, socketIo, io, direct, directClient, directConn, connectionId;
  beforeEach(() => {
    directConn = {
      execute: sinon.stub(),
      close: sinon.stub()
    };
    directClient = {
      connect: sinon.stub().resolves(directConn)
    };
    direct = sinon.stub().returns(directClient);
    io = {
      on: sinon.stub()
    };
    socketIo = sinon.stub().returns(io);
    app = {
      listen: sinon.stub()
    };
    http = {
      createServer: sinon.stub().returns(app)
    };
    https = {
      createServer: sinon.stub().returns(app)
    };
    fs = {
      readFile: sinon.stub()
    };
    connectionId = 'abc-123';
    uuid = {
      v4: sinon.stub().returns(connectionId)
    };

    oracleClientServe = proxyquire(process.cwd() + '/lib/serve', {
      'http': http,
      'https': https,
      'fs': fs,
      'node-uuid': uuid,
      'socket.io': socketIo,
      './direct': direct
    });
  });
  it('calls http.createServer and app.listen with the correct default port', () => {
    var client = oracleClientServe();
    expect(http.createServer).calledOnce.calledWith(client.handleRequest);
    expect(app.listen).calledOnce.calledWith(80);
  });
  it('calls http.createServer and app.listen with the correct port', () => {
    var client = oracleClientServe(3000);
    expect(http.createServer).calledOnce.calledWith(client.handleRequest);
    expect(app.listen).calledOnce.calledWith(3000);
  });
  it('calls https.createServer and app.listen with the correct port and options', () => {
    var client = oracleClientServe(8000, {key: 'key', cert: 'cert'});
    expect(https.createServer).calledOnce.calledWith({key: 'key', cert: 'cert'}, client.handleRequest);
    expect(app.listen).calledOnce.calledWith(8000);
  });
  describe('client', () => {
    var client;
    beforeEach(() => {
      client = oracleClientServe();
    });
    describe('index.html', () => {
      var req, res;
      beforeEach(() => {
        req = {};
        res = {
          writeHead: sinon.stub(),
          end: sinon.stub()
        };
      });
      it('reads the index.html page', () => {
        client.handleRequest(req, res);
        expect(fs.readFile).calledOnce.calledWith(process.cwd() + '/webclient/dist/index.html');
      });
      it('writes the contents of index.html to the response', () => {
        client.handleRequest(req, res);
        fs.readFile.yield(null, '<html />');
        expect(res.writeHead).calledOnce.calledWith(200);
        expect(res.end).calledOnce.calledWith('<html />');
      });
    });
    describe('connect', () => {
      it('returns a direct() connection', () => {
        return client
          .connect({})
          .then(connection => {
            expect(directClient.connect).calledOnce.calledWith({});
            expect(connection).to.equal(directConn);
          });
      });
    });
    describe('on(connection)', () => {
      var socket;
      beforeEach(() => {
        socket = {
          on: sinon.stub(),
          removeListener: sinon.stub(),
          emit: function (event) {
            var args = Array.prototype.slice.call(arguments, 1);
            var stub = this.on.withArgs(event);
            stub.yield.apply(stub, args);
          }
        };
        io.on.withArgs('connection').yield(socket);
      });
      it('adds connections to socket', () => {
        expect(socket.connections).to.eql({});
      });
      it('adds listens to socket events', () => {
        expect(socket.on)
          .calledWith('disconnect')
          .calledWith('db-connect')
          .calledWith('db-execute')
          .calledWith('db-release');
      });
      describe('on(db-connect)', () => {
        var callback;
        beforeEach(() => {
          callback = sinon.spy();
        });
        it('calls onDbConnect', () => {
          sinon.stub(client, 'onDbConnect');
          socket.emit('db-connect', {config: 'foo'}, callback);
          expect(client.onDbConnect)
            .calledOnce
            .calledWith(socket, {config: 'foo'}, callback);
        });
        it('connects to db', () => {
          return client
            .onDbConnect(socket, {config: 'foo'}, callback)
            .then(() => {
              expect(directClient.connect).calledOnce.calledWith({config: 'foo'});
            });
        });
        it('stores the connection', () => {
          return client
            .onDbConnect(socket, {config: 'foo'}, callback)
            .then(() => {
              expect(socket.connections[connectionId]).to.equal(directConn);
            });
        });
        it('passes the connectionId to the callback', () => {
          return client
            .onDbConnect(socket, {config: 'foo'}, callback)
            .then(() => {
              expect(callback).calledOnce.calledWith(null, connectionId);
            });
        });
        it('passes errors to the callback', () => {
          var error = new Error('b0rked');
          directClient.connect.rejects(error);

          return client
            .onDbConnect(socket, {config: 'foo'}, callback)
            .then(() => {
              expect(callback).calledOnce.calledWith(error.toString());
            });
        });
      });
      describe('on(db-execute)', () => {
        var sql, params, options, callback, result;
        beforeEach(() => {
          sql = 'SELECT * FROM USERS WHERE ID = :id';
          params = [12];
          options = {maxRows: 150};
          callback = sinon.spy();
          result = [{id: 1}, {id: 2}];
          directConn.execute.resolves(result);
          socket.connections[connectionId] = directConn;
        });
        it('calls onDbExecute', () => {
          sinon.stub(client, 'onDbExecute');

          socket.emit('db-execute', connectionId, sql, params, options, callback);

          expect(client.onDbExecute)
            .calledOnce
            .calledWith(socket, connectionId, sql, params, options, callback);
        });
        it('passes an error if no such connection exists', () => {
          socket.connections = {};
          client.onDbExecute(socket, connectionId, sql, params, options, callback);

          expect(callback)
            .calledOnce
            .calledWith('Error: No connection found with id: abc-123');
        });
        it('calls execute() on the connection with the correct parameters', () => {
          return client
            .onDbExecute(socket, connectionId, sql, params, options, callback)
            .then(() => {
              expect(directConn.execute)
                .calledOnce
                .calledWith(sql, params, options);
            });
        });
        it('passes the result to the callback', () => {
          return client
            .onDbExecute(socket, connectionId, sql, params, options, callback)
            .then(() => {
              expect(callback)
                .calledOnce
                .calledWith(null, result);
            });
        });
        it('passes errors to the callback', () => {
          var error = new Error('b0rked');
          directConn.execute.rejects(error);

          return client
            .onDbExecute(socket, connectionId, sql, params, options, callback)
            .then(() => {
              expect(callback)
                .calledOnce
                .calledWith(error.toString());
            });
        });
      });
      describe('on(db-release)', () => {
        var callback;
        beforeEach(() => {
          callback = sinon.spy();
          directConn.close.resolves();
          socket.connections[connectionId] = directConn;
        });
        it('calls onDbRelease', () => {
          sinon.stub(client, 'onDbRelease');

          socket.emit('db-release', connectionId, callback);

          expect(client.onDbRelease)
            .calledOnce
            .calledWith(socket, connectionId, callback);
        });
        it('passes an error if no such connection exists', () => {
          socket.connections = {};
          client.onDbRelease(socket, connectionId, callback);

          expect(callback).calledOnce.calledWith('Error: No connection found with id: abc-123');
        });
        it('calls close() on the connection', () => {
          return client
            .onDbRelease(socket, connectionId, callback)
            .then(() => {
              expect(directConn.close).calledOnce;
            });
        });
        it('passes the connectionId to the callback', () => {
          return client
            .onDbRelease(socket, connectionId, callback)
            .then(() => {
              expect(callback).calledOnce.calledWith(null, connectionId);
            });
        });
        it('passes errors to the callback', () => {
          var error = new Error('b0rked');
          directConn.close.rejects(error);

          return client
            .onDbRelease(socket, connectionId, callback)
            .then(() => {
              expect(callback).calledOnce.calledWith(error.toString());
            });
        });
      });
      describe('on(disconnect)', () => {
        it('removes listener from socket', () => {
          socket.emit('disconnect');
          expect(socket.removeListener)
            .calledWith('db-connect')
            .calledWith('db-execute')
            .calledWith('db-release')
            .calledWith('disconnect');
        });
      });
    });
  });
});
