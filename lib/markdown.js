/*eslint-env node*/
var marked = require('marked'),
    through = require('through2');

var renderer = (function () {
  var r = new marked.Renderer();

  r.heading = function (text, level) {
    var renderedLevel = Math.min(level + 1, 4);
    var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
    var anchor = '<a name="' + escapedText + '" class="anchor" href="#' + escapedText + '" aria-hidden="true"><span class="header-link"></span></a>';
    return '<h' + renderedLevel + '>' + anchor + text + '</h' + renderedLevel + '>';
  };

  return r;
}());

var convert = function (markdown) {
  return marked(markdown, {
    renderer: renderer
  });
};

module.exports.render = function () {
  return through.obj(function (file, _, cb) {
    try {
      file.contents = new Buffer(convert(file.contents.toString('utf8')), 'utf8');
      this.push(file);
      cb();
    } catch (ex) {
      cb(ex);
    }
  });
};
