var Concordia = require('concordia');
var options = {
    http: {
        port: 8080
    }
};
var concordia = new Concordia(options);
concordia.loadModule$(require('./lib/concordia-http'));

concordia.defineAction$('foo.bar', function(string1, string2) {
    return string1 + ' ' + string2;
});

concordia.foo.bar.get('/foo/:string1/:string2');
