#!/bin/sh

echo "Starting the application"
echo "atlas:$PASS" | chpasswd
unset PASS
/usr/sbin/sshd -D