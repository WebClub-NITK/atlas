FROM alpine:latest

RUN apk add --no-cache openssh-server

RUN adduser -D atlas

RUN ssh-keygen -A

WORKDIR /home/atlas/

COPY challenge.sh /home/atlas/challenge.sh
RUN chmod +x /home/atlas/challenge.sh

USER atlas

# Do your build here

USER root

CMD [ "/bin/sh", "-c", "/home/atlas/challenge.sh" ]