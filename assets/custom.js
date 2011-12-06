// JSONP support
(function (root) {
  var previousJSONP = root.JSONP;
  root.JSONP = {
    __callbacks : {},
    get         : function (url, callback, context) {
      var
        id     = +new Date(),
        script = document.createElement('script');
      while (JSONP.__callbacks[id] !== undefined) id += Math.random();
      JSONP.__callbacks[id] = function () {
        delete JSONP.__callbacks[id];
        callback.apply(context, arguments);
      };
      url += (url.indexOf('?') === -1) ? '?' : '&';
      url += 'callback=' + encodeURIComponent('JSONP.__callbacks[' + id + ']');
      script.setAttribute('src', url);
      document.getElementsByTagName('head')[0].appendChild(script);
    },
    noConflict  : function () {
      root.JSONP = previousJSONP;
      return this;
    }
  };
}(this));
// jQuery ready
$(function () {
  // Populate Projects menu with GitHub repos
  var
    projects = $('#projects-dropdown'),
    link     = projects.prev('a');
  JSONP.get('https://api.github.com/users/neocotic/repos', function (data) {
    data = data.data || [];
    data.sort(function (a, b) {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();
      if (a === b) return 0;
      return (a < b) ? -1 : 1;
    });
    function addMenuItem(text, url) {
      projects.append($('<li/>').append($('<a/>', {
        href: url,
        text: text
      })));
    }
    for (var i = 0; i < data.length; i++) {
      addMenuItem(data[i].name, '/' + data[i].name);
    }
    projects.append('<li class="divider"/>');
    addMenuItem('View All', link.attr('href'));
    projects.parents('.topbar').dropdown();
    link.attr('href', '#');
  });
  // Activate twipsy tooltips
  $('[rel=twipsy]').twipsy({live: true});
});