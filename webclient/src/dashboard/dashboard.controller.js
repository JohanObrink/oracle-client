(function () {
  angular
    .module('oracle-client')
    .controller('DashboardController', DashboardController);

  DashboardController.$inject = ['$scope', 'oracleClient'];

  function DashboardController($scope, oracleClient) {
    var vm = this;

    vm.sending = false;
    vm.results = [];
    vm.log = '';


    vm.disconnect = () => disconnect();
    vm.execute = () => execute(vm.sql);
    vm.clearLog = () => vm.log = '';
    vm.clearResults = () => vm.results = [];
    vm.removeResult = (result) => vm.results = vm.results.filter(res => res !== result);

    function activate() {
      apply();
    }

    function apply(fn) {
      var phase = $scope.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && ('function' === typeof fn)) {
          fn();
        }
      } else {
        $scope.$apply(fn);
      }
    }

    function log(msg) {
      var now = new Date();
      var pad = num => (num < 10) ? '0' + num : '' + num;
      var hours = pad(now.getHours()),
        minutes = pad(now.getMinutes()),
        seconds = pad(now.getSeconds());
      var ts = `${hours}:${minutes}:${seconds}`;
      vm.log = `[${ts}] ${msg}\n` + vm.log;

      apply();
    }

    function logInfo(msg) {
      log(`Info: ${msg}`);
    }

    function logError(err) {
      log(`Error: ${err}`);
    }

    function disconnect() {
      vm.sending = true;
      return oracleClient.disconnect()
        .then(connectionId => {
          vm.connected = false;
          vm.sending = false;
          logInfo(`Disconnected from ${connectionId}`);
        })
        .catch(err => {
          vm.sending = false;
          logError(err);
        });
    }

    function execute(sql) {
      vm.sending = true;
      return oracleClient.execute(sql)
        .then(rows => {
          vm.results.unshift({sql, rows});
          vm.sending = false;
          logInfo(`Execution successful. Result ${rows.length} rows.`);
        })
        .catch(err => {
          vm.sending = false;
          logError(err);
        });
    }

    activate();
  }
})();
