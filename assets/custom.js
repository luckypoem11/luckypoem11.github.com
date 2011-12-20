// Global function called by extensions via content scripts.
window.disableChromeExtensionInstallLinks = function (extensionId) {
  if (!extensionId) return;
  var links = document.querySelectorAll('a.chrome_install_button[href$=' +
      extensionId + ']');
  for (var i = 0; i < links.length; i++) {
    links[i].className = 'btn disabled';
    links[i].innerText = 'Installed';
  }
};
// jQuery is ready.
$(function () {
  var
    $window  = $(window),
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
      chromeBtn.bind('click.chrome', function (e) {
        var $this = $(this);
        if (!$this.hasClass('chrome_install_button')) {
          $this.unbind('.chrome');
          return;
        }
        chrome.webstore.install($this.attr('href'), function () {
          $this.toggleClass('primary disabled chrome_install_button').unbind('.chrome').html('Installed');
        });
        e.preventDefault();
      });
    }
  }
  // Activate floating share buttons.
  var stContainer = $('.stContainer');
  if (stContainer.length) {
    var
      originalX = stContainer.css('margin-left'),
      originalY = stContainer.offset().top - 40;
    $window.scroll(function () {
      var
        scrollY = $window.scrollTop(),
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
  // Improves fragment/anchor accuracy, but only works when fragment changes.
  function tuneFragment() {
    var firstContainer = $('body .container').first();
    if (firstContainer.length && window.location.hash) {
      $window.scrollTop(firstContainer.offset().top - 40);
    }
  }
  $window.on('hashchange', tuneFragment);
  tuneFragment();
});