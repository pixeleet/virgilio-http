# Virgilio-http
[![wercker status](https://app.wercker.com/status/028d516f144b22cc1426d1273054cf6b/s/master "wercker status")](https://app.wercker.com/project/bykey/028d516f144b22cc1426d1273054cf6b)
[![NPM version](https://badge.fury.io/js/virgilio-http.svg)](http://badge.fury.io/js/virgilio-http)

A binding to use [restify](http://mcavage.me/node-restify/) with virgilio, for making actions available as HTTP-endpoints.
Easily add http-endpoints to your virgilio-actions.

## Usage

Lets suppose we created a virgilio action `allcaps`:

```javascript
virgilio.defineAction$('allcaps', function(word) {
    return word.toUpperCase() + '!';
})
```

Let's make this action available over HTTP:

```javascript
virgilio.allcaps.get('/allcaps/virgilio');
```

And that's it!

By default, an action gets called with the parameters in the url followed by the
request body as arguments. The response of the action will be returned with a
200 status code. If you want different behaviour, you can define your own
transform:

```javascript
//This example requires the `bodyParser` middleware.
virgilio.add.post('/allcaps')
    .transform(function(req, res) {
        var words = req.body;
        return this.execute$(words.join(' '))
            .then(function(result) {
                res.send(200, { scream: result });
            });
    });
```

In other words, it's just like an ordinary middleware, with the exception that
you can use `this.execute$` to call the underlying action and the absence of a
`next` callback. Instead, the returned promise, once resolved, triggers the next
middleware.

Now suppose you want to add some validation to this route. Easy:

```javascript
virgilio.add.get('/allcaps/:words')
    .addHandler(myValidationMiddleware(schema))
    .addHandler(myAuthenticationMiddleware())
    .transform();
```

Each function passed to `addHandler` gets called with a `req` and `res` object
and should return a promise that will trigger the next handler in the stack. A
`transform` with no arguments will insert the default handler described above at
that position.

Of course, it's also possible to add generic middleware to be used with every
route:

```javascript
virgilio.http.use(virgilio.http.bodyParser());
```

Restify's bundled middlewares are made available from `virgilio.http`. It is
advised extensions that add additional middlewares also store them there.

## More Tags
[![Code Climate](https://codeclimate.com/github/icemobilelab/virgilio-http/badges/gpa.svg)](https://codeclimate.com/github/icemobilelab/virgilio-http)
[![Test Coverage](https://codeclimate.com/github/icemobilelab/virgilio-http/badges/coverage.svg)](https://codeclimate.com/github/icemobilelab/virgilio-http)
[![Dependency Status](https://gemnasium.com/icemobilelab/virgilio-http.svg)](https://gemnasium.com/icemobilelab/virgilio-http)
