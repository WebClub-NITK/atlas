#!/bin/sh

set -eu

# The unprivileged user the in-browser terminal execs into (docker exec
# --user). There is no SSH daemon: the terminal arrives over the Docker API.
# The env var is still called SSH_USER for backwards compatibility with the
# orchestrator.
SHELL_USER="${SSH_USER:-atlas}"

if ! printf '%s' "${SHELL_USER}" | grep -Eq '^[A-Za-z_][A-Za-z0-9_-]*[$]?$'; then
    echo "Invalid SSH_USER: ${SHELL_USER}" >&2
    exit 1
fi

if ! id "${SHELL_USER}" >/dev/null 2>&1; then
    adduser -D "${SHELL_USER}"
fi

USER_HOME="$(awk -F: -v user="${SHELL_USER}" '$1 == user { print $6 }' /etc/passwd)"
if [ -z "${USER_HOME}" ]; then
    echo "Unable to resolve home directory for ${SHELL_USER}" >&2
    exit 1
fi

mkdir -p "${USER_HOME}"

cat > "${USER_HOME}/README.txt" <<EOF
Atlas test challenge container

Shell user: ${SHELL_USER}
You reach this container through the in-browser terminal (docker exec) —
there is no SSH. This is only a starter image for testing Atlas challenge
orchestration.
EOF

echo 'flag{atlas_test_challenge}' > "${USER_HOME}/flag.txt"

chown "${SHELL_USER}:${SHELL_USER}" "${USER_HOME}/README.txt" "${USER_HOME}/flag.txt"
chmod 644 "${USER_HOME}/README.txt"
chmod 600 "${USER_HOME}/flag.txt"

# No SSH daemon: the terminal is delivered via `docker exec`. Keep the
# container alive so the orchestrator can exec into it on demand.
exec tail -f /dev/null
