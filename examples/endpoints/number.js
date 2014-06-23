// Copyright (C) 2014 IceMobile Agency B.V.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

module.exports = function() {
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
