repos_file = ajax/repos.json

js_engine ?= `which node`
repos_generator = $(js_engine) _lib/repos.js

all: repos

repos:
	@@if test ! -z $(js_engine); then \
		echo "Generating repositories..."; \
		$(repos_generator) $(repos_file); \
	else \
		echo "You must have NodeJS installed in order to generate repositories"; \
	fi

.PHONY: all repos