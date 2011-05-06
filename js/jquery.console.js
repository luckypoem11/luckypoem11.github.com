(function ($) {
    var methods = {
        addHistory: function (str) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('console');
                data.history.push(str);
                data.historyIndex = -1;
            });
        },
        appendDivider: function () {
            var data = this.data('console');
            var obj = $('<div/>', {
                'class': data.messageClass + ' ' + data.dividerClass
            }).append($('<span/>'));
            data.output.append(obj.target);
            data.callback(obj.target);
            return obj;
        },
        callCommand: function (args) {
            var data = this.data('console'),
                i = 0,
                obj = data.cmd;
            for (; i < args.length; i++) {
                var found = false;
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        if (prop === args[i] && prop.charAt(0) !== '_') {
                            obj = obj[prop];
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) break;
            }
            if (obj !== data.cmd) {
                if (obj.hasOwnProperty('_call')) {
                    obj._call.apply(this, [Array.prototype.slice.call(args, i)]);
                } else {
                    // TODO: Improve description
                    this.console('createMessage',
                            'Command not valid! Try using a sub-command...',
                            data.errorClass);
                }
            } else {
                this.console('createMessage', 'Command not found!',
                        data.errorClass);
            }
        },
        createMessage: function (str, style) {
            var data = this.data('console');
            str = str || '';
            style = style || '';
            var obj = {
                'append': function (content) {
                    obj.target.append(content || '');
                    data.output.append(obj.target);
                    data.callback(obj.target);
                },
                'target': $('<div/>', {
                    'class': data.messageClass + ' ' + style,
                    'html': str
                })
            };
            data.output.append(obj.target);
            data.callback(obj.target);
            return obj;
        },
        destroy: function () {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('console');
                data.input.unbind('.console');
                $this.removeData('console');
            });
        },
        findConsole: function () {
            if (this.data('console')) {
                return this;
            }
            return methods.findConsole.apply(this.parent());
        },
        findData: function () {
            var data = this.data('console');
            if (data) {
                return data;
            }
            return methods.findData.apply(this.parent());
        },
        getPrefix: function () {
            var data = this.data('console'),
                prefix = data.prefixName;
            prefix += data.prefixSeperator;
            prefix += data.vfsCd;
            prefix += data.prefixSymbol;
            return prefix;
        },
        hintClickHandler: function () {
            var $this = $(this),
                data = $this.console('findData'),
                hint = $this.attr('data-hint');
            data.input.val(hint + ' ').focus();
            data.hints.hide();
        },
        hintEnterHandler: function () {
            $(this).addClass('selected');
        },
        hintExitHandler: function () {
            $(this).removeClass('selected');
        },
        init: function (options) {
            var settings = {
                'callback': function (obj) {},
                'cmd': {
                    'cd': {
                        '_call': function (args) {
                            var $this = this,
                                data = $this.data('console'),
                                path;
                            if (args.length) {
                                path = args[0];
                            }
                            if (!path) {
                                 $this.console('createMessage',
                                        'No directory specified',
                                        data.errorClass);
                                 return;
                            }
                            $this.console('lookupManifest', path, function (manifest) {
                                if (manifest) {
                                    data.vfsCd = manifest.path;
                                    $this.console('createMessage',
                                            'Working directory changed.');
                                } else {
                                    $this.console('createMessage',
                                            'Couldn\'t resolve path \'' +
                                            path + '\'',
                                            data.errorClass);
                                }
                            });
                        },
                        '_help': 'change working directory'
                    },
                    'clear': {
                        '_call': function (args) {
                            var data = this.data('console');
                            data.output.find('.message').remove();
                            data.callback();
                        },
                        '_help': 'clear all the messages from the console'
                    },
                    'help': {
                        '_call': function (args) {
                            var arr = [],
                                data = this.data('console'),
                                i = 0,
                                obj = data.cmd;
                            for (var prop in obj) {
                                if (obj.hasOwnProperty(prop)) {
                                    if (prop.charAt(0) !== '_') {
                                        arr.push({
                                            'name': prop,
                                            'tip': obj[prop]._help
                                        });
                                    }
                                }
                            }
                            arr.sort();
                            for (; i < arr.length; i++) {
                                this.console('createMessage', $('<span/>', {
                                    'html': arr[i].name + ' &nbsp;&nbsp; ' +
                                            arr[i].tip
                                }));
                            }
                        },
                        '_help': 'show general help information and a list of available commands'
                    },
                    'ls': {
                        '_call': function (args) {
                            var $this = this,
                                arr = [],
                                data = $this.data('console'),
                                invalidArg = false,
                                path,
                                showHidden = false;
                            for (var i = 0; i < args.length; i++) {
                                var arg = args[i];
                                if (arg.indexOf('-') === 0) {
                                    switch (arg.substring(1)) {
                                        case 'a':
                                            showHidden = true;
                                            break;
                                        default:
                                            invalidArg = true;
                                    }
                                } else if (!path) {
                                    path = arg;
                                }
                                if (invalidArg) {
                                    $this.console('createMessage',
                                            'Invalid argument \'' + arg + '\'',
                                            data.errorClass);
                                    return;
                                }
                            }
                            path = path || '';
                            $this.console('lookupManifest', path, function (manifest) {
                                if (manifest) {
                                    arr = Array.prototype.concat.call(manifest.directories, manifest.files);
                                    arr.sort();
                                    if (arr.length === 0) {
                                        $this.console('createMessage', '.');
                                        $this.console('createMessage', '..');
                                        return;
                                    }
                                    for (var j = 0; j < arr.length; j++) {
                                        if (!showHidden ||
                                                arr[j].indexOf('.') !== 0) {
                                            $this.console('createMessage',
                                                    arr[j]);
                                        }
                                    }
                                } else {
                                    $this.console('createMessage',
                                            'Couldn\'t resolve path \'' +
                                            path + '\'',
                                            data.errorClass);
                                }
                            });
                        },
                        '_help': 'list directory contents'
                    },
                    'open': {
                        '_call': function (args) {
                            var data = this.data('console');
                            this.console('createMessage', 'open', data.warningClass);
                        },
                        '_help': 'open a file to view'
                    },
                    'pwd': {
                        '_call': function (args) {
                            var data = this.data('console');
                            this.console('createMessage', data.vfsCd);
                        },
                        '_help': 'return working directory name'
                    }
                },
                'commandClass': 'command',
                'dividerClass': 'divider',
                'errorClass': 'error',
                'hints': '.hints',
                'history': [],
                'historyIndex': -1,
                'infoClass': 'info',
                'input': 'input[type="text"]',
                'maxHints': 10,
                'messageClass': 'message',
                'output': '.output',
                'prefixName': 'guest',
                'prefixSeperator': ':',
                'prefixSymbol': '$',
                'vfsCd': 'root',
                'vfsDescriptor': 'manifest.json',
                'warningClass': 'warning',
                'welcomeMessage': 'Welcome to jQuery.console!'
            };
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('console');
                if (!data) {
                    if (options) {
                        $.extend(true, settings, options);
                    }
                    settings.hints = $this.find(settings.hints).hide();
                    settings.input = $this.find(settings.input);
                    settings.output = $this.find(settings.output);
                    $this.data('console', settings);
                    data = $this.data('console');
                    data.input.bind('keydown.console', methods.keyDownHandler);
                    data.input.bind('keyup.console', methods.keyUpHandler);
                    if (data.welcomeMessage) {
                        $this.console('createMessage', data.welcomeMessage,
                                data.infoClass);
                    }
                }
            });
        },
        keyDownHandler: function (event) {
            switch (event.keyCode) {
                case 38: // Up
                case 40: // Down
                    event.preventDefault();
                    break;
                default:
            }
        },
        keyUpHandler: function (event) {
            var $this = $(this);
            switch (event.keyCode) {
                case 13: // Enter
                    var data = $this.console('findData');
                    if (data.hints.is(':visible') &&
                            data.hints.find('.selected').length) {
                        var hint = data.hints.find('.selected')
                                .attr('data-hint');
                        data.input.val(hint + ' ');
                        data.hints.hide();
                    } else {
                        $this.console('send');
                    }
                    break;
                case 27:
                    var data = $this.console('findData');
                    if (data.hints.is(':visible')) {
                        data.hints.hide();
                    } else {
                        $this.console('showHints');
                    }
                    break;
                case 38: // Up
                case 40: // Down
                    var console = $this.console('findConsole'),
                        data = console.data('console'),
                        moveUp = event.keyCode === 38;
                    if (data.hints.is(':visible')) {
                        console.console('navigateHints', moveUp);
                    } else {
                        console.console('searchHistory', moveUp);
                    }
                    break;
                default:
                    $this.console('showHints');
            }
        },
        lookupHints: function (args) {
            var arr = [],
                data = this.data('console'),
                hints = [],
                i = 0,
                lastCommandFound = -1,
                obj = data.cmd;
            for (; i < args.length; i++) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop) && prop.charAt(0) !== '_') {
                        if (prop === args[i]) {
                            arr.push(obj[prop]);
                            lastCommandFound = i;
                            obj = obj[prop];
                            break;
                        }
                    }
                }
                if (lastCommandFound !== i) break;
            }
            if (arr.length === args.length) {
                hints.push({
                    'command': args.join(' '),
                    'name': args[lastCommandFound],
                    'tip': obj._help
                });
            } else if (arr.length === args.length - 1) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop) && prop.charAt(0) !== '_') {
                        if (prop.indexOf(args[args.length - 1]) === 0 &&
                                obj[prop].hasOwnProperty('_help')) {
                            if (data.maxHints <= 0 || hints.length <= data.maxHints) {
                                hints.push({
                                    'command': args.slice(0, args.length - 2)
                                            .join(' ') + ' ' + prop,
                                    'name': prop,
                                    'tip': obj[prop]._help
                                });
                            }
                        }
                    }
                }
            }
            return hints.sort();
        },
        lookupManifest: function (path, callback) {
            var $this = this,
                data = $this.data('console'),
                manifest;
            if (path && (path.lastIndexOf('/') !== path.length - 2 ||
                    path === '.')) {
                path += '/';
            }
            path = data.vfsCd + '/' + path + data.vfsDescriptor;
            $.getJSON(path, function (descriptor) {
                manifest = descriptor;
            }).complete(function () {
                callback.apply($this, [manifest]);
            });
        },
        navigateHints: function (moveUp) {
            var data = this.data('console'),
                hintItems = data.hints.find('a'),
                selectedItem = hintItems.filter('.selected');
            if (moveUp) {
                if (selectedItem.length) {
                    var prev = selectedItem.removeClass('selected').prev();
                    if (prev.length) {
                        prev.addClass('selected');
                    } else {
                        hintItems.last().addClass('selected');
                    }
                } else {
                    hintItems.last().addClass('selected');
                }
            } else {
                if (selectedItem.length) {
                    var next = selectedItem.removeClass('selected').next();
                    if (next.length) {
                        next.addClass('selected');
                    } else {
                        hintItems.first().addClass('selected');
                    }
                } else {
                    hintItems.first().addClass('selected');
                }
            }
        },
        resetHistorySearch: function () {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('console');
                data.historyIndex = -1;
            });
        },
        searchHistory: function (moveUp) {
            var data = this.data('console');
            if (data.history.length === 0) {
                data.input.val('');
                return;
            }
            if (moveUp) {
                if (data.historyIndex === -1) {
                    data.historyIndex = data.history.length - 1;
                } else {
                    data.historyIndex--;
                    if (data.historyIndex < 0) {
                        data.historyIndex = 0;
                    }
                }
            } else {
                if (data.historyIndex === -1) {
                    return;
                } else {
                    data.historyIndex++;
                    if (data.historyIndex >= data.history.length) {
                        data.historyIndex = -1;
                    }
                }
            }
            if (data.historyIndex === -1) {
                data.input.val('');
            } else {
                data.input.val(data.history[data.historyIndex]);
            }
        },
        send: function () {
            var str = (this.val()) ? this.val().trim() : '';
            if (!str.length) return;
            this.val('');
            var args = str.split(/\s+/),
                console = this.console('findConsole'),
                data = console.data('console'),
                input = args.join(' ');
            data.hints.hide();
            console.console('createMessage', console.console('getPrefix') +
                    ' ' + input, data.commandClass);
            console.console('addHistory', input);
            console.console('callCommand', args);
        },
        showHints: function () {
            var str = (this.val()) ? this.val().trim() : '',
                console = methods.findConsole.apply(this),
                data = console.data('console');
            if (!str.length) {
                data.hints.hide();
                return;
            }
            var args = str.split(/\s+/);
            console.console('resetHistorySearch');
            var hints = console.console('lookupHints', args);
            if (hints.length) {
                data.hints.find('a').remove();
                data.hints.show();
                for (var i = 0; i < hints.length; i++) {
                    var anchor = $('<a/>', {
                        'data-hint': hints[i].command.trim(),
                        'href': 'javascript:void(0);',
                        'text': hints[i].name
                    });
                    $('<span/>', {
                        'text': hints[i].tip
                    }).appendTo(anchor);
                    data.hints.append(anchor);
                    anchor.bind('click.console', methods.hintClickHandler);
                    anchor.bind('mouseout.console', methods.hintExitHandler);
                    anchor.bind('mouseover.console', methods.hintEnterHandler);
                }
            } else {
                data.hints.hide();
            }
        }
    };
    $.fn.console = function (method) {
        if (methods[method]) {
            return methods[method].apply(this,
                    Array.prototype.slice.call(arguments, 1));
        } else if (typeof(method) === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method [' + method + '] does not exist on jQuery.console');
        }
    };
})(jQuery);