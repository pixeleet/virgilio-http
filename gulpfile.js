var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var docco = require('gulp-docco');
var jshint = require('gulp-jshint');
var istanbul = require('gulp-istanbul');
var rimraf = require('gulp-rimraf');
var exampleToTest = require('gulp-example-to-test');
var replace = require('gulp-replace');
var insert = require('gulp-insert');
var runSequence = require('run-sequence');

function onError(error) {
    gutil.log(error);
    process.exit(1);
}

var newConcordiaRegex = /^(.*Concordia\()(.*)(\).*)$/m;
var exampleTestHeader = fs.readFileSync('./helpers/example-test-header.js');
var exampleTestFooter = fs.readFileSync('./helpers/example-test-footer.js');

//Help module
require('gulp-help')(gulp);

//Testing
gulp.task('test', 'Run tests', function(callback) {
    runSequence(
        'example-tests',
        callback
    );
});

gulp.task('example-tests', function(callback) {
    runSequence(
        'clean-example-tests',
        'generate-example-tests',
        'run-example-tests',
        callback
    );
});

gulp.task('run-example-tests', function() {
    return gulp.src('./example-tests/*.js')
        .pipe(mocha({
            ui: 'qunit',
            reporter: 'spec'
        }));
});

gulp.task('generate-example-tests', function() {
    return gulp.src('./examples/*.js')
        .pipe(exampleToTest())
        .pipe(insert.prepend(exampleTestHeader))
        .pipe(insert.append(exampleTestFooter))
        .pipe(replace(/Concordia\(\)/, 'Concordia({})'))
        .pipe(replace(newConcordiaRegex, '$1_.extend(loggerConfig, $2)$3'))
        .on('error', onError)
        .pipe(gulp.dest('./example-tests'));
});

gulp.task('clean-example-tests', function() {
    return gulp.src('./example-tests', { read: false })
        .pipe(rimraf());
});

gulp.task('coverage', function(callback) {
    runSequence(
        'setup-istanbul',
        'test',
        'report-istanbul',
        callback
    );
});

//Code Coverage
gulp.task('setup-istanbul', function(callback) {
    gulp.src(['lib/**/*.js', 'index.js'])
        .pipe(istanbul())
        .on('finish', callback);
});

gulp.task('report-istanbul', function() {
    return gulp.src(['lib/**/*.js', 'index.js'])
        .pipe(istanbul.writeReports());
});

//Annotated Sourcecode
gulp.task('docs', 'Build the documentation', function () {
    gulp.src(['lib/concordia-http.js'])
        .pipe(docco())
        .pipe(gulp.dest('./docs'));
});

//Linting
gulp.task('lint', 'Execute JSHint checks on the code', function () {
    gulp.src(['lib/**/*.js', 'examples/**/*.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});
