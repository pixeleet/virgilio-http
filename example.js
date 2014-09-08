var Virgilio = require('virgilio');
var options = {
    http: {
        port: 8080
    }
};
var virgilio = new Virgilio(options);
virgilio.loadModule$(require('./lib/virgilio-http'));

virgilio.defineAction$('foo.bar', function(string) {
    console.log(arguments);
    return string + '!';
});

virgilio.foo.bar.get('/foo/:string')
    .transform(function(req, res) {
        return this.execute$(req.params.string)
            .then(function(result) {
                res.send(200, result);
            });
    });
