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
var _ = require('underscore');

//## Virgilio-HTTP

module.exports = function virgilioHttp(options) {
    var HTTP_METHODS = ['get', 'post', 'put', 'del', 'head', 'opts', 'patch'];

    //## Setup

    var virgilio = this;
    var Promise = virgilio.Promise;
    virgilio.namespace$('http');

    //Getting options and setting defaults
    var httpOptions = options.http || {};
    var port = httpOptions.port || '8080';
    var restifyOptions = httpOptions.restify || {};
    //Have restify use the virgilio bunyan instance as logger.
    restifyOptions.log = virgilio.http.log$;

    //Setup the restify server.
    var server = restify.createServer(restifyOptions);
    server.on('uncaughtException', function(req, res, route, error) {
        //Use our default error handler instead of Restify's.
        virgilio.log$.error(error);
        //FIXME Add a default error handler;
    });
    server.listen(port, function() {
        virgilio.log$.info('Http server listening on port: %s', port);
    });

    //Extend `virgilio.http`, with methods like `.get`, `.post`, etc.
    HTTP_METHODS.reduce(function(httpObj, method) {
        httpObj[method] = function(path) {
            var handlerChain = new HandlerChain();
            handlerChain.handlers
                .bind(this)
                .then(function(handlers) {
                    registerRoute.call(this, method, path, handlers);
                });
            return handlerChain;
        };
        return httpObj;
    }, virgilio.http);

    //## HandlerChain

    //The `HandlerChain` constructor returns an object with an `addHandler`
    //method. This can be called in chain several times to register handlers.
    function HandlerChain() {
        var handlers = this._handlers = [];
        //`handlerChain.handlers` is a promised for the handlers that will be
        //resolved in the nextTick, to give the user time to call `addHandler`.
        this.handlers = new Promise(function(resolve) {
            //Give the user time to register some handlers
            process.nextTick(function() {
                resolve(handlers);
            });
        });
    }

    //`addHandler` adds a handler on the `HandlerChain`.
    //`handler` takes a `req` and a `res` object and should return a promise.
    HandlerChain.prototype.addHandler = function addHandler(handler) {
        //When calling addHandler without args, a default handler will be used.
        if (arguments.length && typeof handler !== 'function') {
            throw new TypeError('Handler must be a function.');
        }
        this._handlers.push(handler);
        return this;
    };

    //`transform` is an alias for `addHandler`.
    HandlerChain.prototype.transform = HandlerChain.prototype.addHandler;

    // ## Register routes.

    function registerRoute(method, path, handlers) {
        //Our handlers return a promise, restify uses a `next` callback isntead.
        var restifyHandlers = handlers.map(function(handler) {
            //Replace empty entries with the default handler.
            if (!handler) {
                return _.bind(defaultHandler, this, path);
            }
            //Bind restifyHandler to `this` and prefill the `handler` arg.
            return _.bind(restifyHandler, this, handler);
        }, this);
        //If no handler was specified, add the default one.
        if (!restifyHandlers.length) {
            restifyHandlers.push(_.bind(defaultHandler, this, path));
        }
        server[method](path, restifyHandlers);
    }

    //The `restifyHandler` will be registered with the restify server,
    //after partially applying the `handler` arg.
    function restifyHandler(handler, req, res, next) {
        handler.call(this, req, res)
            .then(function() {
                next();
            })
            .catch(function(error) {
                //FIXME ensure error is an error instance.
                next(error);
            });
    }

    function defaultHandler(path, req, res) {
        var args = null;
        if (typeof path === 'string') {
            args = paramsFromStringPath(path, req.params);
        } else {
            //Path is a regex.
            args = paramsFromRegexPath(req.params);
        }
        args.push(req.body);
        return this.execute$.apply(this, args)
            .then(function(result) {
                res.send(200, result);
            });
    }

    //Given a certain path and a paramsObj (from the request object),
    //create an array of parameters.
    //    /someUrl/:foo/:bar -> (params.foo, params.bar)
    function paramsFromStringPath(path, paramsObj) {
        //Get all the parameter names from the path.
        var elements = path.split('/');
        var params = elements.reduce(function(params, element) {
            if (element.charAt(0) === ':') {
                var paramName = element.slice(1);
                params.push(paramsObj[paramName]);
            }
            return params;
        }, []);
        return params;
    }

    //Given a certain paramsObj resulting from a regex path, create an array of
    //parameters. Note that in this instance `req.params` is an object with
    //numerical properties for the regex matches.
    function paramsFromRegexPath(paramsObj) {
        var paramNames = Object.keys(paramsObj);
        var params = paramNames.reduce(function(params, paramName) {
            if ((/^\d+$/).test(paramName)) {
                params.push(paramsObj[paramName]);
            }
            return params;
        }, []);
        return params;
    }

    //## Extend all actions.

    //Set each httpObj method on each action, bound to its namespace.
    virgilio.extend$('_createAction$', function(name, handler) {
        var action = this.super$(name, handler);
        HTTP_METHODS.forEach(function(method) {
            var virgilio = this;
            action[method] = virgilio.http[method].bind(action.namespace$);
        }, this);
        return action;
    });
};
