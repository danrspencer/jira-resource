fly-osx:
	curl --user concourse -o fly 'http://192.168.100.4:8080/api/v1/cli?arch=amd64&platform=darwin'
	chmod +x fly

fly-linux:
	curl --user concourse -o fly 'http://192.168.100.4:8080/api/v1/cli?arch=amd64&platform=linux'
	chmod +x fly

login:
	./fly --target live login --concourse-url http://192.168.100.4:8080

pipeline:
	./fly --target live set-pipeline --pipeline jira-resource \
                                     --config pipelines/pipeline.yml \
                                     --load-vars-from resources/config.yml \
                                     --var "private-repo-key=`cat ~/.ssh/id_rsa`"

example:
	./fly --target live set-pipeline --pipeline jira-resource-example \
                                     --config pipelines/example.yml \
                                     --load-vars-from resources/config.yml \
                                     --var "private-repo-key=`cat ~/.ssh/id_rsa`"