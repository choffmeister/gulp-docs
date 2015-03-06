var crypto = require('crypto');

var _caches = {};

var _sha1 = function (str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
}

var _cache = function (name) {
  if (!_caches[name]) {
    _caches[name] = {};
  }
  return _caches[name];
};

module.exports = function (cacheName, content, fn) {
  var cache = _cache(cacheName);
  var sha1 = _sha1(content);

  if (cache[sha1]) {
    return cache[sha1];
  } else {
    var value = fn(content);
    cache[sha1] = value;
    return value;
  }
};
