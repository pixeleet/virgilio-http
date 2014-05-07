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
module.exports = function(options) {
    var virgilio = this;
    var port = (options.http && options.http.port) || '8080';
    var Promise = virgilio.Promise;
    var server = restify.createServer();
    var httpMethods = ['get', 'post', 'put', 'del', 'head'];
    var httpOptions = options.http || {};
    var authRoutes = httpOptions.authRoutes || {};

    virgilio = virgilio.namespace('http')
        .defineAction('registerRoutes', registerRoutes)
        .defineAction('registerMiddleware', registerMiddleware);

    virgilio.baseVirgilio$.http = function(routeObject, basePath) {
        this.execute('http.registerRoutes', routeObject, basePath);
        return this;
    };

    virgilio.baseVirgilio$.httpUse = function(middleware, options) {
        this.execute('http.registerMiddleware', middleware, options);
        return this;
    };

    server.listen(port, function() {
        virgilio.log.info('Http server listening on port: %s', port);
    });

    function registerRoutes(routeObject, basePath) {
        basePath = sanitizePath(basePath || '');
        var routes = Object.keys(routeObject);
        routes.forEach(function(key) {
            var route = routeObject[key];
            key = key.toLowerCase();
            if (httpMethods.indexOf(key) >= 0) {
                registerRoute(basePath, key, route);
            }
            else {
                var path = basePath + sanitizePath(key);
                registerRoutes(route, path);
            }
        });
    }

    function registerRoute(path, method, handlerObject) {
        var handler = createHandler(handlerObject, path);
        virgilio.log.info(
                'Registering http endpoint: %s %s', method.toUpperCase(), path);
        server[method](path, handler);
    }

    function createHandler(handlerObject, path) {
        handlerObject = extendHandlerObject(handlerObject, path);

        var handler = function(req, res, next) {
            var handlerObject = this;
            Promise.cast(req)
                .then(handlerObject.auth)
                .then(handlerObject.transform)
                .then(handlerObject.handler)
                .then(function(response) {
                    return handlerObject.respond(response, res);
                })
                .catch(function(error) {
                    return handlerObject.error(error, res);
                })
                .catch(function(error) {
                    //If the user-defined error handler fails, use the
                    //default handler.
                    return handlerObject.error(error, res);
                }).done();
        }.bind(handlerObject);

        handler = addAuthToHandler(handler, path);

        return handler;
    }

    function extendHandlerObject(handlerObject, path) {
        if (typeof handlerObject === 'string') {
            handlerObject = {
                handler: handlerObject,
            };
        }
        var handler = handlerObject.handler;
        handlerObject.handler = function(args) {
            args = [handler].concat(args);
            return virgilio.execute.apply(virgilio, args);
        };
        handlerObject.transform =
                handlerObject.transform || getDefaultTransform(path);
        handlerObject.respond = handlerObject.respond || defaultRespond;
        handlerObject.error = handlerObject.error || defaultError;
        handlerObject.fallbackError = defaultError;
        return handlerObject;
    }

    /**
     * The default transform function will pass each parameter
     * in order as an argument to the action, and then add the
     * body as a last argument. Example:
     * /someUrl/:foo/:bar -> (params.foo, params.bar, body)
     */
    function getDefaultTransform(path) {
        var elements = path.split('/');
        var params = [];
        elements.forEach(function(element) {
            if (element.charAt(0) === ':') {
                params.push(element.slice(1));
            }
        });
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
        res.send(500, 'An error occured');
    }

    function addAuthToHandler(handler, path) {
        var roles = authRoutes[path];
        if (!roles) {
            return handler;
        }
        var authHandler = function(req, res, next) {
            var sessionId = req.headers['session-id'];
            if (!sessionId) {
                return res.send(403, 'Not logged in.');
            }
            return virgilio.execute('auth.checkRoles', sessionId, roles)
                .then(function(response) {
                    if (response.result) {
                        next();
                    }
                    else {
                        res.send(403, response.reason);
                    }
                })
                .catch(defaultError)
                .done();
        };
        return [authHandler, handler];
    }

    function sanitizePath(path) {
        var transformedPath = path.replace(/^\/?(.+)\/?$/, '/$1');
        return transformedPath;
    }

    /**
     * @param {Function/String} middleware
     * The middleware to load. Either a function or the name of
     * bundled restify middleware.
     * @param {Object} [options]
     * If `middleware` is bundled restify middleware, this optional
     * object can be used to configure that middleware.
     */
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
