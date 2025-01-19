FROM alpine:latest

RUN apk add --no-cache openssh-server

RUN adduser -D atlas

RUN ssh-keygen -A

WORKDIR /home/atlas/

COPY challenge.sh /home/atlas/challenge.sh
RUN chmod +x /home/atlas/challenge.sh

# ENV PASS=atlas

CMD [ "/bin/sh", "-c", "/home/atlas/challenge.sh" ]

# EXPOSE 22