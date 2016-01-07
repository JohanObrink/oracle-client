(function () {
  angular
    .module('oracle-client')
    .controller('Main', MainController);

  MainController.$inject = ['$scope', 'oracleClient'];

  function MainController($scope, oracleClient) {
    var vm = this;

    vm.config = JSON.stringify({user: '', password: '', host: '', database: ''}, null, '\t');
    vm.connected = false;
    vm.sending = false;
    vm.results = [];
    vm.log = '';

    vm.connect = () => connect(JSON.parse(vm.config));
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

    function connect(config) {
      vm.sending = true;
      return oracleClient.connect(config)
        .then(connectionId => {
          vm.connected = true;
          vm.sending = false;
          logInfo(`Connected to ${connectionId}`);
        })
        .catch(err => {
          vm.connected = false;
          vm.sending = false;
          logError(err);
        });
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
