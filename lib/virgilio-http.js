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
var jsonSchema = require('tv4');
var errors = require('./errors');
var S = require('string');

module.exports = function virgilioHttp(options) {

    //## Setup

    var virgilio = this;
    var Promise = virgilio.Promise;

    // Load our custom validation formats
    require('./schemaValidationExtensions');

    //Getting options and setting defaults
    var httpOptions = options.http || {};
    var port = httpOptions.port || '8080';
    var restifyOptions = httpOptions.restify || {};
    var authRoutes = httpOptions.authRoutes || {};
    var httpMethods = ['get', 'post', 'put', 'del', 'head', 'opts', 'patch'];

    //Add every extension error to the virgilio instance
    errors.forEach(function(error) {
        virgilio.registerError$(error);
    });

    //Defining the module's actions.
    virgilio = virgilio.namespace('http')
        .defineAction('registerRoute', registerRoute)
        .defineAction('registerMiddleware', registerMiddleware);

    //Extending the base Virgilio instance.
    virgilio.baseVirgilio$.http = function(routeObject, basePath) {
        forEachRoute(routeObject, basePath,
            function(path, method, handlerObject) {
                stringifyHandlerObjectFunctions(handlerObject);
                this.execute('http.registerRoute', path, method, handlerObject);
            }.bind(this));
        return this;
    };
    virgilio.baseVirgilio$.httpUse = function(middleware, options) {
        this.execute('http.registerMiddleware', middleware, options);
        return this;
    };

    //Setup the restify server.
    var server = restify.createServer(restifyOptions);
    server.on('uncaughtException', function(req, res, route, error) {
        //Use our default error handler instead of Restify's.
        defaultError(error, res);
    });
    server.listen(port, function() {
        virgilio.log.info('Http server listening on port: %s', port);
    });


    //**registerRoute** registers a route with the restify server.
    function registerRoute(path, method, handlerObject) {
        parseHandlerObjectFunctions(handlerObject);
        var handler = createHandler(handlerObject, path);
        //Check if this route requires authentication.
        //If so, create an additional authenticationHandler.
        var authRouteInfo = authRoutes[path];
        if (authRouteInfo) {
            var authHandler = createAuthHandler(authRouteInfo);
            //When passed an array of handlers, restify will call them in order.
            handler = [authHandler, handler];
            virgilio.log.info('registering authenticated http endpoint: %s %s',
                    method.toUpperCase(), path);
        }
        else {
            virgilio.log.info('registering http endpoint: %s %s',
                    method.toUpperCase(), path);
        }
        //Register this route with the restify server.
        server[method](path, handler);
        //Inform the application of the new route.
        virgilio.publish('http.newRoute', path, method);
    }

    //**creatHandler** creates a restify handler from a handlerObject.
    //The handler object is or contains at the very least an action,
    //which is executed whenever the routes receives a request.
    //Furthermore, a transform, respond and error function can be defined.
    function createHandler(handlerObject, path) {
        handlerObject = extendHandlerObject(handlerObject, path);
        return function(req, res) {
            var handlerObject = this;
            var handlerChain = Promise.cast(req)
                .then(handlerObject.validate)
                .then(handlerObject.transform)
                .then(handlerObject.handler)
                .then(function(response) {
                    return handlerObject.respond(response, res);
                });

            var errorHandlers = handlerObject.errors;
            var errorTypes = Object.keys(errorHandlers);
            errorTypes.forEach(function(errorType) {
                var capitalizedErrorName = S(errorType).capitalize().s;
                var errorName = capitalizedErrorName + 'Error';
                var Error = virgilio[errorName];

                var errorHandler = errorHandlers[errorType];
                if (!Error) {
                    virgilio.log.error('Attempting to handle unknown error %',
                        errorName);
                    return;
                }
                handlerChain.catch(Error, function(error) {
                    return errorHandler(error, res);
                });
            });

            handlerChain.catch(function(error) {
                return handlerObject.defaultError(error, res);
            }).done();
        }.bind(handlerObject);
    }

    //**extendHandlerObject** sets default transform, respond and error
    //functions on the handlerObject.
    function extendHandlerObject(handlerObject, path) {
        //Instead of passing an object with only a handler property,
        //the user can pass just that property (the action name, a string).
        //In that case, create a full-fledgec handlerObject now.
        if (typeof handlerObject === 'string') {
            handlerObject = {
                handler: handlerObject,
            };
        }
        //Turn the handler property, now the action name, into a function.
        var handler = handlerObject.handler;
        handlerObject.handler = function(args) {
            args = [handler].concat(args);
            var result = virgilio.execute.apply(virgilio, args);
            if (handlerObject.timeout) {
                result.withTimeout(handlerObject.timeout);
            }
            return result;
        };
        handlerObject.validate = getValidationHandler(handlerObject.schema);

        //Extend the handlerObject with defaults.
        handlerObject.transform =
                handlerObject.transform || getDefaultTransform(path);
        handlerObject.respond = handlerObject.respond || defaultRespond;

        handlerObject.errors = handlerObject.errors || {};
        if (!handlerObject.defaultError) {
            var customError = handlerObject.errors;
            handlerObject.defaultError = (typeof customError === 'function')
                ? customError
                : defaultError;
        }

        handlerObject.error = handlerObject.error || defaultError;
        handlerObject.validationError = handlerObject.validationError ||
                                                        defaultValidationError;
        handlerObject.fallbackError = defaultError;
        return handlerObject;
    }

    function getValidationHandler(schema) {
        return function(req) {
            if (schema) {
                var requestObject = req.body;
                var result = jsonSchema.validateResult(requestObject, schema);
                if (!result.valid) {
                    throw new virgilio.ValidationError(result.error);
                }
            }

            return req;
        };
    }

    //The default transform function will pass each parameter in order as
    //an argument to the action, and then add the body as a last argument.
    //Example:
    //    /someUrl/:foo/:bar -> (params.foo, params.bar, body)
    function getDefaultTransform(path) {
        //Get all the parameter names from the path.
        var elements = path.split('/');
        var params = [];
        elements.forEach(function(element) {
            if (element.charAt(0) === ':') {
                this.push(element.slice(1));
            }
        }, params);
        return function(req) {
            var args = params.map(function(param) {
                return req.params[param];
            });
            args.push(req.body);
            return args;
        };
    }

    function defaultRespond(response, res) {
        res.send(200, response);
    }

    function defaultError(error, res) {
        virgilio.log.error(error);
        //Only called when the user doesn't catch the error, so it returns 500.
        res.send(500);
    }

    function defaultValidationError(error, res) {
        res.send(400, error);
    }

    //**createAuthHandler** returns a route middleware to be used by restify.
    //It executes auth.checkSession which another module needs to provide.
    //auth.checkSession needs to determine whether a user has access to a route,
    //based on the users sessionId and authentication info stored for the route.
    function createAuthHandler(authRouteInfo) {
        return function(req, res, next) {
            var sessionId = req.headers['session-id'];
            if (!sessionId) {
                return res.send(403, 'Not logged in.');
            }
            return virgilio.execute(
                        'auth.checkSession', sessionId, authRouteInfo)
                .then(function(response) {
                    //Result has the following format:
                    //    { result: false, reason: 'I dont like you.' }
                    if (response.result) {
                        req.session = response.session;
                        next();
                    }
                    else {
                        res.send(403, response.reason);
                    }
                })
                .catch(defaultError)
                .done();
        };
    }

    //**sanitizePath** alters a path to ensure it only has a leading '/'.
    //This way, sanitized paths can be safely concatenated.
    function sanitizePath(path) {
        var transformedPath = path.replace(/^\/?(.+)\/?$/, '/$1');
        return transformedPath;
    }

    //Iterate over a routeObject and call an iterator for each route contained.
    //The iterator is called with a (path, method, handlerObj) signature.
    function forEachRoute(routeObject, basePath, iterator) {
        basePath = sanitizePath(basePath || '');
        var routes = Object.keys(routeObject);
        routes.forEach(function(key) {
            var route = routeObject[key];
            var method = key.toLowerCase();
            //Check if the key of the routeObject is an http method.
            if (httpMethods.indexOf(method) >= 0) {
                iterator(basePath, method, route);
            }
            else {
                //Recursively call registerRoutes with the extended path.
                var path = basePath + sanitizePath(key);
                forEachRoute(route, path, iterator);
            }
        });
    }

    function stringifyHandlerObjectFunctions(handlerObject) {
        var stringify = virgilio.util.stringifyFunction;
        if (handlerObject.transform) {
            handlerObject.transform = stringify(handlerObject.transform);
        }
        if (handlerObject.respond) {
            handlerObject.respond = stringify(handlerObject.respond);
        }
        if (handlerObject.error) {
            handlerObject.error = stringify(handlerObject.error);
        }
    }

    function parseHandlerObjectFunctions(handlerObject) {
        var parse = virgilio.util.parseFunction;
        if (handlerObject.transform) {
            handlerObject.transform = parse(handlerObject.transform);
        }
        if (handlerObject.respond) {
            handlerObject.respond = parse(handlerObject.respond);
        }
        if (handlerObject.error) {
            handlerObject.error = parse(handlerObject.error);
        }
    }

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
            middleware = middleware.bind(virgilio);
        }
        this.log.trace('Adding middleware.');
        server.use(middleware);
    }
};
