var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    docco = require('gulp-docco');

// Help module
require('gulp-help')(gulp);

gulp.task('test', 'Run the application tests', function () {
    // Modules used in tests must be loaded in this task
    var must = require('must');
    return gulp.src(['./examples/**/*.test.js', './tests/**/*.test.js'])
        .pipe(mocha({
            reporter: 'spec'
        }))
        .once('end', function() {
            process.exit();
        });
});

gulp.task('docs', 'Build the documentation', function () {
    gulp.src(['lib/virgilio-http.js'])
        .pipe(docco())
        .pipe(gulp.dest('./docs'));
});
