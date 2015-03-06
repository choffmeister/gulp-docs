var path = require('path'),
    through = require('through2'),
    yaml = require('js-yaml');

module.exports.load = function (site) {
  var sitemaps = {};
  return through.obj(
    function (file, _, cb) {
      var name = path.basename(file.path, '.yml');
      sitemaps[name] = yaml.safeLoad(file.contents.toString(site.encoding));
      this.push(file);
      cb();
    },
    function (cb) {
      site.sitemaps = sitemaps;
      cb();
    }
  );
};
