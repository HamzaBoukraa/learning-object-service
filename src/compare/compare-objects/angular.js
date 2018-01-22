const json = 'services.live.json';   // production test

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
    $scope.suggest = function () {
        let filter = {};
        for (let field in $scope.filter) {
            if ($scope.filter[field] === '') filter[field] = null;
            else filter[field] = $scope.filter[field];
        }
        console.log('Sending ' + JSON.stringify(filter) + ' to:');
        $.each($scope.services, (index, service) => {
            console.log('\t' + 'http://localhost:5000/' + service.event);
            $http.post('http://localhost:5000/' + service.event, filter)
                .then((response) => {
                    service.objects = response.data.objects;
                    service.time = response.data.time;
                    return Promise.resolve();
                }).catch((err) => {
                    console.log(err);
                });
        });
    };
});
