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
          if (repoRegex) repoRegex += '|';
          repoRegex += data[i].replace('.', '\\.');
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
  // Activate Chrome Web Store inline installations.
  var chrome = window.chrome || 0;
  if (chrome && chrome.app && chrome.webstore) {
    var chromeBtn = $('.chrome_install_button');
    if (chromeBtn.length) {
      if (chrome.app.isInstalled) {
        chromeBtn.toggleClass('primary disabled').html('Installed');
      } else {
        chromeBtn.bind('click.chrome', function (e) {
          var $this = $(this);
          chrome.webstore.install($this.attr('href'), function () {
            $this.toggleClass('primary disabled').unbind('.chrome').html('Installed');
          });
          e.preventDefault();
        });
      }
    }
  }
  // Activate floating share buttons.
  var stContainer = $('.stContainer');
  if (stContainer.length) {
    var originalY = parseInt(stContainer.offset().top, 10) - 40;
    $(window).scroll(function () {
      var
        scrollY = $(window).scrollTop(),
        isFixed = stContainer.css('position') === 'fixed';
      if (stContainer.length > 0) {
        if (!isFixed && scrollY > originalY) {
          stContainer.stop().css({
            position   : 'fixed',
            left       : '50%',
            top        : 40,
            marginLeft : -507
          });
        } else if (isFixed && scrollY < originalY) {
          stContainer.css({
            position   : 'relative',
            left       : 0,
            top        : 0,
            marginLeft : originalX
          });
        }
      }
    });
  }
});