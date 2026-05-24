import json
import asyncio
import paramiko
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Container
import logging

logger = logging.getLogger("atlas_backend")

class TerminalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.challenge_id = self.scope['url_route']['kwargs']['challenge_id']
        self.team = await self.get_user_team()
        
        if not self.team:
            await self.close(code=4003)
            return

        self.container = await self.get_container()
        if not self.container:
            await self.close(code=4004)
            return

        await self.accept()

        # Connect SSH with retries (container SSH may need time to boot)
        try:
            self.ssh = paramiko.SSHClient()
            self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            connected = False
            last_error = None
            for attempt in range(10):  # Retry up to 10 times
                try:
                    await self.send(text_data=json.dumps({
                        'output': f'\r\nConnecting to container (attempt {attempt + 1})...\r\n'
                    }))
                    # Run the blocking SSH connect in a thread
                    await asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: self.ssh.connect(
                            hostname=self.container.container_id, 
                            port=22, 
                            username=self.container.ssh_user or 'atlas',
                            password=self.container.ssh_password,
                            timeout=5
                        )
                    )
                    connected = True
                    break
                except Exception as e:
                    last_error = e
                    await asyncio.sleep(2)  # Wait 2 seconds between retries
            
            if not connected:
                raise last_error

            self.ssh_channel = self.ssh.invoke_shell(term='xterm-256color')
            self.ssh_channel.setblocking(0)
            
            # Start background task to read from SSH
            self.keep_reading = True
            self.read_task = asyncio.create_task(self.read_ssh_stdout())
            
        except Exception as e:
            logger.error(f"SSH Connection failed: {e}")
            await self.send(text_data=json.dumps({'error': f'SSH Connection failed: {str(e)}'}))
            await self.close(code=4005)

    async def disconnect(self, close_code):
        self.keep_reading = False
        if hasattr(self, 'read_task'):
            self.read_task.cancel()
        if hasattr(self, 'ssh_channel'):
            self.ssh_channel.close()
        if hasattr(self, 'ssh'):
            self.ssh.close()

    async def receive(self, text_data=None, bytes_data=None):
        if text_data:
            data = json.loads(text_data)
            if 'input' in data and hasattr(self, 'ssh_channel'):
                self.ssh_channel.send(data['input'])
            elif 'resize' in data and hasattr(self, 'ssh_channel'):
                cols = data['resize'].get('cols', 80)
                rows = data['resize'].get('rows', 24)
                try:
                    self.ssh_channel.resize_pty(width=cols, height=rows)
                except Exception:
                    pass

    async def read_ssh_stdout(self):
        while self.keep_reading:
            try:
                if self.ssh_channel.recv_ready():
                    data = self.ssh_channel.recv(4096)
                    if data:
                        await self.send(text_data=json.dumps({'output': data.decode('utf-8', errors='replace')}))
                else:
                    await asyncio.sleep(0.01)
            except Exception as e:
                logger.error(f"Error reading SSH: {e}")
                break

    @database_sync_to_async
    def get_user_team(self):
        return self.user.team if hasattr(self.user, 'team') else None

    @database_sync_to_async
    def get_container(self):
        return Container.objects.filter(
            team=self.team,
            challenge_id=self.challenge_id,
        ).first()
