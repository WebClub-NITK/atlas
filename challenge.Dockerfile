FROM alpine:latest

# No SSH server: the in-browser terminal reaches this container via
# `docker exec`, not a network login. Keep the image minimal. The
# unprivileged login user is created at build time and can be overridden at
# runtime via the SSH_USER env var. The user cannot install packages on the
# fly and should not have root access.
RUN adduser -D atlas

WORKDIR /home/atlas/

COPY challenge.sh /home/atlas/challenge.sh
RUN chmod +x /home/atlas/challenge.sh

# Do unprivileged build steps here if you need them, e.g.:
#   USER atlas
#   RUN ...
#   USER root

# The entrypoint runs as root so it can create the runtime user and lock down
# flag permissions; the terminal itself execs in as the unprivileged user.
CMD [ "/bin/sh", "-c", "/home/atlas/challenge.sh" ]
