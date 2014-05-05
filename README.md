# Virgilio-http
A restify-based virgilio-extension, for making actions available as http-endpoints.

## Getting started
Load virgilio-http before loading a module that depends on it.

	require('virgilio')()
		.use('virgilio-http')
		.looadModule('http-user');

The http module extends the virgilio instance with a convenience function for registering endpoints.

	virgilio.http({
		'/products': {
			GET: 'product.list',
			POST: 'product.add'
		},
		'/number': {
			'/add': {
				POST: 'number.add'
			},
			'/subtract': {
				POST: 'number.subtract'
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

### virgilio.httpUse( middleware [, options] )
Use a certain middleware.
`middleware` can be a function with a standard `(req, res, next)` signature.
Alternatively, you can provide the name of one of restify's built-in middlewares (for instance: `bodyParser`).
In that case, you can also pass an optional `options` object, which is passed directly to that middlewares constructor.
