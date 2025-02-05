FROM alpine:latest

# Make sure to include ssh-server with anyother dependencies you need and keep in mind the user cannot install any package on the fly and ideally wont have root access
RUN apk add --no-cache openssh-server && \
    adduser -D atlas && \
    ssh-keygen -A

WORKDIR /home/atlas/

COPY challenge.sh /home/atlas/challenge.sh
RUN chmod +x /home/atlas/challenge.sh

USER atlas

# Do your build here

USER root
# since the sshd process requires root access to start change user root before ending the build
# The startup script can also be changed as long as use remember to set your user password (need not be atlas can be anything like a hint) and  

CMD [ "/bin/sh", "-c", "/home/atlas/challenge.sh" ]