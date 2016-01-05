var gulp = require('gulp'),
  eslint = require('gulp-eslint'),
  mocha = require('gulp-mocha');

var running = {};
var watching = {};

gulp.task('lint', () => {
  running.lint = ['gulpfile.js', 'lib/**/*.js', 'test/**/*.spec.js'];
  return gulp.src(running.lint)
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('test', () => {
  running.test = ['lib/**/*.js', 'test/**/*.spec.js'];
  return gulp.src(running.test[1])
    .pipe(mocha({reporter: 'spec'}));
});

gulp.task('watch', () => {
  Object.keys(running)
    .filter(task => !watching[task])
    .forEach(task => {
      watching[task] = true;
      gulp.watch(running[task], [task]);
    });
});
