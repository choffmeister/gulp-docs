var through = require('through2');

module.exports.find = function (arr, pred) {
  for (var i = 0, l = arr.length; i < l; i++) {
    if (pred(arr[i])) {
      return arr[i];
    }
  }
  return undefined;
}

module.exports.changeExtension = function (path, extension) {
  var match = path.match(/^(.*)(\.[^\.]*)$/);
  return match[1] + extension;
}

module.exports.reload = function (connect, delay) {
  var files = [];
  var reload = connect.reload();

  return through.obj(
    function (file, _, cb) {
      files.push(file);
      cb();
    },
    function (cb) {
      setTimeout(function () {
        var result = { path: [] };
        for (var i = 0, l = files.length; i < l; i++) {
          result.path.push(files[i].path);
        }
        reload.write(result);
        reload.end();
      }.bind(this), delay || 100);
      cb();
    }
  );
};
