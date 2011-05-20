$(function () {
    var output = $('#console .output'),
        loading = $('<img/>', {
            'alt': 'Loading...',
            'height': 15,
            'src': 'https://d3nwyuy0nl342s.cloudfront.net/images/modules/wiki/loading_indicator.gif',
            'width': 128
        }),
        scroller = output.jScrollPane({ 'hideFocus': true }).data('jsp'),
        scrollerPane = output.find('.jspPane');
    $(window).resize(function () {
        output.css('height', $(window).height() -
                $('#console .input').outerHeight());
        scroller.reinitialise();
    }).resize();
    // Global: gph (Git Page Helper)
    gph = {
        contentLoaded: function (ele) {
            scroller.reinitialise();
            if (ele) {
                scroller.scrollToElement(ele, true);
            }
        },
        formatDateTime: function (dateTime) {
            var parts = [];
            if (dateTime.indexOf('T') !== -1) {
                return dateTime;
            }
            parts = dateTime.split(' ');
            parts[0] = parts[0].replace(/\//g, '-');
            parts[2] = parts[2].substring(0, 3) + ':' + parts[2].substring(3);
            parts.splice(1, 0, 'T');
            return parts.join('');
        },
        loadingImg: loading,
        random: function (min, max) {
            min = (typeof(min) === 'undefined') ? 10000000 : min;
            max = (typeof(max) === 'undefined') ? 99999999 : max;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        randomIpv4: function () {
            var i = 0, str = '', randomness = 0;
            for (; i < 4; i++) {
                randomness = gph.random(0, 4);
                switch (randomness) {
                    case 0:
                        str += gph.random(0, 9);
                        break;
                    case 1:
                        str += gph.random(10, 90);
                        break;
                    case 2:
                        str += gph.random(100, 199);
                        break;
                    case 3:
                        str += gph.random(200, 249);
                        break;
                    case 4:
                        str += gph.random(250, 255);
                        break;
                    default:
                        str += 0;
                }
                if (i !== 3) {
                    str += '.';
                }
            }
            return str;
        }
    };
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
            '_args': [{
                'name': 'username',
                'optional': false
            }],
            '_call': function (args) {
                var console = this,
                    data = console.data('console'),
                    msgGroup = console.console('createMessageGroup'),
                    username = '';
                if (args.length) {
                    username = args[0];
                }
                if (!username) {
                    console.console('printUsage', data.cmd.login, 'login',
                            msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
                if (data.username) {
                    console.console('createMessage',
                            'You are already logged in as ' + data.username +
                            '.<br/>You must first log out in order to log in ' +
                            'as another user.', data.warningClass, msgGroup);
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
                    $.getJSON('root/usr/local/hidden.security', function (json) {
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
                                    'login: invalid username/password ' +
                                    'combination', data.errorClass, msgGroup);
                        }
                        msgGroup.addClass(data.completedClass);
                        interceptor(console);
                    });
                });
            },
            '_help': 'log in to user account'
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
            '_help': 'log out of current user account'
        },
        'ping': {
            '_args': [{
                'name': 'target',
                'optional': false
            }],
            '_call': function (args, opts) {
                var $this = this,
                    count = opts.n.args[0].value,
                    data = $this.data('console'),
                    errorMsg = '',
                    hostName = '',
                    hostNameRegex = /^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/,
                    i = 0,
                    ipv4Regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
                    ipv4 = '',
                    msgGroup = $this.console('createMessageGroup'),
                    size = opts.l.args[0].value,
                    target = '',
                    timeout = opts.w.args[0].value,
                    ttl = opts.i.args[0].value;
                if (args.length) {
                    target = args[0];
                }
                if (!target) {
                    $this.console('printUsage', data.cmd.ping, 'ping', msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
                if (count < 1) {
                    errorMsg = 'invalid count ' + count + '[min=0]';
                } else if (size < 1 || size > 65527) {
                    errorMsg = 'invalid size ' + size + ' [min=1,max=65527]';
                } else if (timeout < 1) {
                    errorMsg = 'invalid timeout ' + timeout + ' [min=1]';
                } else if (ttl < 1 || ttl > 255) {
                    errorMsg = 'invalid TTL ' + ttl + ' [min=1,max=255]';
                }
                if (errorMsg) {
                    $this.console('createMessage', 'ping: ' + errorMsg,
                            data.errorClass, msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
                if (ipv4Regex.test(target)) {
                    ipv4 = target;
                    if (ipv4 === '127.0.0.1') {
                        hostName = 'localhost';
                    } else {
                        hostName = 'unknown';
                    }
                } else if (hostNameRegex.test(target)) {
                    hostName = target;
                    if (hostName === 'localhost') {
                        ipv4 = '127.0.0.1';
                    } else {
                        ipv4 = gph.randomIpv4();
                    }
                }
                if (hostName && ipv4) {
                    var initialMsg = 'Pinging ';
                    if (opts.a.declared) {
                        initialMsg += hostName + ' [' + ipv4 + ']';
                    } else {
                        initialMsg += ipv4;
                    }
                    initialMsg += ' with ' + size + ' bytes of data:<br/><br/>';
                    $this.console('createMessage', initialMsg, '', msgGroup);
                    if (hostName === 'localhost') {
                        (function printResponse() {
                            setTimeout(function () {
                                if (i++ < count) {
                                    $this.console('createMessage',
                                            'Reply from ' + ipv4 + ': bytes=' +
                                            size + ' time<1ms TTL=' + ttl, '',
                                            msgGroup);
                                    printResponse();
                                } else {
                                    $this.console('createMessage',
                                            '<br/>Ping statistics for ' + ipv4 +
                                            ':', '', msgGroup);
                                    $this.console('createMessage',
                                            'Packets: Sent = ' + count +
                                            ', Received = ' + count +
                                            ', Lost = 0 (0% loss),', '',
                                            msgGroup).target.css('margin-left',
                                            '20px');
                                    $this.console('createMessage',
                                            'Approximate round trip times in ' +
                                            'milli-seconds:', '', msgGroup);
                                    $this.console('createMessage',
                                            'Minimum = 0ms, Maximum = 0ms, ' +
                                            'Average = 0ms', '',
                                            msgGroup).target.css('margin-left',
                                            '20px');
                                }
                            }, 1000);
                        })();
                    } else {
                        (function printResponse() {
                            setTimeout(function () {
                                if (i++ < count) {
                                    $this.console('createMessage',
                                            'Request timed out.', '', msgGroup);
                                    printResponse();
                                } else {
                                    $this.console('createMessage',
                                            '<br/>Ping statistics for ' + ipv4 +
                                            ':', '', msgGroup);
                                    $this.console('createMessage',
                                            'Packets: Sent = ' + count +
                                            ', Received = 0, Lost = ' + count +
                                            ' (100% loss),', '',
                                            msgGroup).target.css('margin-left',
                                            '20px');
                                }
                            }, timeout);
                        })();
                    }
                    msgGroup.addClass(data.completedClass);
                } else {
                    $this.console('createMessage',
                            'ping: invalid target specified', data.errorClass,
                            msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
            },
            '_help': 'check connectivity to another computer',
            '_options': {
                'a': {
                    'description': 'resolve addresses to host names'
                },
                'i': {
                    'args': [{
                        'name': 'TTL',
                        'value': 128
                    }],
                    'description': 'time to live'
                },
                'l': {
                    'args': [{
                        'name': 'size',
                        'value': 32
                    }],
                    'description': 'send buffer size'
                },
                'n': {
                    'args': [{
                        'name': 'count',
                        'value': 4
                    }],
                    'description': 'number of echo requests to send'
                },
                'w': {
                    'args': [{
                        'name': 'timeout',
                        'value': 4000
                    }],
                    'description': 'timeout in milliseconds to wait for each ' +
                            'reply'
                }
            }
        },
        'sha': {
            '_args': [{
                'name': 'message',
                'optional': false
            }],
            '_call': function (args) {
                var data = this.data('console'),
                    digest = '',
                    message = '',
                    msgGroup = this.console('createMessageGroup');
                if (args.length) {
                    message = args[0];
                }
                if (!message) {
                    this.console('printUsage', data.cmd.sha, 'sha', msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
                digest = Crypto.SHA256(message);
                this.console('createMessage', digest, '', msgGroup);
                msgGroup.addClass(data.completedClass);
            },
            '_help': 'return SHA-256 message digest'
        }
    };
    var console = $('#console').console({
        'callback': gph.contentLoaded,
        'cmd': commands,
        'hiddenFilePrefix': 'hidden.',
        'hiddenFilePrefixMask': '.',
        'loading': loading,
        'output': '.output .jspPane',
        'welcomeMessage': 'Welcome to neocotic @ GitHub!<br/>Type ' +
                '<a data-cmd="help" data-cmd-run="true" tabindex="-1">help</a>' +
                ' for a list of available commands'
    }).data('console').input.focus();
});