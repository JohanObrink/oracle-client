(function () {
  angular
    .module('oracle-client')
    .run(safeApply);

  safeApply.$inject = ['$rootScope'];

  function safeApply($rootScope) {
    $rootScope.$safeApply = function apply(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && ('function' === typeof fn)) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };
  }
})();
