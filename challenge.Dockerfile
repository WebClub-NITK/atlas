FROM alpine:latest

RUN apk add --no-cache openssh-server sudo && \
    adduser -D atlas && \
    ssh-keygen -A

# Set a default password (will be overridden at runtime by PASS env var)
RUN echo "atlas:atlas123" | chpasswd

# Allow password authentication in the SSH config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/g' /etc/ssh/sshd_config && \
    sed -i 's/#PermitRootLogin.*/PermitRootLogin no/g' /etc/ssh/sshd_config

WORKDIR /home/atlas/

# Copy entrypoint and challenge scripts
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY challenge.sh /home/atlas/challenge.sh
RUN chmod +x /home/atlas/challenge.sh

# Setup flag in a hidden location
RUN echo "flag{docker_ssh_challenge}" > /root/flag.txt && \
    chmod 600 /root/flag.txt

# ============================================================
# VULNERABILITY: sudo misconfiguration
# atlas can run cat as root without a password
# ============================================================
RUN echo "atlas ALL=(root) NOPASSWD: /bin/cat" >> /etc/sudoers

# ============================================================
# BREADCRUMBS & HINTS
# ============================================================

# Hint 1: Welcome message
RUN echo '==========================================' > /home/atlas/README.txt && \
    echo '  Welcome to the Atlas Challenge! 🏴‍☠️'       >> /home/atlas/README.txt && \
    echo '==========================================' >> /home/atlas/README.txt && \
    echo ''                                           >> /home/atlas/README.txt && \
    echo '  Your goal: find and read the hidden flag.'>> /home/atlas/README.txt && \
    echo ''                                           >> /home/atlas/README.txt && \
    echo '  HINT: The flag is stored somewhere only'  >> /home/atlas/README.txt && \
    echo '  the root user can read. Check /root/.'    >> /home/atlas/README.txt && \
    echo ''                                           >> /home/atlas/README.txt && \
    echo '  But wait — you are not root!'             >> /home/atlas/README.txt && \
    echo '  Maybe check what you CAN do as root...'   >> /home/atlas/README.txt && \
    echo ''                                           >> /home/atlas/README.txt && \
    echo '  Try: sudo -l'                             >> /home/atlas/README.txt && \
    echo ''                                           >> /home/atlas/README.txt && \
    echo '  Need more help? Read hints.txt'           >> /home/atlas/README.txt && \
    echo '==========================================' >> /home/atlas/README.txt
RUN chown atlas:atlas /home/atlas/README.txt

# Hint 2: Step-by-step hints
RUN echo '====== HINTS ======' > /home/atlas/hints.txt && \
    echo '' >> /home/atlas/hints.txt && \
    echo 'Step 1: The flag is in /root/flag.txt' >> /home/atlas/hints.txt && \
    echo '        Try: cat /root/flag.txt' >> /home/atlas/hints.txt && \
    echo '        (You will get "Permission denied")' >> /home/atlas/hints.txt && \
    echo '' >> /home/atlas/hints.txt && \
    echo 'Step 2: Check what you can run as root:' >> /home/atlas/hints.txt && \
    echo '        sudo -l' >> /home/atlas/hints.txt && \
    echo '' >> /home/atlas/hints.txt && \
    echo 'Step 3: Use your sudo privileges to read it:' >> /home/atlas/hints.txt && \
    echo '        sudo cat /root/flag.txt' >> /home/atlas/hints.txt && \
    echo '' >> /home/atlas/hints.txt && \
    echo '===================' >> /home/atlas/hints.txt
RUN chown atlas:atlas /home/atlas/hints.txt

# Shell history breadcrumbs
RUN echo 'cat README.txt' > /home/atlas/.ash_history && \
    echo 'cat /root/flag.txt' >> /home/atlas/.ash_history && \
    echo 'sudo -l' >> /home/atlas/.ash_history && \
    chown atlas:atlas /home/atlas/.ash_history

EXPOSE 22

# Use entrypoint to set dynamic password from PASS env var, then start sshd
ENTRYPOINT ["/entrypoint.sh"]