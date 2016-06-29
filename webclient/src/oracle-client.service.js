(function () {
  angular
    .module('oracle-client')
    .service('oracleClient', oracleClient);

  oracleClient.$inject = ['$rootScope', '$location'];

  function oracleClient($rootScope, $location) {
    var port = $location.port() !== 80 ? `:${$location.port()}`: '';
    var url = `${$location.protocol()}://${$location.host()}${port}`;
    var socket = io.connect(url);

    var service = {
      connectionId: null,
      connecting: false,
      connect: connect,
      disconnect: disconnect,
      execute: execute
    };

    return service;

    function connect(config) {
      return new Promise((resolve, reject) => {
        service.connecting = true;
        socket.emit('db-connect', config, (err, connectionId) => {
          service.connecting = false;
          if(err) {
            reject(err);
          } else {
            service.connectionId = connectionId;
            resolve(connectionId);
            $rootScope.$emit('oracle-client:connected');
          }
        });
      });
    }

    function disconnect() {
      return new Promise((resolve, reject) => {
        socket.emit('db-release', service.connectionId, (err) => {
          if(err) {
            reject(err);
          } else {
            resolve(service.connectionId);
            service.connectionId = null;
            $rootScope.$emit('oracle-client:disconnected');
          }
        });
      });
    }

    function execute(sql) {
      return new Promise((resolve, reject) => {
        socket.emit('db-execute', service.connectionId, sql, null, (err, res) => {
          if(err) { reject(err); } else { resolve(res); }
        });
      });
    }
  }
})();
