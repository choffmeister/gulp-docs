var marked = require('marked'),
    through = require('through2');

module.exports.render = function () {
  return through.obj(function (file, _, cb) {
    try {
      file.contents = new Buffer(marked(file.contents.toString('utf8')), 'utf8');
      this.push(file);
      cb();
    } catch (ex) {
      cb(ex);
    }
  });
};

