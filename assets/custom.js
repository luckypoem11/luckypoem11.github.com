// jQuery is ready.
$(function() {

  var $window = $(window)
    , stContainer = $('.stContainer');

  // Highlight navigation for active page.
  $('[data-activate]').each(function() {
    var $this = $(this)
      , regex = $this.attr('data-activate');
    $this.removeAttr('data-activate');
    if (new RegExp(regex).test(document.location.pathname)) {
      $this.addClass('active');
    }
  });

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
        chrome.webstore.install($this.attr('href'), function() {
          $this.toggleClass('primary disabled chrome_install_button')
              .unbind('.chrome').html('Installed');
        });
        e.preventDefault();
      });
    }
  }

  // Activate floating share buttons.
  if (stContainer.length) {
    var originalX = stContainer.css('margin-left')
      , originalY = stContainer.offset().top - 40;
    $window.scroll(function() {
      var scrollY = $window.scrollTop()
        , isFixed = 'fixed' === stContainer.css('position');
      if (stContainer.length > 0) {
        if (!isFixed && scrollY > originalY) {
          stContainer.stop().css({
              position: 'fixed'
            , left: '50%'
            , top: 40
            , marginLeft: -507
          });
        } else if (isFixed && scrollY < originalY) {
          stContainer.css({
              position: 'relative'
            , left: 0
            , top: 0
            , marginLeft: originalX
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