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
  var projects = $('#projects-dropdown').attr('href', '#');
  JSONP.get('https://api.github.com/users/neocotic/repos', function (repos) {
    repos.sort(function (a, b) {
      if (a.name === b.name) return 0;
      return (a.name < b.name) ? -1 : 1;
    });
    for (var i = 0; i < repos.length; i++) {
      projects.append($('<li/>').append($('<a/>', {
        href: '/' + repos[i].name,
        text: repos[i].name
      })));
    }
    projects.dropdown();
  });
  // Activate twipsy tooltips
  $('[rel=twipsy]').twipsy({live: true});
});