// jQuery is ready.
$(function () {
  var
    projects = $('#projects-dropdown'),
    link     = projects.prev('a');
  // Append menu item (including link) to projects dropdown.
  function addMenuItem(text, url) {
    projects.append($('<li/>').append($('<a/>', {
      href: url,
      text: text
    })));
  }
  // Highlight navigation for active page.
  function highlightMenu() {
    $('[data-activate]').each(function () {
      var
        $this = $(this),
        regex = $this.attr('data-activate');
      $this.removeAttr('data-activate');
      if (new RegExp(regex).test(document.location.pathname)) {
        $this.addClass('active');
      }
    });
  }
  // Populate Projects menu with GitHub repos.
  if (projects.length) {
    $.getJSON('/ajax/repos.json', function (data) {
      var repoRegex = '';
      if (data && data.length) {
        for (var i = 0; i < data.length; i++) {
          addMenuItem(data[i], '/' + data[i]);
          repoRegex += '|' + data[i].replace('.', '\\.');
        }
        projects.append('<li class="divider"/>');
      }
      addMenuItem('View All', link.attr('href'));
      if (repoRegex) {
        repoRegex = '^\\/(' + repoRegex + ')';
        projects.parents('.dropdown').attr('data-activate', repoRegex);
      }
      projects.parents('.topbar').dropdown();
      link.attr('href', '#');
      highlightMenu();
    });
  } else {
    highlightMenu();
  }
  // Activate twipsy tooltips.
  $('[rel=twipsy]').twipsy({live: true});
});