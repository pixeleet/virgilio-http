/* global describe, it*/
var virgilio = require('../');
var request = require('supertest');
var url = 'http://localhost:8080';

describe('number tests', function() {
    it('handles requests', function(done) {
        request(url)
            .post('/number/add')
            .send({ num1: 4, num2: 3 })
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.must.equal('The answer is: 7');
                done();
            });
    });
    it('handles requests using the default transform function', function(done) {
        request(url)
            .get('/number/subtract/9/5')
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.must.equal(4);
                done();
            });
    });
    it('registers custom middleware', function(done) {
        request(url)
            .get('/number/subtract/9/5')
            .set('foo', 'bar')
            .expect(242, done);
    });
    describe('authenticated endpoints', function() {
        it('refuse access when the session is invalid', function(done) {
            request(url)
                .get('/number/someNumber')
                .expect(403, done);
        });
        it('allow access when the session is valid', function(done) {
            request(url)
                .get('/number/someNumber')
                .set('session-id', 'user-session')
                .expect(200, done);
        });
    });
});
