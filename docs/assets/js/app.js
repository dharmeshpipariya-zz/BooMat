var boomatApp = angular.module('boomatApp', ['ngRoute']);

boomatApp.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'docs/index.html',
            controller: 'indexController'
        })
        .when('/components', {
            templateUrl: 'docs/components/index.html',
            controller: 'componentsController'
        })
        .when('/components/tooltip', {
            templateUrl: 'docs/components/tooltip.html',
            controller: 'componentsController'
        })
});

boomatApp.controller('indexController', function ($scope) { });

boomatApp.controller('componentsController', function ($scope) { });