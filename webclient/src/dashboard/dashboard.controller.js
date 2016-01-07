(function () {
  angular
    .module('oracle-client')
    .controller('DashboardController', DashboardController);

  DashboardController.$inject = ['$log', '$scope', 'oracleClient'];

  function DashboardController($log, $scope, oracleClient) {
    var vm = this;

    vm.sending = false;
    vm.results = [];
    vm.log = '';

    vm.disconnect = () => disconnect();
    vm.execute = () => execute(vm.sql);
    vm.clearLog = () => vm.log = '';
    vm.clearResults = () => vm.results = [];
    vm.removeResult = (result) => vm.results = vm.results.filter(res => res !== result);

    function activate() {}

    function disconnect() {
      vm.sending = true;
      return oracleClient.disconnect()
        .then(connectionId => {
          vm.connected = false;
          vm.sending = false;
          $log.info(`Disconnected from ${connectionId}`);
        })
        .catch(err => {
          vm.sending = false;
          $log.error(err);
        });
    }

    function execute(sql) {
      vm.sending = true;
      return oracleClient.execute(sql)
        .then(rows => {
          vm.results.unshift({sql, rows});
          vm.sending = false;
          $log.info(`Execution successful. Result ${rows.length} rows.`);
          $scope.$safeApply();
        })
        .catch(err => {
          vm.sending = false;
          $log.error(err);
        });
    }

    activate();
  }
})();
