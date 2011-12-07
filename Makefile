nav_file = _includes/nav_projects.html

js_engine ?= `which node`
nav_generator = $(js_engine) _lib/projects.js

all: nav

nav:
	@@if test ! -z $(js_engine); then \
		echo "Generating navigation..."; \
		$(nav_generator) $(nav_file); \
	else \
		echo "You must have NodeJS installed in order to generate navigation"; \
	fi

.PHONY: all nav