var request = require('request');
var Concordia = require('concordia');
var concordia = new Concordia();

//Load concordia-http.
var concordiaHttp = require('../');
concordia.loadModule$(concordiaHttp);

//Register a restify middleware.
concordia.http.use$(concordia.http.bodyParser());

//Define an action.
concordia.defineAction$('allcaps', function(words) {
    return words.join(' ').toUpperCase() + '!';
});

//Adding an endpoint to an action.
concordia.allcaps.post('/allcaps');

//Make a request to the endpoint.
var words = [ 'concordia', 'is', 'great' ];
request.post('http://localhost:8080/allcaps', { json: words },
            function(error, response, body) {
    console.log(response.statusCode);   //=> 200
    console.log(body);                  //=> 'CONCORDIA IS GREAT!'
});
