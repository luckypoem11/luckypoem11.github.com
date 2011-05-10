$(function () {
    var output = $('#console .output'),
        scroller = output.jScrollPane({ 'hideFocus': true }).data('jsp'),
        scrollerPane = output.find('.jspPane');
    $(window).resize(function () {
        output.css('height', $(window).height() -
                $('#console .input').outerHeight());
        scroller.reinitialise();
    }).resize();
    function interceptor(console, callback) {
        var data = console.data('console'),
            input = console.find('input[type="password"]');
        if (callback) {
            input.bind('keyup.console', function (event) {
                if (event.keyCode === 13) {
                    var $this = $(this),
                        str = ($this.val()) ? $this.val().trim() : '',
                        args = str.split(/\s+/);
                    $this.val('');
                    callback.apply(console, [args]);
                }
            }).show().focus();
            data.input.hide();
        } else {
            data.input.show().focus();
            input.unbind('.console').hide();
        }
    }
    var commands = {
        'login': {
            '_call': function (args) {
                var console = this,
                    data = console.data('console'),
                    msgGroup = console.console('createMessageGroup'),
                    username = '';
                if (args.length) {
                    username = args[0];
                }
                if (!username) {
                    console.console('createMessage',
                            data.cmd.login._usage, data.errorClass, msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
                if (data.username) {
                    console.console('createMessage',
                            'You are already logged in as ' + data.username +
                            '.<br/>You must first log out in order to log in as another user.',
                            data.warningClass, msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
                console.console('createMessage', 'Enter password:', '',
                        msgGroup);
                interceptor(console, function (nargs) {
                    var digest = '',
                        message = '',
                        msg = {};
                    if (nargs.length) {
                        message = nargs[0];
                    }
                    if (!message) {
                        console.console('createMessage',
                                'login: invalid password', data.errorClass,
                                msgGroup);
                        interceptor(console);
                        msgGroup.addClass(data.completedClass);
                        return;
                    }
                    msg = console.console('createMessage', 'Authenticating...',
                            '', msgGroup);
                    digest = Crypto.SHA256(message);
                    $.getJSON('root/usr/local/.security', function (json) {
                        if (json[username] &&
                                json[username].password === digest) {
                            msg.append(' Passed!');
                            data.username = username;
                            console.console('createMessage',
                                    'You have successfully logged in as ' +
                                    username + '.', data.infoClass, msgGroup);
                        } else {
                            msg.append(' Failed!');
                            console.console('createMessage',
                                    'login: invalid username/password combination',
                                    data.errorClass, msgGroup);
                        }
                        msgGroup.addClass(data.completedClass);
                        interceptor(console);
                    });
                });
            },
            '_help': 'log in to user account',
            '_usage': 'usage: login USERNAME'
        },
        'logout': {
            '_call': function (args) {
                var data = this.data('console'),
                    msgGroup = this.console('createMessageGroup');
                if (data.username) {
                    data.username = '';
                    this.console('createMessage',
                            'You have been successfully logged out.',
                            data.infoClass, msgGroup);
                } else {
                    this.console('createMessage', 'You are already logged out.',
                            data.warningClass, msgGroup);
                }
                msgGroup.addClass(data.completedClass);
            },
            '_help': 'log out of current user account',
            '_usage': 'usage: logout'
        },
        'sha': {
            '_call': function (args) {
                var data = this.data('console'),
                    digest = '',
                    message = '',
                    msgGroup = this.console('createMessageGroup');
                if (args.length) {
                    message = args[0];
                }
                if (!message) {
                    this.console('createMessage', data.cmd.sha._usage,
                            data.errorClass, msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
                digest = Crypto.SHA256(message);
                this.console('createMessage', digest, '', msgGroup);
                msgGroup.addClass(data.completedClass);
            },
            '_help': 'return SHA-256 message digest',
            '_usage': 'usage: sha MESSAGE'
        }
    };
    var console = $('#console').console({
        'callback': function (obj) {
            scroller.reinitialise();
            if (obj) {
                scroller.scrollToElement(obj, true);
            }
        },
        'cmd': commands,
        'output': '.output .jspPane',
        'welcomeMessage': 'Welcome to neocotic @ GitHub!<br/>' +
                'Type \'help\' for a list of available commands'
    }).data('console').input.focus();
});