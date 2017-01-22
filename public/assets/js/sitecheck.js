/* global angular */
var app = angular.module('checkSite', ['ngRoute'])

app.controller('NavController', function ($scope, $route, $routeParams, $location) {
  $scope.$route = $route
  $scope.$location = $location
  $scope.$routeParams = $routeParams
})

app.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/profile', {
      templateUrl: 'templates/login.html',
      controller: 'ProfileController'
    }).when('/siteDetail/:site_url*', {
      templateUrl: 'templates/site.html',
      controller: 'SiteController'
    }).otherwise({
      templateUrl: 'templates/index.html',
      controller: 'IndexController'
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

app.controller('ProfileController', function ($scope, $window, $location) {
  $scope.$location = $location

  if ($scope.isLoggedIn) {
    $location.path('/profile')
  } else {
    $window.location.href = '/login'
  }
})

app.controller('SiteController', function ($scope, $location) {
  $scope.$location = $location
})

app.controller('AppController', function ($scope, $window, $location) {
  $scope.$location = $location
  if (!$scope.user) {
    $scope.user = {}
  }
  if (!$scope.user.code && (searchToObject().code !== '')) {
    $scope.user.code = searchToObject().code
  }
  console.dir($scope.user)
})

function searchToObject () {
  var pairs = window.location.search.substring(1).split('&')
  var obj = {}
  var pair

  for (var i in pairs) {
    if (pairs[i] === '') continue

    pair = pairs[i].split('=')
    obj[ decodeURIComponent(pair[0]) ] = decodeURIComponent(pair[1])
  }

  return obj
}
