var app = angular.module("app", []);
app.controller("ctrl", function($scope) {
    $.getJSON("services.json", (services)=> {
        $scope.services = [];

        $.each(services, (service, port)=> {
            var socket = io("http://localhost:"+services[service]);
            socket.on('connect', ()=> {
                console.log("Connected to service on port "+port);
            })
            
            $scope.services.push({
                name: service,
                socket: socket,
                visible: false,
                outcomes: []
            });
        });

        // register handling of suggestion results
        $.each($scope.services, (index, service) => {
            service.socket.on('suggestion', (outcomes) => {
                service.outcomes = outcomes;
                $scope.$apply();
            });
        });

        $scope.$apply();
    });

    // request suggestions for text from each service
    $scope.suggest = function(text) {
        for (service of $scope.services) {
            service.socket.emit('outcome', text);
        }
    };
});