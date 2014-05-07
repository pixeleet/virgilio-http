var options = {
    http: {
        authRoutes: {
            '/number/someNumber': 'user-session'
        }
    }
};
module.exports = require('virgilio')(options)
    //Normally we'd use this, but we can't require virgilio-http
    //from inside its own project.
    //.use('http')
    .loadModule(require('../../'))
        .httpUse('bodyParser')
        .httpUse(fooMiddleware)
    .loadModule(require('./number'))
    //Ordinarily, the auth.checkSession would be provided by an
    //authentication extension. For testing purposes we define
    //a simple one ourselves.
    .defineAction('auth.checkSession', checkSession);

function fooMiddleware(req, res, next) {
    if (req.headers.foo === 'bar') {
        return res.send(242);
    }
    next();
}

function checkSession(sessionId, authRouteInfo) {
    var response = null;
    if (sessionId === authRouteInfo) {
        response = {
            result: true
        };
    } else {
        response = {
            result: false,
            reason: 'fail'
        };
    }
    return response;
}
