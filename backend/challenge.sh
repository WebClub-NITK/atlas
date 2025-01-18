#!/bin/bash

echo "Starting the application"
echo "atlas:$SSH_PASS" | chpasswd
service ssh start
bash