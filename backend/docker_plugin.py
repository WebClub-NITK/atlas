from docker import DockerClient, APIClient
from docker.transport import SSHHTTPAdapter
import secrets
import logging
from docker.errors import APIError, NotFound

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s", level=logging.ERROR
)

ALLOWED_CHARACTERS = (
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)


class DockerPlugin:
    def __init__(self, base_url: str = "unix://var/run/docker.sock", key_file: str = None):
        if key_file is None or not str(base_url).startswith("ssh://"):
            self.docker_client = DockerClient(base_url=base_url)
        else:
            class MySSHHTTPAdapter(SSHHTTPAdapter):
                def _connect(self):
                    if self.ssh_client:
                        self.ssh_params["key_filename"] = key_file
                        self.ssh_client.connect(**self.ssh_params)

            self.docker_client = DockerClient()
            api_client = APIClient(
                base_url="ssh://ip:22",
                use_ssh_client=True,
                version='1.41',
            )
            ssh_client = MySSHHTTPAdapter(base_url)
            api_client.mount("http+docker://ssh", ssh_client)
            self.docker_client.api = api_client

    def add_image(self, data: bytes):
        try:
            images = self.docker_client.images.load(data)
            return images[0].id
        except APIError as error:
            logging.error(error)
        return None

    def run_container(
        self,
        image: str,
        port: int | None = None,
        container_name: str = None,
        environment: dict | None = None,
        network: str | None = None,
        publish_port: bool = False,
    ):
        try:
            password = "".join(
                secrets.choice(ALLOWED_CHARACTERS) for _ in range(16)
            )

            resources = {
                "cpu_quota": 50000,  # 50% of a single core
                "cpu_period": 100000,  # 100% of a single core
                "memory": "128m",
            }

            runtime_environment = {"PASS": password}
            if environment:
                runtime_environment.update(environment)

            extra_kwargs = {}
            if network:
                # Attach to the internal challenge network: the container is
                # reachable from the backend by container name (docker DNS),
                # with no ports published on the host.
                extra_kwargs["network"] = network
            if publish_port and port:
                # Non-SSH challenges: publish the service port on a random
                # host port so users can reach it directly.
                extra_kwargs["ports"] = {f"{port}/tcp": None}

            container = self.docker_client.containers.run(
                image,
                detach=True,
                auto_remove=True,
                tty=True,
                name=container_name,
                environment=runtime_environment,
                cpu_quota=resources["cpu_quota"],
                cpu_period=resources["cpu_period"],
                mem_limit=resources["memory"],
                **extra_kwargs,
            )
            return container.id, password
        except APIError as error:
            logging.error(error)
        return None

    def stop_container(self, container_id: str):
        try:
            container = self.docker_client.containers.get(container_id)
            container.stop()
            return True
        except NotFound:
            return False
        except APIError as error:
            logging.error(error)
        return False

    def restart_container(self, container_id: str):
        try:
            container = self.docker_client.containers.get(container_id)
            container.restart()
            return True
        except APIError as error:
            logging.error(error)
        return False

    def get_images(self):
        return self.docker_client.images.list()

    def get_container_ports(self, container_id: str):
        try:
            container = self.docker_client.containers.get(container_id)
            if len(container.ports) == 0:
                return None
            else:
                return container.ports
        except APIError as error:
            logging.error(error)
        return None

    def get_container_logs(self, container_id: str, stream: bool = True):
        try:
            container = self.docker_client.containers.get(container_id)
            return container.logs(stream=stream)
        except APIError as error:
            logging.error(error)
        return None

    def start_exec(
        self,
        container_id: str,
        user: str | None = None,
        cmd=("/bin/sh",),
        rows: int = 24,
        cols: int = 80,
    ):
        """Open an interactive `docker exec` shell and return (exec_id, socket).

        The socket is a raw, bidirectional stream (TTY mode, not multiplexed):
        write keystrokes with ``sendall`` and read terminal output with
        ``recv``. Used by the WebSocket terminal proxy instead of SSH. Raises
        on failure so the caller can reject the connection.
        """
        api = self.docker_client.api
        exec_id = api.exec_create(
            container_id,
            cmd=list(cmd),
            stdin=True,
            stdout=True,
            stderr=True,
            tty=True,
            # Run as the unprivileged challenge user, never root — otherwise a
            # player could read every flag.txt regardless of its 0600 owner.
            user=user or "",
            environment=["TERM=xterm-256color"],
        )["Id"]
        sock_io = api.exec_start(exec_id, tty=True, socket=True, demux=False)
        # docker-py wraps the hijacked connection in a socket.SocketIO; the
        # underlying socket.socket (which owns the fd) is on ._sock and exposes
        # recv()/sendall()/close().
        raw_socket = getattr(sock_io, "_sock", sock_io)
        try:
            api.exec_resize(exec_id, height=rows, width=cols)
        except APIError as error:
            logging.error(error)
        return exec_id, raw_socket

    def resize_exec(self, exec_id: str, rows: int, cols: int):
        try:
            self.docker_client.api.exec_resize(
                exec_id, height=rows, width=cols
            )
            return True
        except APIError as error:
            logging.error(error)
        return False
