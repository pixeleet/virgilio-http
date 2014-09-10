/* global concordia, schema */
//--- GOAL ---
//The goal of this release is to take a step back with concordia-http and let
//restify and bluebird do more of the heavy lifting, while still promoting the
//seperation of concordia-http way of working.
//As a result, we expect the module to become less complex and easier to use.

//--- EXAMPLES ---
//This is a proposal for the new concordia-http api in examples.
//Each example illustrates a specific feature. Features can be mixed.

//`concordia.foo` is an action.
concordia.defineAction$('foo', function() {});

// --- create an endpoint with defaults ---
//`concordia.foo` gets called with [ <params.fooId>, <req.body> ]
//The result of concordia.foo is returned with a 200 status code.
concordia.foo.post('/foo/:fooId');

// --- create an endpoint with custom transformer ---
//The old `transform`, `respond` and `error` are replaced with one function.
//Advantages:
//  1. More flexibility (example: respond functions that need req object).
//  2. Easier to use because similar to normal request handlers. Less to know.
//Instead of a `next` callback, the returned promise triggers the next mw.
concordia.foo
    .post('/foo/:fooId')
    .transform(function(req, res) {
        var id = req.params.id;
        return this.execute$(id, req.body)
            .then(function(result) {
                res.send(200, result);
            })
            .catch(concordia.NotFoundError, function() {
                res.send(404);
            });
    });

// --- create an endpoint with middlewares ---
//`.addHandler` is an alias for `.transform`.
//A `.transform` called without arguments calls the default transform.
var mw = concordia.http.middlewares;
concordia.foo
    .post('/foo/:fooId')
    .addHandler(mw.validate(schema))
    .transform()    //Question: perhaps call this one `.execute`?
    .addHandler(mw.ie8Transform());

// --- create endpoints in a traditional way ---
//This is usefull specifically when calling multiple actions in a route.
concordia.http
    .post('/foo/:fooId')
    .addHandler(function(req, res) {
        var concordia = this;
        return concordia.customAuth(req.headers.auth)
            .then(function(result) {
                if (result) {
                    return;
                }
                res.send(401);
                return false;   //Don't execute more handlers.
            });
    })
    .addHandler(function(req, res) {
        var concordia = this;
        var id = req.params.id;
        return concordia.execute$(id, req.body)
            .then(function(result) {
                res.send(200, result);
            });
    });

// --- register middlewares ---
//Restify's default plugins can be found on `concordia.http.middlewares`.
//This object can be extended with custom middlewares.
var mw = concordia.http.middlewares;
concordia.http
    .use(mw.bodyParser());
