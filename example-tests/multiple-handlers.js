var _ = require('underscore');
var loggerConfig = {
    logger: {
        name: 'concordia',
        streams: []
    }
};
suite('multiple handlers');

var assert = require('assert');
var request = require('request');
var Concordia = require('concordia');
var concordia = new Concordia(_.extend(loggerConfig, {}));

test('Load concordia-http.', function(done) {
var concordiaHttp = require('../');
concordia.loadModule$(concordiaHttp);
done();
});

test('Define an action.', function(done) {
concordia.defineAction$('allcaps', function(word) {
    return word.toUpperCase() + '!';
});
done();
});

test('Adding an endpoint to an action.', function(done) {
concordia.allcaps.get('/allcaps/:word')
    .addHandler(function(req) {
        req.params.word += ' is';
    })
    .addHandler(function(req) {
        req.params.word += ' great';
    })
    .transform();
done();
});

test('Making a request to an endpoint.', function(done) {
request.get('http://localhost:8080/allcaps/concordia',
            function(error, response, body) {
    assert.strictEqual(body, '"CONCORDIA IS GREAT!"');
    done();
});
});
after(function(done) {
    concordia.http._server$.close(done);
});
