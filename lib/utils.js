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
