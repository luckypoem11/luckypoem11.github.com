$(function () {
	var output = $('#console .output'),
		scroller = output.jScrollPane({ 'hideFocus': true }).data('jsp'),
		scrollerPane = output.find('.jspPane');
	$(window).resize(function () {
		output.css('height', $(window).height() - $('#console .input').outerHeight());
		scroller.reinitialise();
	}).resize();
	var commands = {};
	var console = $('#console').console({
		'callback': function (obj) {
			scroller.reinitialise();
			if (obj) scroller.scrollToElement(obj, true);
		},
		'cmd': commands,
		'output': '.output .jspPane'
	}).data('console').input.focus();
});