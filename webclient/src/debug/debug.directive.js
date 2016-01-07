(function () {
  angular
    .module('oracle-client')
    .directive('debug', debug);

  debug.$inject = ['$rootScope'];

  function debug($rootScope) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'debug/debug.directive.html',
      link: linkFn
    };

    function linkFn(scope) {
      scope.messages = [];
      var listeners = [];

      function activate() {
        listeners = [
          $rootScope.$on('log-info', info),
          $rootScope.$on('log-warn', warn),
          $rootScope.$on('log-error', error)
        ];
      }

      function log(type, msg) {
        var txt = `[${type}] [${moment().format('HH:mm:ss')}] ${msg}`;
        scope.messages.unshift(txt);
        //console.log('Recieved', txt);
        //try {scope.$apply();}catch(err){console.log('borked', err);}
      }

      function info(event, args) {
        log('Info', args.join(' '));
      }

      function warn(event, args) {
        log('Warn', args.join(' '));
      }

      function error(event, args) {
        log('Error', args.join(' '));
      }

      function destroy() {
        listeners.forEach(cancel => cancel());
      }

      scope.$on('$destroy', destroy);
      activate();
    }
  }
})();
