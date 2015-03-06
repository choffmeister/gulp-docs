var cache = require('./cache'),
    gutil = require('gulp-util'),
    nunjucks = require('nunjucks'),
    sanitizeHtml = require('sanitize-html'),
    path = require('path'),
    through = require('through2'),
    utils = require('./utils');

nunjucks.configure({ watch: false });

var _env = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'), true);
_env.addFilter('json', function (input) {
  return JSON.stringify(input, true, 2);
});

var _compileTemplate = function (template, path) {
  return cache('templates', template, function (template) {
    return nunjucks.compile(template, _env, path);
  });
};

var _resolveLink = function (link, site) {
  var match = link.match(/^(page):([a-zA-Z0-9\-]+)(#([a-zA-Z0-9\-]+))?$/);
  if (match) {
    var type = match[1];
    var key = match[2];
    var anchor = match[3] || '';

    switch (type) {
      case 'page':
        var page = utils.find(site.pages, function (p) {
          return p.frontMatter.key === key;
        });
        if (page) {
          return '/' + utils.changeExtension(path.relative(path.resolve(site.target, '../src/pages'), page.path), '.html') + anchor;
        } else {
          throw new gutil.PluginError('page', { message: 'Reference to unknown link ' + link });
        }
        break;
    }
  } else {
    return link;
  }
};

module.exports.render = function (site) {
  return through.obj(
    function (file, _, cb) {
      try {
        var template = _compileTemplate(file.contents.toString(site.encoding), file.path);
        var context = {
          site: site,
          page: file.frontMatter
        };
        var rendered = template.render(context);
        file.contents = new Buffer(rendered, site.encoding);
        this.push(file);
        cb();
      } catch (ex) {
        cb(ex);
      }
    }
  );
};

module.exports.list = function (site) {
  var pages = [];
  return through.obj(
    function (file, _, cb) {
      pages.push(file);
      this.push(file);
      cb();
    },
    function (cb) {
      site.pages = pages;
      cb();
    }
  );
};

module.exports.resolveLinks = function (site) {
  return through.obj(
    function (file, _, cb) {
      try {
        file.contents = new Buffer(sanitizeHtml(file.contents.toString(site.encoding), {
          allowedTags: false,
          allowedAttributes: false,
          transformTags: {
            'a': function(tagName, attribs) {
              attribs.href = _resolveLink(attribs.href, site);
              return {
                tagName: 'a',
                attribs: attribs
              };
            }
          }
        }), site.encoding);

        this.push(file);
        cb();
      } catch (ex) {
        cb(ex);
      }
    }
  );
};
