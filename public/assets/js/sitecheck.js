/* global angular */
var buildWatchApp = angular.module('checkSite', ['ngRoute'])

buildWatchApp.controller('NavController', function ($scope, $route, $routeParams, $location) {
  $scope.$route = $route
  $scope.$location = $location
  $scope.$routeParams = $routeParams
})

buildWatchApp.config(function ($routeProvider, $locationProvider) {
  $routeProvider
   .when('/profile', {
     templateUrl: 'templates/profile.html',
     controller: 'ProfileController'
   }).otherwise({
     templateUrl: 'templates/index.html',
     controller: 'IndexController'
   })
})

buildWatchApp.controller('IndexController', function ($http, $scope) {
  var frontpage = this
  frontpage.scope = $scope

  frontpage.sites = {}

  function updateSites (frontpage) {
    $http.get('./sites').then(function (r) {
      frontpage.sites = r.data.data
      console.log('moo:', r.data.data)
    })
  };

  setInterval(function (scope) {
    updateSites(frontpage)
  }, 300000) // 5 minutes

  updateSites(frontpage)
})

buildWatchApp.controller('ProfileController', function ($scope, $location) {
  $scope.$location = $location
})
