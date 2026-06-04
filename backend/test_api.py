import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model

User = get_user_model()
client = Client()

admin_user = User.objects.get(username='admin')
client.force_login(admin_user)

response = client.post('/challenges/6/start')
print(f"Status Code: {response.status_code}")
print(f"Response data: {response.json()}")
