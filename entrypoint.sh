#!/bin/sh

# Set the atlas user password from the PASS environment variable
if [ -n "$PASS" ]; then
    echo "atlas:$PASS" | chpasswd
fi

# Start SSH server in the foreground
exec /usr/sbin/sshd -D -e
