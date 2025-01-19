import docker
import secrets
import logging
import docker.errors

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s", level=logging.ERROR
)

ALLOWED_CHARACTERS = (
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)


class DockerPlugin:
    def __init__(self, base_url: str = "unix://var/run/docker.sock"):
        self.client = docker.DockerClient(base_url=base_url)

    def add_image(self, data: bytes):
        try:
            images = self.client.images.load(data)
            return images[0].id
        except docker.errors.APIError as error:
            logging.error(error)
        return None

    def run_container(self, image: str, port: int, container_name: str = None):
        try:
            password = "".join(
                secrets.choice(ALLOWED_CHARACTERS) for _ in range(16)
            )

            resources = {
                "cpu_quota": 50000,  # 50% of a single core
                "cpu_period": 100000,  # 100% of a single core
                "memory": "512m",
            }

            if container_name and not container_name.isalnum():
                logging.error("Invalid container name.")
                return None

            container = self.client.containers.run(
                image,
                detach=True,
                auto_remove=True,
                tty=True,
                name=container_name,
                environment={"PASS": password},
                ports={f"{port}/tcp": None},
                cpu_quota=resources["cpu_quota"],
                cpu_period=resources["cpu_period"],
                mem_limit=resources["memory"],
            )
            return container.id, password
        except docker.errors.APIError as error:
            logging.error(error)
        return None

    def stop_container(self, container_id: str):
        try:
            container = self.client.containers.get(container_id)
            container.stop()
            return True
        except docker.errors.APIError as error:
            logging.error(error)
        return False

    def restart_container(self, container_id: str):
        try:
            container = self.client.containers.get(container_id)
            container.restart()
            return True
        except docker.errors.APIError as error:
            logging.error(error)
        return False

    def get_images(self):
        return self.client.images.list()

    def get_container_ports(self, container_id: str):
        try:
            container = self.client.containers.get(container_id)
            if len(container.ports) == 0:
                return None
            else:
                return container.ports
        except docker.errors.APIError as error:
            logging.error(error)
        return None

    def get_container_logs(self, container_id: str, stream: bool = True):
        try:
            container = self.client.containers.get(container_id)
            return container.logs(stream=stream)
        except docker.errors.APIError as error:
            logging.error(error)
        return None
