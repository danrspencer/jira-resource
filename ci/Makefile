.PHONY: fly-osx fly-linux login pipeline example unpause destroy

fly-osx:
	curl --user concourse -o fly 'http://192.168.100.4:8080/api/v1/cli?arch=amd64&platform=darwin'
	chmod +x fly

fly-linux:
	curl --user concourse -o fly 'http://192.168.100.4:8080/api/v1/cli?arch=amd64&platform=linux'
	chmod +x fly

login:
	./fly --target main-jira login --concourse-url http://192.168.100.4:8080

pipeline:
	./fly --target main-jira set-pipeline --pipeline jira-resource \
                                     --config pipelines/pipeline.yml \
                                     --load-vars-from resources/config.yml \
                                     --var "private-repo-key=`cat ~/.ssh/concourse`" \
                                     -n

example:
	./fly --target main-jira set-pipeline --pipeline jira-resource-example \
                                     --config pipelines/example.yml \
                                     --load-vars-from resources/config.yml \
                                     --var "private-repo-key=`cat ~/.ssh/concourse`" \
                                     -n
unpause:
	./fly -t main-jira unpause-pipeline -p jira-resource
	./fly -t main-jira unpause-pipeline -p jira-resource-example

destroy:
	./fly -t main-jira destroy-pipeline -p jira-resource -n
	./fly -t main-jira destroy-pipeline -p jira-resource-example -n
