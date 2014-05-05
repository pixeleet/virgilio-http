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
        var handler = createHandler(handlerObject);
        virgilio.log.info('Registering http endpoint: %s %s', method, path);
        server[method](path, handler);
    }

    function createHandler(handlerObject) {
        handlerObject = extendHandlerObject(handlerObject);

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

    function extendHandlerObject(handlerObject) {
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
        handlerObject.transform = handlerObject.transform || defaultTransform;
        handlerObject.respond = handlerObject.respond || defaultRespond;
        handlerObject.error = handlerObject.error || defaultError;
        handlerObject.fallbackError = defaultError;
        return handlerObject;
    }

    function defaultTransform(req) {
        return req.body;
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
