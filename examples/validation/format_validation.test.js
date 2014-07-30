var virgilio = require('./');
var request = require('supertest');
var url = 'http://localhost:9996';

describe('Format validation test', function() {
    it('expects to accept valid dates', function(done) {
        request(url)
            .post('/validate/date')
            .send({ dateToValidate: '2014-03-04T12:16:22.478Z' })
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.must.equal('Date: 2014-03-04T12:16:22.478Z is valid');
                done();
            });
    });

    it('expects to accept valid local dates', function(done) {
        request(url)
            .post('/validate/date')
            .send({ dateToValidate: '2014-03-04T15:16:22.478+03:00' })
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.must.equal('Date: 2014-03-04T15:16:22.478+03:00 is valid');
                done();
            });
    });

    it('expects to reject invalid dates', function(done) {
        request(url)
            .post('/validate/date')
            .send({ dateToValidate: 'foooo' })
            .expect(400)
            .end(function(err, res) {
                if (err) { return done(err); }
                done();
            });
    });
});
