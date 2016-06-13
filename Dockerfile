FROM alpine:3.3

RUN apk add --no-cache \
    bash \
    nodejs

COPY check          /opt/resource/check
COPY in             /opt/resource/in
COPY out            /opt/resource/out
COPY src/out.js     /opt/resource/src/out.js

RUN chmod +x /opt/resource/out /opt/resource/in /opt/resource/check

