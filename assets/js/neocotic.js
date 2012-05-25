// jQuery is ready.
$(function() {

  var $window = $(window);

  // Activate styled tooltips.
  $('[rel=tooltip]').tooltip();

  // Activate Chrome Web Store inline installations.
  var chrome = window.chrome || {};
  if (chrome.app && chrome.webstore) {
    $('.chrome_install_button').on('click.chrome', function(e) {
      var $this = $(this);
      if (!$this.hasClass('chrome_install_button')) {
        $this.off('.chrome');
        return;
      }
      chrome.webstore.install($this.attr('href'), function() {
        $this.toggleClass('chrome_install_button disabled').off('.chrome')
            .html('Installed');
      });
      e.preventDefault();
    });
  }

  // Improve fragment/anchor accuracy.
  function hashPrecision() {
    var container = $('body .container-fluid').first();
    if (container.length && window.location.hash) {
      $window.scrollTop(container.offset().top - 40);
    }
  }

  $window.on('hashchange', hashPrecision);
  hashPrecision();

});