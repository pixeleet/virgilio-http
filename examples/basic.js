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

//Adding an endpoint to an action.
concordia.allcaps.get('/allcaps/:word');

//Make a request to the endpoint.
request.get('http://localhost:8080/allcaps/concordia',
            function(error, response, body) {
    console.log(response.statusCode);   //=> 200
    console.log(body);                  //=> '"CONCORDIA!"'
});
