(function ($) {
	var methods = {
		addHistory: function (str) {
			return this.each(function () {
				var $this = $(this),
					data = $this.data('console');
				data.history.push(str);
				data.historyIndex = -1
			});
		},
		callCommand: function (args) {
			var data = this.data('console'),
				i = 0,
				obj = data.cmd;
			for (; i < args.length; i++) {
				var found = false;
				for (prop in obj) {
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
					obj._call.apply(this, Array.prototype.slice.call(args, i));
				} else {
					this.console('createMessage', 'Command not valid! Try using a sub-command...', data.errorClass);
				}
			} else {
				this.console('createMessage', 'Command not found!', data.errorClass);
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
		init: function (options) {
			var settings = {
				'callback': function (obj) {},
				'cmd': {
					'cd': {
						'_call': function (args) {
							alert('cd');
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
									'html': arr[i].name + ' &nbsp;&nbsp; ' + arr[i].tip
								}));
							}
						},
						'_help': 'show general help information and a list of available commands'
					},
					'ls': {
						'_call': function (args) {
							alert('ls');
						},
						'_help': 'list directory contents'
					}
				},
				'commandClass': 'command',
				'errorClass': 'error',
				'hints': '.hints',
				'history': [],
				'historyIndex': -1,
				'infoClass': 'info',
				'input': 'input[type="text"]',
				'maxHints': 10,
				'messageClass': 'message',
				'output': '.output',
				'prefix': '$',
				'vfs': {},
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
						$this.console('createMessage', data.welcomeMessage, data.infoClass);
					}
				}
			});
		},
		keyDownHandler: function (event) {
			switch (event.keyCode) {
				case 38: // Up
				case 40: // Down
					event.preventDefault();
				default:
			}
		},
		keyUpHandler: function (event) {
			var $this = $(this);
			switch (event.keyCode) {
				case 13: // Enter
					var data = $this.console('findData');
					if (data.hints.is(':visible') && data.hints.find('.selected').length) {
						var hint = data.hints.find('.selected').attr('data-hint');
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
				if (lastCommandFound !== i) break;
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
						if (prop.indexOf(args[args.length - 1]) === 0 && obj[prop].hasOwnProperty('_help')) {
							if (data.maxHints <= 0 || hints.length <= data.maxHints) {
								hints.push({
									'command': args.slice(0, args.length - 2).join(' ') + ' ' + prop,
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
				console = methods.findConsole.apply(this),
				data = console.data('console'),
				input = args.join(' ');
			data.hints.hide();
			console.console('createMessage', data.prefix + ' ' + input, data.commandClass);
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
				function hintClick(event) {
					var hint = $(this).attr('data-hint');
					data.input.val(hint + ' ').focus();
					data.hints.hide();
				}
				function hintMouseOut(event) {
					$(this).removeClass('selected');
				}
				function hintMouseOver(event) {
					$(this).addClass('selected');
				}
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
					anchor.bind('click.console', hintClick);
					anchor.bind('mouseout.console', hintMouseOut);
					anchor.bind('mouseover.console', hintMouseOver);
				}
			} else {
				data.hints.hide();
			}
		}
	};
	$.fn.console = function (method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof(method) === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method [' + method + '] does not exist on jQuery.console');
		}
	};
})(jQuery);