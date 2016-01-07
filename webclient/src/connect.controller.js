(function () {
  angular
    .module('oracle-client')
    .controller('ConnectController', ConnectController);

  ConnectController.$inject = ['oracleClient'];

  function ConnectController(oracleClient) {
    var vm = this;

    vm.config = JSON.stringify({user: '', password: '', host: '', database: ''}, null, '\t');

    vm.connect = () => connect(JSON.parse(vm.config));

    function connect(config) {
      return oracleClient.connect(config)
        .then(connectionId => {
          vm.connected = true;
          vm.sending = false;
          //logInfo(`Connected to ${connectionId}`);
        })
        .catch(err => {
          vm.connected = false;
          vm.sending = false;
          //logError(err);
        });
    }
  }
})();
