// Define the `phonecatApp` module
var buildWatchApp = angular.module('buildwatch', ['ngRoute'])

buildWatchApp.controller('NavController', function($scope, $route, $routeParams, $location) {
     $scope.$route = $route
     $scope.$location = $location
     $scope.$routeParams = $routeParams
 })

buildWatchApp.config(function($routeProvider, $locationProvider) {
  $routeProvider
   .when('/profile', {
      templateUrl: 'templates/profile.html',
      controller: 'ProfileController'
    }).otherwise({
      templateUrl: 'templates/index.html',
      controller: 'IndexController'
    })
})

buildWatchApp.controller('IndexController', function($scope, $location) {
     $scope.$location = $location
 })

buildWatchApp.controller('ProfileController', function($scope, $location) {
     $scope.$location = $location
 })
