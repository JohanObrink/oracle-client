(function () {
  angular
    .module('oracle-client')
    .config(routes)
    .run(connectionHandler);

  routes.$inject = ['$locationProvider', '$stateProvider', '$urlRouterProvider'];

  function routes($locationProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('dashboard', {
        url: '/',
        templateUrl: 'dashboard/index.html',
        controller: 'DashboardController',
        controllerAs: 'vm'
      })
      .state('connect', {
        url: '/connect',
        templateUrl: 'connect/index.html',
        controller: 'ConnectController',
        controllerAs: 'vm'
      });
  }

  connectionHandler.$inject = ['$rootScope', '$state', 'oracleClient'];

  function connectionHandler($rootScope, $state, oracleClient) {

    function loggedIn() { $state.go('dashboard'); }
    function loggedOut() { $state.go('connect'); }

    $rootScope.$on('oracle-client:connected', loggedIn);
    $rootScope.$on('oracle-client:disconnected', loggedOut);

    if(oracleClient.connectionId) { loggedIn(); }
    else { loggedOut(); }
  }
})();
