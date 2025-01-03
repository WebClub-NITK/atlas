from docker import DockerClient
from docker.errors import APIError

# TODO: Add better error reporting than print statements

class DockerPlugin:
    def __init__(self, base_url: str = "unix://var/run/docker.sock"):
        self.client = DockerClient(base_url=base_url)
    
    def add_image(self, data: bytes):
        try:
            self.client.images.load(data)
            return True
        except APIError as error:
            print(error)
        return False
    
    def run_container(self, image: str, port: int):
        try:
            # TODO: Play around with the resources parameter to limit the amount of resources the container can use
            container = self.client.containers.run(image, detach=True, auto_remove=True, ports={f"{port}/tcp": None})
            return container.id
        except APIError as error:
            print(error)
        return None
    
    def stop_container(self, container_id: str):
        try:
            container = self.client.containers.get(container_id)
            container.stop()
            return True
        except APIError as error:
            print(error)
        return False
    
    def restart_container(self, container_id: str):
        try:
            container = self.client.containers.get(container_id)
            container.restart()
            return True
        except APIError as error:
            print(error)
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
        except APIError as error:
            print(error)
        return None