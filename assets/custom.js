// jQuery ready
$(function () {
  // Populate Projects menu with GitHub repos
  var
    projects = $('#projects-dropdown'),
    link     = projects.prev('a');
  function addMenuItem(text, url) {
    projects.append($('<li/>').append($('<a/>', {
      href: url,
      text: text
    })));
  }
  if (projects.length) {
    $.getJSON('/ajax/repos.json', function (data) {
      if (data && data.length) {
        for (var i = 0; i < data.length; i++) {
          addMenuItem(data[i], '/' + data[i]);
        }
        projects.append('<li class="divider"/>');
      }
      addMenuItem('View All', link.attr('href'));
      projects.parents('.topbar').dropdown();
      link.attr('href', '#');
    });
  }
  // Activate twipsy tooltips
  $('[rel=twipsy]').twipsy({live: true});
});