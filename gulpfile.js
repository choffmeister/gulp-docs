var argv = require('yargs').argv,
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    connect = require('gulp-connect'),
    error = require('./lib/error'),
    frontmatter = require('gulp-front-matter'),
    gif = require('gulp-if'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    layout = require('./lib/layout'),
    less = require('gulp-less'),
    markdown = require('./lib/markdown'),
    merge = require('merge-stream'),
    minifyhtml = require('gulp-minify-html'),
    page = require('./lib/page'),
    path = require('path'),
    reactify = require('reactify'),
    rename = require('gulp-rename'),
    sitemap = require('./lib/sitemap'),
    size = require('gulp-size'),
    source = require('vinyl-source-stream'),
    uglify = require('gulp-uglify'),
    utils = require('./lib/utils');

var config = {
  debug: !argv.dist,
  dist: argv.dist,
  port: argv.port || 9000
};

var data = {
  github_url: 'https://github.com/ePages-de/epages-docs'
};

var site = {
  encoding: 'utf8',
  debug: config.debug,
  dist: config.dist,
  target: path.resolve(__dirname, 'target'),
  data: data,
  sitemaps: {},
  layouts: {},
  pages: [],
};

gulp.task('site-sitemaps', function () {
  return gulp.src(['./src/sitemaps/*.yml'])
    .pipe(error.handle(config.debug))
    .pipe(sitemap.load(site));
});

gulp.task('site-layouts', function () {
  return gulp.src(['./src/layouts/*.html'])
    .pipe(error.handle(config.debug))
    .pipe(frontmatter())
    .pipe(layout.list(site));
});

gulp.task('site-pages', function () {
  return gulp.src(['./src/pages/**/*.{html,md}'])
    .pipe(error.handle(config.debug))
    .pipe(frontmatter())
    .pipe(page.list(site));
});

gulp.task('pages', ['site-sitemaps', 'site-layouts', 'site-pages'], function () {
  var html = gulp.src(['./src/pages/**/*.html'])
    .pipe(error.handle(config.debug))
    .pipe(frontmatter());

  var md = gulp.src(['./src/pages/**/*.md'])
    .pipe(error.handle(config.debug))
    .pipe(frontmatter())
    .pipe(markdown.render());

  return merge(html, md)
    .pipe(layout.apply(site))
    .pipe(page.render(site))
    .pipe(page.resolveLinks(site))
    .pipe(rename({ extname: '.html' }))
    .pipe(gif(config.dist, minifyhtml()))
    .pipe(gulp.dest('./target'))
    .pipe(utils.reload(connect));
});

gulp.task('assets-styles', function () {
  return gulp.src('./src/assets/styles/main.less')
    .pipe(error.handle(config.debug))
    .pipe(less({ compress: config.dist }))
    .on('error', function (err) {
      // without this rebuilding hangs
      this.emit('end');
    })
    .pipe(size({ showFiles: true, gzip: config.dist }))
    .pipe(gulp.dest('./target/assets/styles'))
    .pipe(utils.reload(connect));
});

gulp.task('assets-scripts', function () {
  var bundler = browserify('./src/assets/scripts/main.js')
    .transform(reactify);
  return bundle();

  function bundle() {
    return bundler.bundle()
      .on('error', function (err) {
        error.logerror(err);
        this.emit('end');
      })
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(gif(config.dist, uglify({ preserveComments: 'some' })))
      .pipe(size({ showFiles: true, gzip: config.dist }))
      .pipe(gulp.dest('./target/assets/scripts'))
      .pipe(utils.reload(connect));
  };
});

gulp.task('assets-images', function () {
  return gulp.src('./src/assets/images/**/*.{png,jpg,gif}')
    .pipe(error.handle(config.debug))
    .pipe(gulp.dest('./target/assets/images'))
    .pipe(utils.reload(connect));
});

gulp.task('assets-fonts', function () {
  return gulp.src('./src/assets/fonts/**/*')
    .pipe(error.handle(config.debug))
    .pipe(gulp.dest('./target/assets/fonts'))
    .pipe(utils.reload(connect));
});

gulp.task('connect', ['build'], function () {
  connect.server({
    port: config.port,
    root: './target/',
    livereload: true
  });
});

gulp.task('watch', ['build'], function () {
  gulp.watch('./src/**/*.{html,md,yml}', ['pages']);
  gulp.watch('./src/assets/styles/**/*.{css,less}', ['assets-styles']);
  gulp.watch('./src/assets/scripts/**/*.{js,jsx}', ['assets-scripts']);
  gulp.watch('./src/assets/images/**/*.{png,jpg,gif}', ['assets-images']);
});

gulp.task('site', ['site-sitemaps', 'site-pages', 'site-layouts']);
gulp.task('assets', ['assets-styles', 'assets-scripts', 'assets-images', 'assets-fonts']);

gulp.task('build', ['site', 'pages', 'assets']);
gulp.task('server', ['connect', 'watch']);
gulp.task('default', ['server']);
