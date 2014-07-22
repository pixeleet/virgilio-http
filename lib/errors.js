var errors = [{
    name: 'ValidationError',
    init: function(error) {
        this.message = error.message;
    }
}];

module.exports = errors;
