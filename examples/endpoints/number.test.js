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

/* global describe, it */
var virgilio = require('./');
var request = require('supertest');
var url = 'http://localhost:9997';

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
    it('publishes a message when a new route is added', function(done) {
        virgilio.subscribe('http.newRoute', function(path) {
            var error = null;
            try {
                path.must.equal('/foo');
            } catch(err) {
                error = err;
            }
            done(error);
        });
        virgilio.http({
            '/foo': {
                GET: 'do.something'
            }
        });
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

    describe('Error handling', function() {
        it('handle correctly custom errors', function(done) {
            request(url)
                .get('/number/trigger/error')
                .expect(418, done);
        });
    });
});
