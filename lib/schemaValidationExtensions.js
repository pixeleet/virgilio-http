var tv4 = require('tv4');

var REGEX_ISO_DATE_TIME = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

tv4.addFormat('date-time', function(data) {
    if (typeof data === 'string' && REGEX_ISO_DATE_TIME.test(data)) {
        return null;
    }
    return 'must be string with a valid ISO 8601 datetime format';
});
