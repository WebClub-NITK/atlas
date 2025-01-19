#!/bin/sh

echo "Starting the application"
echo "atlas:$PASS" | chpasswd
/usr/sbin/sshd -D