$(function () {
    var output = $('#console .output'),
        scroller = output.jScrollPane({ 'hideFocus': true }).data('jsp'),
        scrollerPane = output.find('.jspPane');
    $(window).resize(function () {
        output.css('height', $(window).height() -
                $('#console .input').outerHeight());
        scroller.reinitialise();
    }).resize();
    var console = $('#console').console({
        'callback': function (obj) {
            scroller.reinitialise();
            if (obj) scroller.scrollToElement(obj, true);
        },
        'output': '.output .jspPane',
        'welcomeMessage': 'Welcome to neocotic @ GitHub!<br/>' +
                'Type \'help\' for a list of available commands'
    }).data('console').input.focus();
});