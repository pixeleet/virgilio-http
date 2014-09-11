var request = require('request');
var Concordia = require('concordia');
var concordia = new Concordia();

//Load concordia-http.
var concordiaHttp = require('../');
concordia.loadModule$(concordiaHttp);

//Define an action.
concordia.defineAction$('allcaps', function(word) {
    return word.toUpperCase() + '!';
});

//Adding an endpoint with multiple handlers to an action.
concordia.allcaps.get('/allcaps/:word')
    .addHandler(function(req) {
        req.params.word += ' is';
    })
    .addHandler(function(req) {
        req.params.word += ' great';
    })
    .transform();

//Make a request to the endpoint.
request.get('http://localhost:8080/allcaps/concordia',
            function(error, response, body) {
    console.log(body);    //=> '"CONCORDIA IS GREAT!"'
});
