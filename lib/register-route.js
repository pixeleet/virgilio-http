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

module.exports = function(options) {
    var virgilioHttpNs = this;
    var Promise = virgilioHttpNs.Promise;
    var httpOptions = options.http || {};
    var AUTH_ROUTES = httpOptions.authRoutes || {};

    virgilioHttpNs
        .subscribe('registerRoute', registerRoute);

    //**registerRoute** registers a route with the restify server.
    function registerRoute(path, method, handlerObject) {
        this.parseHandlerObjectFunctions(handlerObject);
        var handler = createHandler(handlerObject, path);
        //Check if this route requires authentication.
        //If so, create an additional authenticationHandler.
        var authRouteInfo = AUTH_ROUTES[path];
        if (authRouteInfo) {
            var authHandler = createAuthHandler(authRouteInfo);
            //When passed an array of handlers, restify will call them in order.
            handler = [authHandler, handler];
            virgilioHttpNs.log.info(
                'registering authenticated http endpoint: %s %s',
                method.toUpperCase(), path);
        }
        else {
            virgilioHttpNs.log.info('registering http endpoint: %s %s',
                              method.toUpperCase(), path);
        }
        //Register this route with the restify server.
        virgilioHttpNs.server[method](path, handler);
        //Inform the application of the new route.
        virgilioHttpNs.publish('http.newRoute', path, method);
    }

    //**creatHandler** creates a restify handler from a handlerObject.
    //The handler object is or contains at the very least an action,
    //which is executed whenever the routes receives a request.
    //Furthermore, a transform, respond and error function can be defined.
    function createHandler(handlerObject, path) {
        handlerObject = extendHandlerObject(handlerObject, path);
        return handler.bind(handlerObject);
    }

    function handler(req, res) {
        var handlerObject = this;
        Promise.cast(req)
            .bind(virgilioHttpNs)
            .then(handlerObject.transform)
            .then(handlerObject.execute)
            .then(function(response) {
                return handlerObject.respond(response, res);
            })
            .catch(function(error) {
                return handlerObject.error(error, res);
            }).done();
    }

    //**extendHandlerObject** sets default transform, respond and error
    //functions on the handlerObject.
    function extendHandlerObject(handlerObject, path) {
        //Instead of passing an object with only a handler property,
        //the user can pass just that property (the action name, a string).
        //In that case, create a full-fledged handlerObject now.
        if (typeof handlerObject === 'string') {
            handlerObject = {
                handler: handlerObject,
            };
        }
        //Create a function that will execute the handler action when called.
        handlerObject.execute = executeHandlerAction.bind(handlerObject);
        //Extend the handlerObject with defaults.
        handlerObject.transform =
                handlerObject.transform || getDefaultTransform(path);
        handlerObject.respond = handlerObject.respond || defaultRespond;
        handlerObject.error = handlerObject.error || defaultError;
        return handlerObject;
    }

    function executeHandlerAction(args) {
        var handlerObject = this;
        args = [handlerObject.handler].concat(args);
        var result = virgilioHttpNs.execute.apply(virgilioHttpNs, args);
        if (handlerObject.timeout) {
            result.withTimeout(handlerObject.timeout);
        }
        return result;
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
        return defaultTransform.bind(params);
    }

    function defaultTransform(req) {
        var params = this;
        var args = params.map(function(param) {
            return req.params[param];
        });
        args.push(req.body);
        return args;
    }

    function defaultRespond(response, res) {
        res.send(200, response);
    }

    function defaultError(error) {
        throw error;
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
            return virgilioHttpNs.execute('auth.checkSession', sessionId,
                                        authRouteInfo)
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
};
