var chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  proxyquire = require('proxyquire');

chai.use(require('sinon-chai'));
require('sinon-as-promised');

describe('oracleClient.direct()', () => {
  var client, oracledb, dbConn;
  beforeEach(() => {
    dbConn = {
      execute: sinon.stub(),
      release: sinon.stub()
    };
    oracledb = {
      getConnection: sinon.stub().yields(null, dbConn)
    };
    client = proxyquire(process.cwd() + '/lib/direct', {
      'oracledb': oracledb
    })();
  });
  describe('connect', () => {
    it('calls oracledb with correct parameters', () => {
      return client
        .connect({
          user: 'foo',
          password: 'bar',
          host: 'localhost',
          database: 'NORTHWIND'
        })
        .then(() => {
          expect(oracledb.getConnection).calledOnce.calledWith({
            user: 'foo',
            password: 'bar',
            host: 'localhost',
            database: 'NORTHWIND',
            connectString: 'localhost/NORTHWIND'
          });
        });
    });
    describe('connection', () => {
      var connection, result;
      beforeEach(() => {
        result = {
          rows: [],
          metaData: []
        };
        dbConn.execute.yields(null, result);
        dbConn.release.yields();
        return client
          .connect({})
          .then(conn => {
            connection = conn;
          });
      });
      describe('execute', () => {
        it('calls dbConn.execute with the correct parameters', () => {
          return connection
            .execute('SELECT * FROM USERS WHERE ID = :id', [12])
            .then(() => {
              expect(dbConn.execute).calledOnce.calledWith('SELECT * FROM USERS WHERE ID = :id', [12]);
            });
        });
        it('calls dbConn.execute with the correct default parameters', () => {
          return connection
            .execute('SELECT * FROM USERS')
            .then(() => {
              expect(dbConn.execute).calledOnce.calledWith('SELECT * FROM USERS', []);
            });
        });
        it('resolves the mapped result', () => {
          result.metaData = [{name: 'id'}, {name: 'name'}];
          result.rows = [[1, 'Johan']];
          return connection
            .execute('')
            .then((res) => {
              expect(res).to.eql([{id: 1, name: 'Johan'}]);
            });
        });
        it('rejects any errors', () => {
          var error = new Error('error');
          dbConn.execute.yields(error);
          return connection
            .execute('')
            .catch(err => {
              expect(err).to.equal(error);
            });
        });
      });
      describe('close', () => {
        it('calls release on dbConn', () => {
          return connection
            .close()
            .then(() => {
              expect(dbConn.release).calledOnce;
            });
        });
        it('rejects any errors', () => {
          var error = new Error('error');
          dbConn.release.yields(error);
          return connection
            .close()
            .catch(err => {
              expect(err).to.equal(error);
            });
        });
      });
    });
  });
});