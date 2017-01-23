/* global angular */
var app = angular.module('checkSite', ['ngRoute', 'satellizer'])

app.controller('NavController', function ($scope, $route, $routeParams, $location) {
  $scope.$route = $route
  $scope.$location = $location
  $scope.$routeParams = $routeParams
})

app.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/settings', {
      templateUrl: 'templates/login.html',
      controller: 'SettingsController'
    }).when('/siteDetail/:site_url*', {
      templateUrl: 'templates/site.html',
      controller: 'SiteController'
    }).otherwise({
      templateUrl: 'templates/index.html',
      controller: 'IndexController'
    })
})

app.config(function ($authProvider) {
  $authProvider.github({
    clientId: 'e2f93a285c3d307e2c90'
  })
})

app.controller('IndexController', function ($http, $scope) {
  var frontpage = this
  frontpage.scope = $scope

  frontpage.sites = {}

  function updateSites (frontpage) {
    $http.get('./api/sites').then(function (r) {
      frontpage.sites = r.data.data
    })
  };

  setInterval(function (scope) {
    updateSites(frontpage)
  }, 300000) // 5 minutes

  updateSites(frontpage)
})

app.controller('SettingsController', function ($scope, $location, $auth) {
  $scope.$location = $location
})

app.controller('SiteController', function ($scope, $location) {
  $scope.$location = $location
})

app.controller('AppController', function ($scope, $window, $auth, $location) {
  $scope.$location = $location

  $scope.profileLink = '<a ng-click="authenticate()" href="#">Login</a>'

  $auth.setStorageType('sessionStorage')

  $scope.isLoggedIn = $auth.isAuthenticated()

  $scope.authenticate = function () {
    $auth.authenticate('github')
    $scope.isLoggedIn = true
  }

  $scope.logout = function () {
    $auth.logout()
    $scope.isLoggedIn = false
  }
})
