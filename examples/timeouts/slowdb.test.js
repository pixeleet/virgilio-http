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

/* global describe, it*/
var virgilio = require('./');
var request = require('supertest');
var url = 'http://localhost:8081';

describe('slowdb tests', function() {
    it('returns a 500 if the request times out', function(done) {
        request(url)
            .get('/getRecord')
            .expect(500)
            .end(function(err, response) {
                done(err);
            });
    });
    it('allows default timeout to be changed', function(done) {
        request(url)
            .get('/getRecordSlowly')
            .expect(200)
            .end(function(err, response) {
                done(err);
            });
    });
});
