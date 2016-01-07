var gulp = require('gulp'),
  eslint = require('gulp-eslint'),
  mocha = require('gulp-mocha'),

  templateCache = require('gulp-angular-templatecache'),
  bowerFiles = require('main-bower-files'),
  concat = require('gulp-concat'),
  sourcemaps = require('gulp-sourcemaps'),
  sass = require('gulp-sass'),
  babel = require('gulp-babel'),
  uglify = require('gulp-uglify'),
  htmlmin = require('gulp-htmlmin'),
  template = require('gulp-template'),
  sequence = require('run-sequence'),
  fs = require('fs-promise'),
  path = require('path');

var running = {};
var watching = {};

gulp.task('lint', () => {
  running.lint = ['gulpfile.js', 'lib/**/*.js', 'test/**/*.spec.js', 'webclient/src/**/*.js'];
  return gulp.src(running.lint)
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('test', () => {
  running.test = ['lib/**/*.js', 'test/**/*.spec.js'];
  return gulp.src(running.test[1])
    .pipe(mocha({reporter: 'spec'}));
});

gulp.task('webclient:dependencies', () => {
  running['webclient:dependencies'] = 'webclient/bower.json';
  return gulp
    .src(bowerFiles({
      paths: {
        bowerDirectory: 'webclient/bower_components',
        bowerJson: 'webclient/bower.json'
      }
    }))
    .pipe(sourcemaps.init())
    .pipe(concat('dependencies.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('webclient/temp'));
});

gulp.task('webclient:code', () => {
  running['webclient:code'] = ['webclient/src/**/*.module.js', 'webclient/src/**/*.js'];
  return gulp.src(running['webclient:code'])
    .pipe(sourcemaps.init())
    .pipe(babel({presets: ['es2015']}))
    .pipe(concat('code.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('webclient/temp'));
});

gulp.task('webclient:templates', () => {
  running['webclient:templates'] = ['webclient/src/**/*.html', '!webclient/src/index.html'];
  return gulp.src(running['webclient:templates'])
    .pipe(sourcemaps.init())
    .pipe(templateCache('templates.js', {
      module: 'oracle-client',
      base: path.resolve('./webclient/src')
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('webclient/temp'));
});

gulp.task('webclient:css', () => {
  running['webclient:css'] = 'webclient/src/**/*.scss';
  return gulp.src(running['webclient:css'])
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(concat('oracle-client.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('webclient/temp'));
});

gulp.task('webclient:scripts', () => {
  running['webclient:scripts'] = [
    'webclient/temp/dependencies.js',
    'webclient/temp/code.js',
    'webclient/temp/templates.js'
  ];
  return gulp.src(running['webclient:scripts'])
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(concat('oracle-client.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('webclient/temp'));
});

gulp.task('webclient:build', () => {
  var html = './webclient/src/index.html',
    js = './webclient/temp/oracle-client.js',
    css = './webclient/temp/oracle-client.css';
  running['webclient:build'] = [html, js, css];

  return Promise
    .all([
      fs.readFile(path.resolve(css), {encoding: 'utf-8'}),
      fs.readFile(path.resolve(js), {encoding: 'utf-8'})
    ])
    .then(files => {
      return gulp.src(html)
        .pipe(template({style: files[0], script: files[1]}))
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('webclient/dist'));
    });
});

gulp.task('webclient', () => sequence(
  ['webclient:dependencies', 'webclient:code', 'webclient:templates', 'webclient:css'],
  'webclient:scripts',
  'webclient:build',
  'watch'
));

gulp.task('watch', () => {
  Object.keys(running)
    .filter(task => !watching[task])
    .forEach(task => {
      watching[task] = true;
      gulp.watch(running[task], [task]);
    });
});
