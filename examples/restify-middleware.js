var request = require('request');
var Virgilio = require('virgilio');
var virgilio = new Virgilio();

//Load virgilio-http.
var virgilioHttp = require('../');
virgilio.loadModule$(virgilioHttp);

//Register a restify middleware.
virgilio.http.use$(virgilio.http.bodyParser());

//Define an action.
virgilio.defineAction$('allcaps', function(words) {
    return words.join(' ').toUpperCase() + '!';
});

//Adding an endpoint to an action.
virgilio.allcaps.post('/allcaps');

//Make a request to the endpoint.
var words = [ 'virgilio', 'is', 'great' ];
request.post('http://localhost:8080/allcaps', { json: words },
            function(error, response, body) {
    console.log(response.statusCode);   //=> 200
    console.log(body);                  //=> 'VIRGILIO IS GREAT!'
});
