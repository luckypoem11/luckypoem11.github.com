// jQuery is ready.
$(function() {

  var $window = $(window);

  // Activate styled tooltips.
  $('[rel=tooltip]').tooltip();

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
          $this.toggleClass('btn-primary disabled chrome_install_button')
              .unbind('.chrome').html('Installed');
        });
        e.preventDefault();
      });
    }
  }

  // Improves fragment/anchor accuracy, but only works when fragment changes.
  function tuneFragment() {
    var firstContainer = $('body .container-fluid').first();
    if (firstContainer.length && window.location.hash) {
      $window.scrollTop(firstContainer.offset().top - 40);
    }
  }

  $window.on('hashchange', tuneFragment);
  tuneFragment();

});