var _ = require('underscore');
var loggerConfig = {
    logger: {
        name: 'concordia',
        streams: []
    }
};
suite('transform');

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
concordia.defineAction$('add', function(num1, num2) {
    return num1 + num2;
});
done();
});

test('Adding an endpoint with a transform to an action.', function(done) {
concordia.add.get('/add/:num1/:num2')
    .transform(function(req, res) {
        var params = req.params;
        var num1 = parseInt(params.num1, 10);
        var num2 = parseInt(params.num2, 10);
        this.execute$(num1, num2)
            .then(function(result) {
                res.send(200, { result: result });
            });
    });
done();
});

test('Making a request to an endpoint.', function(done) {
request.get('http://localhost:8080/add/2/3',
            function(error, response, body) {
    assert.strictEqual(response.statusCode, 200);
    var result = JSON.parse(body).result;
    assert.strictEqual(result, 5);
    done();
});
});
after(function(done) {
    concordia.http._server$.close(done);
});
