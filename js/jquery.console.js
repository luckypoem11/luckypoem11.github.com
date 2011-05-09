(function ($, undefined) {
    var methods = {
        addHistory: function (str) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('console');
                data.history.push(str);
                data.historyIndex = -1;
            });
        },
        callCommand: function (args) {
            var data = this.data('console'),
                found = false,
                i = 0,
                obj = data.cmd,
                prop = '';
            for (; i < args.length; i++) {
                found = false;
                for (prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        if (prop === args[i] && prop.charAt(0) !== '_') {
                            obj = obj[prop];
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    break;
                }
            }
            if (obj !== data.cmd) {
                if (obj.hasOwnProperty('_call')) {
                    obj._call.apply(this, [Array.prototype.slice.call(args, i)]);
                } else if (obj.hasOwnProperty('_usage')) {
                    this.console('createMessage', obj._usage, data.errorClass);
                } else {
                    this.console('createMessage', 'Command not valid!',
                            data.errorClass);
                }
            } else {
                this.console('createMessage', 'Command not found!',
                        data.errorClass);
            }
        },
        createMessage: function (str, style, group) {
            var data = this.data('console');
            str = str || '';
            style = style || '';
            var obj = {
                'append': function (content) {
                    obj.target.append(content || '');
                    data.callback(obj.target);
                    return obj;
                },
                'replace': function (content) {
                    obj.target.html(content || '');
                    data.callback(obj.target);
                    return obj;
                },
                'target': $('<div/>', {
                    'class': data.messageClass + ' ' + style,
                    'html': str
                })
            };
            if (group) {
                group.append(obj.target);
            } else {
                data.output.append(obj.target);
            }
            data.callback(obj.target);
            return obj;
        },
        // TODO: Remove css for bottom border so command methods must add divider class (e.g. once completed) to message-group to see it
        createMessageGroup: function (str, style) {
            var data = this.data('console'),
                obj = $('<div/>', {
                    'class': data.messageGroupClass
                });
            if (str) {
                style = style || '';
                obj.append($('<div/>', {
                    'class': data.messageClass + ' ' + style,
                    'html': str
                }));
            }
            data.output.append(obj);
            data.callback(obj);
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
                prefix = (data.username) ? data.username : 'guest';
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
                                msgGroup = $this.console('createMessageGroup'),
                                path;
                            if (args.length) {
                                path = args[0];
                            }
                            if (!path) {
                                 $this.console('createMessage',
                                        data.cmd.cd._usage, data.errorClass,
                                        msgGroup);
                                 return;
                            }
                            $this.console('lookupManifest', path, function (manifest) {
                                if (manifest) {
                                    data.vfsCd = manifest.path;
                                    $this.console('createMessage',
                                            'Working directory changed.', '',
                                            msgGroup);
                                } else {
                                    $this.console('createMessage',
                                            'cd: couldn\'t resolve path \'' +
                                            path + '\'', data.errorClass,
                                            msgGroup);
                                }
                            });
                        },
                        '_help': 'change working directory',
                        '_usage': 'usage: cd directory'
                    },
                    'clear': {
                        '_call': function (args) {
                            var data = this.data('console');
                            data.output.find('.' + data.messageGroupClass +
                                    ', .' + data.messageClass).remove();
                            data.callback();
                        },
                        '_help': 'clear all the messages from the console',
                        '_usage': 'usage: clear'
                    },
                    'help': {
                        '_call': function (args) {
                            // TODO: Add support for 'help [command]' usage
                            // TODO: Ensure commands are sorted alphabetically
                            var arr = [],
                                data = this.data('console'),
                                i = 0,
                                msgGroup = this.console('createMessageGroup'),
                                obj = data.cmd,
                                prop = '';
                            for (prop in obj) {
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
                                }), '', msgGroup);
                            }
                        },
                        '_help': 'show general help information and a list of available commands',
                        '_usage': 'usage: help'
                    },
                    'ls': {
                        '_call': function (args) {
                            // TODO: Support more options and maybe file arguments?
                            var $this = this,
                                arr = [],
                                data = $this.data('console'),
                                i = 0,
                                invalidArg = false,
                                msgGroup = $this.console('createMessageGroup'),
                                path,
                                showHidden = false;
                            for (; i < args.length; i++) {
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
                                            'ls: illegal option ' + arg,
                                            data.errorClass, msgGroup);
                                    $this.console('createMessage',
                                            data.cmd.ls._usage,
                                            data.errorClass, msgGroup);
                                    return;
                                }
                            }
                            path = path || '';
                            $this.console('lookupManifest', path, function (manifest) {
                                var j = 0;
                                if (manifest) {
                                    arr = Array.prototype.concat.call(manifest.directories, manifest.files);
                                    arr.sort();
                                    if (arr.length === 0) {
                                        $this.console('createMessage',
                                                '.<br/>..', '',  msgGroup);
                                        return;
                                    }
                                    for (; j < arr.length; j++) {
                                        if (arr[j].indexOf('.') !== 0 ||
                                                showHidden) {
                                            $this.console('createMessage',
                                                    arr[j], '', msgGroup);
                                        }
                                    }
                                } else {
                                    $this.console('createMessage', path +
                                            ': No such file or directory',
                                            data.errorClass, msgGroup);
                                }
                            });
                        },
                        '_help': 'list directory contents',
                        '_usage': 'usage: ls -a'
                    },
                    'open': {
                        '_call': function (args) {
                            var $this = this,
                                data = $this.data('console'),
                                fileName,
                                msgGroup = $this.console('createMessageGroup'),
                                path,
                                rootIndex = -1,
                                rootPath = '';
                            if (args.length) {
                                path = args[0];
                            }
                            if (!path) {
                                 $this.console('createMessage',
                                        data.cmd.open._usage, data.errorClass,
                                        msgGroup);
                                 return;
                            }
                            rootIndex = path.lastIndexOf('/');
                            if (rootIndex !== -1) {
                                fileName = path.substring(rootIndex + 1);
                                rootPath = path.substring(0, rootIndex);
                            } else {
                                fileName = path;
                            }
                            if (!fileName) {
                                $this.console('createMessage',
                                        'open: must be valid file',
                                        data.errorClass, msgGroup);
                                return;
                            }
                            $this.console('lookupManifest', rootPath, function (manifest) {
                                var i = 0;
                                if (manifest) {
                                    var fileExists = false,
                                        files = manifest.files,
                                        message = {};
                                    for (; i < files.length; i++) {
                                        if (files[i] === fileName) {
                                            fileExists = true;
                                            break;
                                        }
                                    }
                                    if (fileExists) {
                                        message = $this.console('createMessage',
                                                'Loading...', '', msgGroup);
                                        $.get(manifest.path + '/' + fileName, function (content) {
                                            message.replace(content);
                                        });
                                    } else {
                                        $this.console('createMessage',
                                                'open: couldn\'t resolve path \'' +
                                                path + '\'', data.errorClass,
                                                msgGroup);
                                    }
                                } else {
                                    $this.console('createMessage',
                                            'open: couldn\'t resolve path \'' +
                                            path + '\'', data.errorClass,
                                            msgGroup);
                                }
                            });
                        },
                        '_help': 'open a file to view',
                        '_usage': 'usage: open file'
                    },
                    'pwd': {
                        '_call': function (args) {
                            var data = this.data('console');
                            this.console('createMessageGroup', data.vfsCd);
                        },
                        '_help': 'return working directory name',
                        '_usage': 'usage: pwd'
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
                'messageGroupClass': 'message-group',
                'output': '.output',
                'prefixSeperator': ':',
                'prefixSymbol': '$',
                'username': '',
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
            var $this = $(this),
                console = $this.console('findConsole'),
                data = console.data('console');
            switch (event.keyCode) {
                case 13: // Enter
                    if (data.hints.is(':visible') &&
                            data.hints.find('.selected').length) {
                        var hint = data.hints.find('.selected')
                                .attr('data-hint');
                        data.input.val(hint + ' ');
                        data.hints.hide();
                    } else {
                        $this.console('send', console, data);
                    }
                    break;
                case 27: // Escape
                    if (data.hints.is(':visible')) {
                        data.hints.hide();
                    } else {
                        $this.console('showHints', console, data);
                    }
                    break;
                case 38: // Up
                case 40: // Down
                    var moveUp = event.keyCode === 38;
                    if (data.hints.is(':visible')) {
                        console.console('navigateHints', moveUp, data);
                    } else {
                        console.console('searchHistory', moveUp, data);
                    }
                    break;
                default:
                    $this.console('showHints', console, data);
            }
        },
        lookupHints: function (args) {
            var arr = [],
                data = this.data('console'),
                hints = [],
                i = 0,
                lastCommandFound = -1,
                obj = data.cmd,
                prop = '';
            for (; i < args.length; i++) {
                for (prop in obj) {
                    if (obj.hasOwnProperty(prop) && prop.charAt(0) !== '_') {
                        if (prop === args[i]) {
                            arr.push(obj[prop]);
                            lastCommandFound = i;
                            obj = obj[prop];
                            break;
                        }
                    }
                }
                if (lastCommandFound !== i) {
                    break;
                }
            }
            if (arr.length === args.length) {
                hints.push({
                    'command': args.join(' '),
                    'name': args[lastCommandFound],
                    'tip': obj._help
                });
            } else if (arr.length === args.length - 1) {
                for (prop in obj) {
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
            // TODO: Ensure hints are sorted alphabetically (on command name)
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
        navigateHints: function (moveUp, data) {
            var hintItems = data.hints.find('a'),
                selectedItem = hintItems.filter('.selected');
            if (!data) {
                data = this.data('console');
            }
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
                $(this).data('console').historyIndex = -1;
            });
        },
        searchHistory: function (moveUp, data) {
            if (!data) {
                data = this.data('console');
            }
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
        send: function (console, data) {
            var str = (this.val()) ? this.val().trim() : '';
            if (!console) {
                console = this.console('findConsole');
                data = console.data('console');
            }
            if (!str.length) {
                return;
            }
            this.val('');
            var args = str.split(/\s+/),
                input = args.join(' ');
            data.hints.hide();
            console.console('createMessage', console.console('getPrefix') +
                    ' ' + input, data.commandClass);
            console.console('addHistory', input);
            console.console('callCommand', args);
        },
        showHints: function (console, data) {
            var str = (this.val()) ? this.val().trim() : '';
            if (!console) {
                console = this.console('findConsole');
                data = console.data('console');
            }
            if (!str.length) {
                data.hints.hide();
                return;
            }
            var args = str.split(/\s+/);
            console.console('resetHistorySearch');
            var anchor = {},
                hints = console.console('lookupHints', args),
                i = 0;
            if (hints.length) {
                data.hints.find('a').remove();
                data.hints.show();
                for (; i < hints.length; i++) {
                    anchor = $('<a/>', {
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