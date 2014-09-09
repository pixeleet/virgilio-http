var Virgilio = require('virgilio');
var options = {
    http: {
        port: 8080
    }
};
var virgilio = new Virgilio(options);
virgilio.loadModule$(require('./lib/virgilio-http'));

virgilio.defineAction$('foo.bar', function(string1, string2) {
    return string1 + ' ' + string2;
});

virgilio.foo.bar.get('/foo/:string1/:string2');
