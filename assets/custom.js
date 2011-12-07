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
  // Activate twipsy tooltips
  $('[rel=twipsy]').twipsy({live: true});
});