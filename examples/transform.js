var request = require('request');
var Virgilio = require('virgilio');
var virgilio = new Virgilio();

//Load virgilio-http.
var virgilioHttp = require('../');
virgilio.loadModule$(virgilioHttp);

//Define an action.
virgilio.defineAction$('add', function(num1, num2) {
    return num1 + num2;
});

//Adding an endpoint with a transform to an action.
virgilio.add.get('/add/:num1/:num2')
    .transform(function(req, res) {
        var params = req.params;
        var num1 = parseInt(params.num1, 10);
        var num2 = parseInt(params.num2, 10);
        this.execute$(num1, num2)
            .then(function(result) {
                res.send(200, { result: result });
            });
    });

//Make a request to the endpoint.
request.get('http://localhost:8080/add/2/3',
            function(error, response, body) {
    console.log(response.statusCode);       //=> 200
    var result = JSON.parse(body).result;
    console.log(result);                    //=> 5
});
