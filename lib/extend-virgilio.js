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
    //The http-namespace instance of virgilio.
    var virgilioHttpNs = this;
    var HTTP_METHODS = ['get', 'post', 'put', 'del', 'head', 'opts', 'patch'];

    virgilioHttpNs.baseVirgilio$.http = function(routeObject, basePath) {
        forEachRoute(routeObject, basePath, registerRoute);
        return this;
    };

    virgilioHttpNs.baseVirgilio$.httpUse = function(middleware, options) {
        this.publish('http.registerMiddleware', middleware, options);
        return this;
    };

    var registerRoute = function(path, method, handlerObject) {
        this.stringifyHandlerObjectFunctions(handlerObject);
        this.publish('http.registerRoute', path, method, handlerObject);
    }.bind(virgilioHttpNs);

    //Iterate over a routeObject and call an iterator for each route contained.
    //The iterator is called with a (path, method, handlerObj) signature.
    function forEachRoute(routeObject, basePath, iterator) {
        basePath = sanitizePath(basePath || '');
        var routes = Object.keys(routeObject);
        routes.forEach(function(key) {
            var route = routeObject[key];
            var method = key.toLowerCase();
            //Check if the key of the routeObject is an http method.
            if (HTTP_METHODS.indexOf(method) >= 0) {
                iterator(basePath, method, route);
            }
            else {
                //Recursively call registerRoutes with the extended path.
                var path = basePath + sanitizePath(key);
                forEachRoute(route, path, iterator);
            }
        });
    }

    //**sanitizePath** alters a path to ensure it only has a leading '/'.
    //This way, sanitized paths can be safely concatenated.
    function sanitizePath(path) {
        var transformedPath = path.replace(/^\/?(.+)\/?$/, '/$1');
        return transformedPath;
    }
};
