var restify = require('restify');
module.exports = function(options) {
    var virgilio = this;
    var Promise = virgilio.Promise;
    var server = restify.createServer();
    var httpMethods = ['get', 'post', 'put', 'delete', 'head'];

    virgilio.namespace('http')
        .defineAction('registerRoutes', registerRoutes)
        .defineAction('registerMiddleware', registerMiddleware);

    function registerRoutes(routeObject, basePath) {
        basePath = sanitizePath(basePath || '/');
        var routes = Object.keys(routeObject);
        routes.forEach(function(key) {
            key = key.toLowerCase();
            var route = routeObject[key];
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
        if (typeof handlerObject === 'string') {
            handlerObject = {
                handler: handlerObject,
            };
        }
        var handler = function(req, res, next) {
            var virgilio = this;
            virgilio.execute(handlerObject.handler);
        }.bind(virgilio);

        return handler;
    }

    function sanitizePath(path) {
        //Transform basePath to have one ending and no leading '/'.
        var transformedPath = path.replace(/\/?([^\/]+)\/?/, '$1/');
        return transformedPath;
    }

    function registerMiddleware(middleware) {

    }
};
