# Virgilio-http
[![Stories in Ready](https://badge.waffle.io/icemobilelab/virgilio-http.png?label=ready&title=Ready)](https://waffle.io/icemobilelab/virgilio-http)
[![wercker status](https://app.wercker.com/status/028d516f144b22cc1426d1273054cf6b/s "wercker status")](https://app.wercker.com/project/bykey/028d516f144b22cc1426d1273054cf6b)
[![NPM version](https://badge.fury.io/js/virgilio-http.svg)](http://badge.fury.io/js/virgilio-http)

A restify-based virgilio-extension, for making actions available as http-endpoints.

## Getting started
Load virgilio-http before loading a module that depends on it.

	var virgilio = require('virgilio')()
        .loadModule(require('virgilio-http'))
            .httpUse('bodyParser')
        .loadModule(number);

The http module extends the virgilio instance with a convenience function for registering endpoints.

	virgilio.http({
		'/products': {
			GET: 'product.list',
			POST: 'product.add'
		},
		'/number': {
			'/add': {
				POST: {
                    handler: 'number.add',
                    transform: function(req) {
                        var body = req.body;
                        return [body.num1, body.num2];
                    },
                    respond: function(result, res) {
                        var answer = 'The answer is: ' + result;
                        res.send(200, answer);
                    },
                    error: function(err, res) {
                        res.send(500, err.message);
                    }
                }
			},
			'/subtract/:num1/:num2': {
				GET: 'number.subtract'
			}
		}
	});

## API
This module extends virgilio with two methods.
One for adding routes and another for adding middlewares.

### virgilio.http( routeObject )
Register one or more routes (see the example above).
A routeObject is a list of key,value pairs.
Each key is either a subroute, in which case the correspoding value is a sub-routeObject.
Alternatively, a key can be an http-method, in which case the correspoding value is a handlerObject.

A handler object can contain the following properties:

#### handler
The name of the action this endpoint calls.

If you only want to define a handler and use the default transform, respond and error functions,
you can supply just the handler string instead of the handlerObject (see example above).

#### transform
A function that gets the restify req object of a request, and needs to return an array of arguments.
The handler action will be called with the array as argument list.

When no transform function is defined, a default one is used.
This one returns as arguments list all url parameters and lastly the body:

    POST /foo/:param1/:param2 -> [param1, param2, body]

#### respond
A function that receives the value returned by the handler and the restify res object.
Its responsiblity is to send a correctly formatted response.

The default respond function used simply does a `res.send(200, result)`.

#### error
Like the respond method, but called when an error is thrown while handling an incoming request.

The default error function does a `res.send(500, 'An error occured')`.

#### timeout
The timeout (in ms) determines the maximum amount of time a request should take.
If a request takes longer, an error is thrown.


### virgilio.httpUse( middleware [, options] )
Use a certain middleware.
`middleware` can be a function with a standard `(req, res, next)` signature.
Alternatively, you can provide the name of one of restify's built-in middlewares (for instance: `bodyParser`).
In that case, you can also pass an optional `options` object, which is passed directly to that middlewares constructor.

## Options
Virgilio-http supports the following options:

    var options = {
        http: {
            port: 8080,
            restify: {},
            authRoutes: {}
        }
    }

### port (default: 8080)
The port Virgilio-http listens on.

### restify (default: {})
Options to pass to restify.createServer().

### authRoutes (default: {})
A map of routes, where each key is a path that exactly matches the path provided to `virgilio.http()`.
This will require an authentication extension to be loaded to work.
All routes in this map require authentication to access.
Calls to these routes need to pass a sessionId in a `session-id` header.
Virgilio-http will call `auth.checkSession` with this sessionId and the value of this route in the authRoutes map.
The authentication module can use this to determine whether the user has access to this particular route.
