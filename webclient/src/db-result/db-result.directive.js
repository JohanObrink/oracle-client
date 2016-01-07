(function () {
  angular
    .module('oracle-client')
    .directive('dbResult', dbResult);

  function dbResult() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        sql: '=',
        rows: '='
      },
      templateUrl: 'db-result/db-result.directive.html',
      link: linkFunction
    };
  }

  function linkFunction(scope) {
    scope.columns = [];

    if(scope.rows && scope.rows.length) {
      scope.columns = Object.keys(scope.rows[0]);
    }
  }
})();
