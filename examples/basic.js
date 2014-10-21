var request = require('request');
var Virgilio = require('virgilio');
var virgilio = new Virgilio();

//Load virgilio-http.
var virgilioHttp = require('../');
virgilio.loadModule$(virgilioHttp);

//Define an action.
virgilio.defineAction$('allcaps', function(word) {
    return word.toUpperCase() + '!';
});

//Adding an endpoint to an action.
virgilio.allcaps.get('/allcaps/:word');

//Make a request to the endpoint.
request.get('http://localhost:8080/allcaps/virgilio',
            function(error, response, body) {
    console.log(response.statusCode);   //=> 200
    console.log(body);                  //=> '"VIRGILIO!"'
});
