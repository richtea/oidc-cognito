"use strict";

var gulp = require('gulp');
var tape = require('gulp-tape');
var tapColorize = require('tap-colorize');

var argv = require('yargs')
  .option('nocolor', {
      type: 'boolean',
      nargs: 0,
      default: false
  })
  .argv;

gulp.task('test', function() {
    let reporter = null;  

    if (!argv.nocolor) {
        reporter = tapColorize();
    }
    return gulp.src('**/*.spec.js')
        .pipe(tape({
            reporter: reporter
        }));
});
