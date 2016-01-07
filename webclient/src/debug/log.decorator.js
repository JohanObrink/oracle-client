(function () {
  angular
    .module('oracle-client')
    .config(logDecoratorProvider);

  logDecoratorProvider.$inject = ['$provide'];

  function logDecoratorProvider($provide) {
    $provide.decorator('$log', logDecorator);
  }

  logDecorator.$inject = ['$delegate', '$injector'];

  function logDecorator($delegate, $injector) {
    $delegate.info = info;
    $delegate.warn = warn;
    $delegate.error = error;

    return $delegate;

    //////////

    function info() {
      var args = Array.prototype.slice.call(arguments);
      console.log('info', args);
      var $rootScope = $injector.get('$rootScope');
      $rootScope.$emit('log-info', args);
    }

    function warn() {
      var args = Array.prototype.slice.call(arguments);
      console.warn('warning', args);
      var $rootScope = $injector.get('$rootScope');
      $rootScope.$emit('log-warn', args);
    }

    function error() {
      var args = Array.prototype.slice.call(arguments);
      console.error('error', args);
      var $rootScope = $injector.get('$rootScope');
      $rootScope.$emit('log-warn', args);
    }
  }
})();
