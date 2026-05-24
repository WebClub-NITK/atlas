#!/bin/sh

set -eu

SSH_USER="${SSH_USER:-atlas}"
PASSWORD="${PASS:-atlas}"

if ! printf '%s' "${SSH_USER}" | grep -Eq '^[A-Za-z_][A-Za-z0-9_-]*[$]?$'; then
    echo "Invalid SSH_USER: ${SSH_USER}" >&2
    exit 1
fi

if ! id "${SSH_USER}" >/dev/null 2>&1; then
    adduser -D "${SSH_USER}"
fi

USER_HOME="$(awk -F: -v user="${SSH_USER}" '$1 == user { print $6 }' /etc/passwd)"
if [ -z "${USER_HOME}" ]; then
    echo "Unable to resolve home directory for ${SSH_USER}" >&2
    exit 1
fi

mkdir -p "${USER_HOME}"
echo "${SSH_USER}:${PASSWORD}" | chpasswd

mkdir -p /var/run/sshd

cat > "${USER_HOME}/README.txt" <<EOF
Atlas test challenge container

SSH user: ${SSH_USER}
The runtime password is injected through the PASS environment variable.
This is only a starter image for testing Atlas challenge orchestration.
EOF

echo 'flag{atlas_test_challenge}' > "${USER_HOME}/flag.txt"

chown "${SSH_USER}:${SSH_USER}" "${USER_HOME}/README.txt" "${USER_HOME}/flag.txt"
chmod 644 "${USER_HOME}/README.txt"
chmod 600 "${USER_HOME}/flag.txt"

if grep -q '^#PasswordAuthentication' /etc/ssh/sshd_config; then
    sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
elif grep -q '^PasswordAuthentication' /etc/ssh/sshd_config; then
    sed -i 's/^PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
else
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config
fi

if grep -q '^#PermitRootLogin' /etc/ssh/sshd_config; then
    sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
elif grep -q '^PermitRootLogin' /etc/ssh/sshd_config; then
    sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
else
    echo 'PermitRootLogin no' >> /etc/ssh/sshd_config
fi

exec /usr/sbin/sshd -D -e -p 22
