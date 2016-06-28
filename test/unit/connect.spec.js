var chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  proxyquire = require('proxyquire');

chai.use(require('sinon-chai'));
require('sinon-as-promised');

describe('oracleClient.connect()', () => {
  var oracleClientConnect, io, socket;
  beforeEach(() => {
    socket = {
      emit: sinon.stub()
    };
    io = sinon.stub().returns(socket);
    oracleClientConnect = proxyquire(process.cwd() + '/lib/connect', {
      'socket.io-client': io
    });
  });
  it('passes in the correct address and options', () => {
    oracleClientConnect('http://localhost:3000', {foo: 'bar'});
    expect(io).calledOnce.calledWith('http://localhost:3000', {foo: 'bar'});
  });
  it('reuses clients when settings match', () => {
    var client1 = oracleClientConnect('http://localhost:3000', {foo: 'bar'});
    var client2 = oracleClientConnect('http://localhost:3000', {foo: 'bar'});
    var client3 = oracleClientConnect('http://localhost:3000');
    var client4 = oracleClientConnect('http://localhost:4000', {foo: 'foo'});

    expect(io)
      .calledThrice
      .calledWith('http://localhost:3000', {foo: 'bar'})
      .calledWith('http://localhost:3000')
      .calledWith('http://localhost:4000', {foo: 'foo'});

    expect(client1).to.equal(client2);
    expect(client1).not.to.equal(client3);
    expect(client1).not.to.equal(client4);
    expect(client3).not.to.equal(client4);
  });
  describe('connect', () => {
    var client, connectionId;
    beforeEach(() => {
      connectionId = 'abc-123';
      client = oracleClientConnect('http://localhost:3000');
      socket.emit.withArgs('db-connect').yields(null, connectionId);
    });
    it('emits db-connect with the passed in config', () => {
      return client
        .connect({config: 'foo'})
        .then(() => {
          expect(socket.emit)
            .calledOnce
            .calledWith('db-connect', {config: 'foo'});
        });
    });
    it('resolves a connection when succesful', () => {
      return client
        .connect({config: 'foo'})
        .then(connection => {
          expect(connection).to.exist;
        });
    });
    it('rejects any errors', () => {
      var error = new Error('error');
      socket.emit.withArgs('db-connect').yields(error);
      return client
        .connect({config: 'foo'})
        .catch(err => {
          expect(err).to.equal(error);
        });
    });
    it('stores connections', () => {
      socket.emit.withArgs('db-connect').onFirstCall().yields(null, 'abc-111');
      socket.emit.withArgs('db-connect').onSecondCall().yields(null, 'abc-222');
      return Promise.all([client.connect({db: 1}), client.connect({db: 2})])
        .then(() => {
          expect(client.connections).to.have.all.keys('abc-111', 'abc-222');
        });
    });
    describe('connection', () => {
      var connection, result;
      beforeEach(() => {
        socket.emit.withArgs('db-execute').yields(null, result);
        socket.emit.withArgs('db-release').yields();
        return client
          .connect()
          .then(conn => {
            connection = conn;
          });
      });
      describe('execute', () => {
        it('emits db-execute with the correct connectionId, sql, and params', () => {
          return connection
            .execute('SELECT * FROM USERS WHERE ID = :id', [12], {maxRows: 150})
            .then(() => {
              expect(socket.emit.withArgs('db-execute'))
                .calledOnce
                .calledWith('db-execute', connectionId, 'SELECT * FROM USERS WHERE ID = :id', [12], {maxRows: 150});
            });
        });
        it('resolves the result', () => {
          return connection
            .execute('')
            .then(res => {
              expect(res).to.equal(result);
            });
        });
        it('rejects any errors', () => {
          var error = new Error('error');
          socket.emit.withArgs('db-execute').yields(error);
          return connection
            .execute('')
            .catch(err => {
              expect(err).to.equal(error);
            });
        });
      });
      describe('close', () => {
        it('emits db-release with the correct connectionId', () => {
          return connection
            .close()
            .then(() => {
              expect(socket.emit.withArgs('db-release'))
                .calledOnce
                .calledWith('db-release', connectionId);
            });
        });
        it('removes the connection', () => {
          return connection
            .close()
            .then(() => {
              expect(client.connections).to.eql({});
            });
        });
        it('rejects any errors', () => {
          var error = new Error('error');
          socket.emit.withArgs('db-release').yields(error);
          return connection
            .execute('')
            .catch(err => {
              expect(err).to.equal(error);
            });
        });
      });
    });
  });
});
