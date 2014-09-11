# Concordia-http
[![wercker status](https://app.wercker.com/status/95adf712cc6bc48d5a579875ff4c6529/s/master "wercker status")](https://app.wercker.com/project/bykey/95adf712cc6bc48d5a579875ff4c6529)
[![NPM version](https://badge.fury.io/js/concordia-http.svg)](http://badge.fury.io/js/concordia-http)
[![Gitter chat](https://badges.gitter.im/ConcordiaJS/concordia-http.png)](https://gitter.im/ConcordiaJS/concordia-http)

A restify-based concordia-extension, for making actions available as HTTP-endpoints.
Easily add http-endpoints to your concordia-actions. Based on the excellent
[restify](http://mcavage.me/node-restify/).

## Usage

Lets suppose we created a concordia action `foo`:

```javascript
concordia.defineAction$('add', function(num1, num2) {
    return num1 + num2;
})
```

Let's make this action available over HTTP:

```javascript
concordia.add.get('/add/:number1/:number2');
```

And that's it!

By default, an action gets called with the parameters in the url followed by the
request body as arguments. The response of the action will be returned with a
200 status code. If you want different behaviour, you can define your own
transform:

```javascript
//This example requires the `bodyParser` middleware.
concordia.add.post('/add')
    .transform(function(req, res) {
        var body = req.body;
        return this.execute$(body.number1, body.number2)
            .then(function(result) {
                res.send(200, { answer: result });
            });
    });
```

In other words, it's just like an ordinary middleware, with the exception that
you can use `this.execute$` to call the underlying action and the absence of a
`next` callback. Instead, the returned promise, once resolved, triggers the next
middleware.

Now suppose you want to add some validation to this route. Easy:

```javascript
concordia.add.get('/add/:number1/:number2')
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
concordia.http.use(concordia.http.bodyParser());
```

Restify's bundled middlewares are made available from `concordia.http`. It is
advised extensions that add additional middlewares also store them there.

## More Tags
[![Code Climate](https://codeclimate.com/github/ConcordiaJS/concordia-http/badges/gpa.svg)](https://codeclimate.com/github/ConcordiaJS/concordia-http)
[![Test Coverage](https://codeclimate.com/github/ConcordiaJS/concordia-http/badges/coverage.svg)](https://codeclimate.com/github/ConcordiaJS/concordia-http)
[![Dependency Status](https://gemnasium.com/ConcordiaJS/concordia-http.svg)](https://gemnasium.com/ConcordiaJS/concordia-http)
