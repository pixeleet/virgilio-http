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
