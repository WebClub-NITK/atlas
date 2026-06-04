#!/bin/sh

echo "Starting challenge..."

# Start SSH server
/usr/sbin/sshd

# Keep container alive
tail -f /dev/null