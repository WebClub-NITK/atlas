FROM alpine:latest

# Make sure to include ssh-server with anyother dependencies you need and keep in mind the user cannot install any package on the fly and ideally wont have root access
RUN apk add --no-cache openssh-server shadow && \
    adduser -D atlas && \
    ssh-keygen -A

WORKDIR /home/atlas/

COPY challenge.sh /home/atlas/challenge.sh
RUN chmod +x /home/atlas/challenge.sh

USER atlas

# Do your build here if you need unprivileged build steps.

USER root
# The final image user stays root because sshd needs it to start on port 22.
# The SSH login account is selected at runtime through the SSH_USER env var.

EXPOSE 22

CMD [ "/bin/sh", "-c", "/home/atlas/challenge.sh" ]
