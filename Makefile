.PHONY: all build push

all: build
	make push
	@echo "=== DONE ==="

build:
	docker build --no-cache -t vergissberlin/jira-resource .

push:
	docker push vergissberlin/jira-resource
