(function () {
  angular
    .module('oracle-client')
    .filter('dbValCss', dbValCssFilter);


  function dbValCssFilter() {
    return function (val) {
      return `val__${typeof val}`;
    };
  }
})();
