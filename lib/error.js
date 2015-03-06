var gutil = require('gulp-util'),
    plumber = require('gulp-plumber');

module.exports.logerror = function (err) {
  if (err.plugin) {
    gutil.log(
      'Error in plugin \'' + gutil.colors.cyan(err.plugin) + '\'',
      gutil.colors.red(err.message));
  } else {
    gutil.log(
      'Error',
      gutil.colors.red(err.message));
  }
  gutil.beep();
};

module.exports.handle = function (ignoreErrors) {
  return plumber(function (err) {
    module.exports.logerror(err);

    if (!ignoreErrors) process.exit(1);
  });
};
