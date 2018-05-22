#!/bin/bash

docker build --no-cache -t vergissberlin/jira-resource .
docker push vergissberlin/jira-resource
