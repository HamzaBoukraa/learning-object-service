const json = 'services.compare.json';   // local comparison
// const json = 'services.live.json';   // production test

var app = angular.module("app", []);

app.controller("ctrl", function ($scope, $http) {
    $.getJSON(json, (services) => {
        $scope.services = [];

        $.each(services.services, (index, service) => {
            $scope.services.push({
                event: service,
                visible: true,
                outcomes: []
            });
        });

        $scope.$apply();
    });

    // request suggestions for text from each service
    $scope.suggest = function (text) {
        console.log('Sending "' + text + '" to:');
        $.each($scope.services, (index, service) => {
            console.log('\t' + 'http://localhost:5000/' + service.event);
            $http.post('http://localhost:5000/' + service.event, {
                text: text,
                filter: $scope.filter
            }).then((response) => {
                service.outcomes = response.data.outcomes;
                service.time = response.data.time;
                return Promise.resolve();
            }).catch((err) => {
                console.log(err);
            });
        });
    };
});
