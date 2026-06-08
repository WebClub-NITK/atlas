"""WebSocket terminal proxy backed by ``docker exec``.

Bridges a browser WebSocket (xterm.js) to an interactive shell inside the
team's challenge container via ``docker exec`` over the Docker Engine API —
no SSH, no published ports, no daemon inside the challenge container. The
exec stream travels over the docker socket the backend already mounts, so the
challenge container needs no network reachability at all for the terminal.

Wire protocol (mirrored in frontend/src/components/ChallengeTerminal.jsx):
  - binary frames carry raw terminal bytes in both directions
  - text frames carry JSON control messages, e.g.
    {"type": "resize", "cols": 120, "rows": 32}

Close codes sent to the browser:
  - 4401 not authenticated / not in a team
  - 4403 team is banned
  - 4404 no running container for this challenge (or not a shell challenge)
  - 4502 could not exec into the container
"""

import asyncio
import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings

from docker_plugin import DockerPlugin

from .models import Container

logger = logging.getLogger('atlas_backend')

EXEC_READ_CHUNK = 32 * 1024

# Dedicated pool for blocking docker-exec socket I/O. Every live terminal parks
# one worker in a blocking recv(), so max_workers effectively caps concurrent
# terminal sessions (the asyncio default executor would cap them lower and
# starve other work).
EXEC_IO_EXECUTOR = ThreadPoolExecutor(
    max_workers=int(os.getenv("TERMINAL_MAX_SESSIONS", "100")),
    thread_name_prefix="exec-io",
)


class TerminalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.plugin = None
        self.exec_id = None
        self.sock = None
        self.reader_task = None

        # Accept before validating so the browser receives our close codes;
        # a pre-accept close surfaces as an opaque handshake failure.
        await self.accept()

        user = self.scope.get("user")
        if user is None or not user.team:  # team preloaded via select_related
            await self.close(code=4401)
            return
        if user.team.is_banned:
            await self.close(code=4403)
            return

        challenge_id = self.scope["url_route"]["kwargs"]["challenge_id"]
        container = await self._get_container(user.team, challenge_id)
        # ssh_user is the unprivileged shell user to exec as; its presence is
        # what marks a challenge as a terminal (vs. published-port) challenge.
        if container is None or not container.ssh_user:
            await self.close(code=4404)
            return

        self.container_id = container.container_id
        self.exec_user = container.ssh_user
        self.team_name = user.team.name

        loop = asyncio.get_running_loop()
        try:
            await loop.run_in_executor(EXEC_IO_EXECUTOR, self._open_exec)
        except Exception:
            logger.exception(
                "Terminal proxy could not exec into container %s for team %s",
                self.container_id[:12], self.team_name,
            )
            await self.close(code=4502)
            return

        self.reader_task = asyncio.create_task(self._pump_exec_to_ws())

    @database_sync_to_async
    def _get_container(self, team, challenge_id):
        return (
            Container.objects.filter(team=team, challenge_id=challenge_id)
            .order_by("-created_at")
            .first()
        )

    def _open_exec(self):
        """Blocking; runs in EXEC_IO_EXECUTOR."""
        self.plugin = DockerPlugin(
            base_url=settings.DOCKER_HOST, key_file=settings.SSH_KEY_FILE
        )
        self.exec_id, self.sock = self.plugin.start_exec(
            self.container_id, user=self.exec_user
        )

    async def _pump_exec_to_ws(self):
        """Forward exec output to the WebSocket until EOF or teardown."""
        loop = asyncio.get_running_loop()
        sock = self.sock
        try:
            while True:
                data = await loop.run_in_executor(
                    EXEC_IO_EXECUTOR, sock.recv, EXEC_READ_CHUNK
                )
                if not data:
                    break
                await self.send(bytes_data=data)
        except Exception:
            # Socket torn down (client left, container stopped, ...)
            pass
        finally:
            try:
                await self.close()
            except Exception:
                pass

    async def receive(self, text_data=None, bytes_data=None):
        if self.sock is None:
            return
        try:
            if bytes_data:
                # Keystrokes are tiny; sendall to the local docker socket
                # won't meaningfully block the event loop.
                self.sock.sendall(bytes_data)
            elif text_data:
                message = json.loads(text_data)
                if message.get("type") == "resize":
                    rows = max(1, int(message.get("rows", 24)))
                    cols = max(1, int(message.get("cols", 80)))
                    loop = asyncio.get_running_loop()
                    # exec_resize is an HTTP call to the daemon; keep it off
                    # the event loop thread.
                    await loop.run_in_executor(
                        EXEC_IO_EXECUTOR,
                        self.plugin.resize_exec,
                        self.exec_id,
                        rows,
                        cols,
                    )
        except (json.JSONDecodeError, TypeError, ValueError):
            pass  # malformed control message; ignore
        except OSError:
            await self.close()

    async def disconnect(self, code):
        reader = self.reader_task
        sock = self.sock
        self.reader_task = None
        self.sock = None

        # Closing the socket unblocks the recv() parked in the executor and
        # sends EOF to the shell's stdin, so the exec'd process exits.
        if sock is not None:
            try:
                sock.close()
            except Exception:
                pass
        if reader is not None:
            reader.cancel()
