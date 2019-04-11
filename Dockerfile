FROM alpine:3.7

LABEL maintainer="Dan Spencer" \
	authors="Dan Spencer, André Lademann" \
	version="0.0.4" \
	description="Jira ticket resource for concourse ci."

RUN apk add --no-cache \
    bash \
    nodejs

COPY check          /opt/resource/check
COPY in             /opt/resource/in
COPY out            /opt/resource/out
COPY src/           /opt/resource/src/
COPY package.json   /opt/resource/package.json

RUN chmod +x /opt/resource/out /opt/resource/in /opt/resource/check

WORKDIR /opt/resource/

RUN npm install
