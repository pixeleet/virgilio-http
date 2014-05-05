var restify = require('restify');
module.exports = function(options) {
    var virgilio = this;
    var port = (options.http && options.http.port) || '8080';
    var Promise = virgilio.Promise;
    var server = restify.createServer();
    var httpMethods = ['get', 'post', 'put', 'del', 'head'];

    virgilio = virgilio.namespace('http')
        .defineAction('registerRoutes', registerRoutes)
        .defineAction('registerMiddleware', registerMiddleware);

    virgilio.baseVirgilio$.http = function(routeObject, basePath) {
        virgilio.execute('registerRoutes', routeObject, basePath);
    };

    server.listen(port, function() {
        virgilio.log.info('Http server listening on port: %s', port);
    });

    function registerRoutes(routeObject, basePath) {
        basePath = sanitizePath(basePath || '/');
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
        virgilio.log.info('Registering http endpoint: %s %s', method, path);
        server[method](path, handler);
    }

    function createHandler(handlerObject, path) {
        handlerObject = extendHandlerObject(handlerObject, path);

        var handler = function(req, res, next) {
            var handlerObject = this;
            Promise.cast(req)
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

    function sanitizePath(path) {
        //Transform basePath to have one ending and no leading '/'.
        var transformedPath = path.replace(/\/?([^\/]+)\/?/, '$1/');
        return transformedPath;
    }

    function registerMiddleware(middleware) {

    }
};
