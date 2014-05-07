module.exports = function(options) {
    var virgilio = this;
    virgilio.namespace('number')
        .defineAction('add', add)
        .defineAction('subtract', subtract)
        .defineAction('someNumber', someNumber);

    function add(num1, num2) {
        num1 = parseInt(num1, 10);
        num2 = parseInt(num2, 10);
        return (num1 + num2);
    }

    function subtract(num1, num2) {
        var virgilio = this;
        return virgilio.execute('number.add', num1, -num2);
    }

    function someNumber() {
        return 42;
    }

    virgilio.http({
        '/number': {
            '/add': {
                POST: {
                    handler: 'number.add',
                    transform: function(req) {
                        var body = req.body;
                        return [body.num1, body.num2];
                    },
                    respond: function(result, res) {
                        var answer = 'The answer is: ' + result;
                        res.send(200, answer);
                    },
                    error: function(err, res) {
                        res.send(500, err.message);
                    }
                }
            },
            '/subtract/:num1/:num2': {
                GET: 'number.subtract'
            },
            '/someNumber': {
                GET: 'number.someNumber'
            }
        }
    });
};
