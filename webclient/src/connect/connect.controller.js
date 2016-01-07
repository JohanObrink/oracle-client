(function () {
  angular
    .module('oracle-client')
    .controller('ConnectController', ConnectController);

  ConnectController.$inject = ['$log', 'oracleClient'];

  function ConnectController($log, oracleClient) {
    var vm = this;

    vm.config = JSON.stringify({user: '', password: '', host: '', database: ''}, null, '\t');

    vm.connect = () => connect(JSON.parse(vm.config));

    function connect(config) {
      return oracleClient.connect(config)
        .then(connectionId => {
          vm.connected = true;
          vm.sending = false;
          $log.info(`Connected to ${connectionId}`);
        })
        .catch(err => {
          vm.connected = false;
          vm.sending = false;
          $log.error(err);
        });
    }
  }
})();
