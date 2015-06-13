/*eslint-env node*/
var argv = require('yargs').argv,
    babelify = require('babelify'),
    browserify = require('browserify'),
    browserifyShim = require('browserify-shim'),
    buffer = require('vinyl-buffer'),
    concat = require('gulp-concat'),
    connect = require('connect'),
    eslint = require('gulp-eslint'),
    frontmatter = require('gulp-front-matter'),
    gif = require('gulp-if'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    layout = require('./lib/layout'),
    less = require('gulp-less'),
    livereload = require('gulp-livereload'),
    markdown = require('./lib/markdown'),
    merge = require('merge-stream'),
    minifyhtml = require('gulp-minify-html'),
    page = require('./lib/page'),
    path = require('path'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename'),
    serveStatic = require('serve-static'),
    sitemap = require('./lib/sitemap'),
    size = require('gulp-size'),
    source = require('vinyl-source-stream'),
    uglify = require('gulp-uglify'),
    utils = require('./lib/utils');

var config = {
  dev: argv.dev,
  dist: !argv.dev,
  port: process.env.PORT || 9000
};

var site = {
  encoding: 'utf8',
  dev: config.dev,
  dist: config.dist,
  target: path.resolve(__dirname, 'target'),
  data: require('./data'),
  sitemaps: {},
  layouts: {},
  pages: []
};

var errorHandler = function () {
  return plumber({
    errorHandler: !config.dev ? false : function (err) {
      if (err.plugin) {
        gutil.log('Error in plugin \'' + gutil.colors.cyan(err.plugin) + '\'', gutil.colors.red(err.message));
      } else {
        gutil.log('Error', gutil.colors.red(err.message));
      }
      gutil.beep();
    }
  });
};

gulp.task('site-sitemaps', function () {
  return gulp.src(['./src/sitemaps/*.yml'])
    .pipe(errorHandler())
    .pipe(sitemap.load(site));
});

gulp.task('site-layouts', function () {
  return gulp.src(['./src/layouts/*.html'])
    .pipe(errorHandler())
    .pipe(frontmatter())
    .pipe(layout.list(site));
});

gulp.task('site-pages', function () {
  return gulp.src(['./src/pages/**/*.{html,md}'])
    .pipe(errorHandler())
    .pipe(frontmatter())
    .pipe(page.list(site));
});

gulp.task('pages', ['site-sitemaps', 'site-layouts', 'site-pages'], function () {
  var html = gulp.src(['./src/pages/**/*.html'])
    .pipe(errorHandler())
    .pipe(frontmatter());

  var md = gulp.src(['./src/pages/**/*.md'])
    .pipe(errorHandler())
    .pipe(frontmatter())
    .pipe(markdown.render());

  return merge(html, md)
    .pipe(errorHandler())
    .pipe(layout.apply(site))
    .pipe(page.render(site))
    .pipe(page.resolveLinks(site))
    .pipe(rename({ extname: '.html' }))
    .pipe(gif(config.dist, minifyhtml()))
    .pipe(gulp.dest('./target'))
    .pipe(utils.reload());
});

gulp.task('assets-styles', function () {
  return gulp.src('./src/assets/styles/main.less')
    .pipe(errorHandler())
    .pipe(less({ compress: config.dist }))
    .pipe(size({ showFiles: true, gzip: config.dist }))
    .pipe(gulp.dest('./target/assets/styles'))
    .pipe(utils.reload());
});

gulp.task('assets-scripts', function () {
  var bundler = browserify('./src/assets/scripts/main.js')
    .external([
      'jquery',
      'bootstrap',
      'react'
    ])
    .transform(babelify)
    .transform(browserifyShim);


  var bundle = function () {
    return bundler.bundle()
      .pipe(errorHandler())
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(gif(config.dist, uglify({ preserveComments: 'some' })))
      .pipe(size({ showFiles: true, gzip: config.dist }))
      .pipe(gulp.dest('./target/assets/scripts'))
      .pipe(utils.reload());
  };

  return bundle();
});

gulp.task('assets-images', function () {
  return gulp.src('./src/assets/images/**/*.{png,jpg,gif}')
    .pipe(errorHandler())
    .pipe(gulp.dest('./target/assets/images'))
    .pipe(utils.reload());
});

gulp.task('assets-fonts', function () {
  return gulp.src('./src/assets/fonts/**/*')
    .pipe(errorHandler())
    .pipe(gulp.dest('./target/assets/fonts'))
    .pipe(utils.reload());
});

gulp.task('vendor-scripts', function () {
  return gulp.src([
    './node_modules/jquery/dist/jquery.js',
    './node_modules/bootstrap/dist/js/bootstrap.js'
  ])
    .pipe(concat('vendor.js'))
    .pipe(gif(config.dist, uglify({ preserveComments: 'some' })))
    .pipe(size({ showFiles: true, gzip: config.dist }))
    .pipe(gulp.dest('./target/assets/scripts/vendor.js'));
});

gulp.task('eslint', function () {
  return gulp.src(['./gulpfile.js', './data.js', './{lib,src}/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gif(config.dist, eslint.failOnError()));
});

gulp.task('connect', ['build'], function (/*next*/) {
  connect()
    .use(serveStatic('./target'))
    .listen(config.port, function () {
      gutil.log('Listening on http://localhost:' + config.port + '/');
      //next();
    });
});

gulp.task('watch', ['build'], function () {
  livereload.listen({ auto: true });
  gulp.watch('./src/**/*.{html,md,yml}', ['pages']);
  gulp.watch('./src/assets/styles/**/*.{css,less}', ['assets-styles']);
  gulp.watch('./src/assets/scripts/**/*.{js,jsx}', ['assets-scripts']);
  gulp.watch('./src/assets/images/**/*.{png,jpg,gif}', ['assets-images']);
});

gulp.task('site', ['site-sitemaps', 'site-pages', 'site-layouts']);
gulp.task('assets', ['assets-styles', 'assets-scripts', 'assets-images', 'assets-fonts']);
gulp.task('vendor', ['vendor-scripts']);

gulp.task('lint', ['eslint']);
gulp.task('test', ['lint', 'build']);
gulp.task('build', ['site', 'pages', 'assets', 'vendor']);

gulp.task('server', ['connect', 'watch']);
gulp.task('default', ['server']);
