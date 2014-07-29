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

var options = {
    http: {
        authRoutes: {
            '/number/someNumber': 'user-session-1',
            'POST:/number/someNumber': 'user-session-2'
        },
        port: 9997
    },
    //Disable logging (it's annoying when testing).
    logger: {
        name: 'virgilio',
        streams: []
    }
};
module.exports = require('virgilio')(options)
    //Normally we'd use this, but we can't require virgilio-http
    //from inside its own project.
    //.use('http')
    .loadModule(require('../../'))
        .httpUse('bodyParser')
        .httpUse(fooMiddleware)
    .loadModule(require('./number'))
    //Ordinarily, the auth.checkSession would be provided by an
    //authentication extension. For testing purposes we define
    //a simple one ourselves.
    .defineAction('auth.checkSession', checkSession);

function fooMiddleware(req, res, next) {
    if (req.headers.foo === 'bar') {
        return res.send(242);
    }
    next();
}

function checkSession(sessionId, authRouteInfo) {
    var response = null;
    if (sessionId === authRouteInfo) {
        response = {
            result: true
        };
    } else {
        response = {
            result: false,
            reason: 'fail'
        };
    }
    return response;
}
