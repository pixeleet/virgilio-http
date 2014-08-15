var format = require('util').format;

//tv4 returns an error code, a number which corresponds to a more descriptive
//code. The codes are stored on tv4.errorCodes, like so: `{ 'FOO_ERROR': 5 }`
//We create an inverted map, which allows us to easily look up the descripte
//string based on the number.
var tv4ErrorCodes = require('tv4').errorCodes;
var tv4ErrorCodeNames = Object.keys(tv4ErrorCodes);
var tv4ErrorCodeMap = tv4ErrorCodeNames.reduce(function(codeMap, codeName) {
    var codeId = tv4ErrorCodes[codeName];
    codeMap[codeId] = codeName;
    return codeMap;
}, {});


var errors = [{
    name: 'ValidationError',
    init: function(error) {
        var errorCode = error.code;
        //Allow for the possiblity that a user-generated validationError, which
        //provides its own custom errorCode.
        if (typeof errorCode === 'number') {
            errorCode = tv4ErrorCodeMap[errorCode];
        }
        errorCode = errorCode.toLowerCase();
        var dataPath = error.dataPath;
        this.message = format('[%s] %s', dataPath, error.message);
        this.code = format('validation.%s.%s)', dataPath, errorCode);
    }
}];

module.exports = errors;
