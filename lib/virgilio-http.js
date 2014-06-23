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

var restify = require('restify');
module.exports = function virgilioHttp(options) {

    //## Setup

    var virgilioHttpNs = this;

    //Getting options and setting defaults
    var httpOptions = options.http || {};
    var PORT = httpOptions.port || '8080';
    var RESTIFY_OPTIONS = httpOptions.restify || {};

    virgilioHttpNs = virgilioHttpNs.namespace('http')
        .loadModule(require('./extend-virgilio'))
        .loadModule(require('./register-route'))
        .subscribe('registerMiddleware', registerMiddleware);

    //Setup the restify server.
    var server = virgilioHttpNs.server = restify.createServer(RESTIFY_OPTIONS);
    //Use Virgilio's logger.
    server.log = virgilioHttpNs.log;
    server.on('uncaughtException', function(req, res, route, error) {
        virgilioHttpNs.log.error(error);
        //Only called when the user doesn't catch the error, so it returns 500.
        res.send(500);
    });
    server.listen(PORT, function() {
        virgilioHttpNs.log.info('Http server listening on port: %s', PORT);
    });

    virgilioHttpNs.stringifyHandlerObjectFunctions = function(handlerObject) {
        var stringify = virgilioHttpNs.util.stringifyFunction;
        if (handlerObject.transform) {
            handlerObject.transform = stringify(handlerObject.transform);
        }
        if (handlerObject.respond) {
            handlerObject.respond = stringify(handlerObject.respond);
        }
        if (handlerObject.error) {
            handlerObject.error = stringify(handlerObject.error);
        }
    };

    virgilioHttpNs.parseHandlerObjectFunctions = function(handlerObject) {
        var parse = virgilioHttpNs.util.parseFunction;
        if (handlerObject.transform) {
            handlerObject.transform = parse(handlerObject.transform);
        }
        if (handlerObject.respond) {
            handlerObject.respond = parse(handlerObject.respond);
        }
        if (handlerObject.error) {
            handlerObject.error = parse(handlerObject.error);
        }
    };

    //## registerMiddleware

    //Registers a middleware with the restify server.
    //The middleware argument is either a function or the name of
    //bundled restify middleware.
    //In the lastter case, an options argument can be provided,
    //to pass onl to the middleware 'constructor'.
    function registerMiddleware(middleware, options) {
        if (typeof middleware === 'string') {
            middleware = restify[middleware](options);
        }
        else {
            middleware = middleware.bind(virgilioHttpNs);
        }
        this.log.trace('Adding middleware.');
        server.use(middleware);
    }
};
