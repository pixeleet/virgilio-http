var gulp = require('gulp');
var mocha = require('gulp-mocha');
var docco = require('gulp-docco');
var jshint = require('gulp-jshint');
var istanbul = require('gulp-istanbul');
var exit = require('gulp-exit');

// Help module
require('gulp-help')(gulp);

gulp.task('test', 'Run the application tests', function () {
    // Modules used in tests must be loaded in this task
    require('must');
    gulp.src(['./examples/**/*.test.js', './tests/**/*.test.js'])
        .pipe(mocha({
            reporter: 'spec'
        }))
        .pipe(exit());
});

gulp.task('coverage', 'Create istanbul code coverage report form tests',
            function (cb) {
    gulp.src(['lib/**/*.js', 'index.js'])
        .pipe(istanbul())
        .on('finish', function () {
            var must = require('must');
            gulp.src(['./examples/**/*.test.js', './tests/**/*.test.js'])
                .pipe(mocha())
                .pipe(istanbul.writeReports())
                .on('end', cb);
        });
});

gulp.task('docs', 'Build the documentation', function () {
    gulp.src(['lib/virgilio-http.js'])
        .pipe(docco())
        .pipe(gulp.dest('./docs'));
});

gulp.task('lint', 'Execute JSHint checks on the code', function () {
    gulp.src(['lib/**/*.js', 'examples/**/*.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});
