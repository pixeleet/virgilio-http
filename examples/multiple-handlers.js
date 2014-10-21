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

//Adding an endpoint with multiple handlers to an action.
virgilio.allcaps.get('/allcaps/:word')
    .addHandler(function(req) {
        req.params.word += ' is';
    })
    .addHandler(function(req) {
        req.params.word += ' great';
    })
    .transform();

//Make a request to the endpoint.
request.get('http://localhost:8080/allcaps/virgilio',
            function(error, response, body) {
    console.log(body);    //=> '"VIRGILIO IS GREAT!"'
});
