# Generated by Django 5.1.4 on 2025-02-25 16:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('atlas_backend', '0004_alter_team_password'),
    ]

    operations = [
        migrations.AlterField(
            model_name='challenge',
            name='category',
            field=models.CharField(choices=[('web', 'Web'), ('crypto', 'Cryptography'), ('pwn', 'Binary Exploitation'), ('reverse', 'Reverse Engineering'), ('forensics', 'Forensics'), ('misc', 'Miscellaneous')], max_length=50),
        ),
        migrations.AlterField(
            model_name='team',
            name='password',
            field=models.CharField(default='pbkdf2_sha256$870000$qhhdHwtlEvBOn6GhYrtZsj$wKsX32/QPruykawp1z1KzLlZrz174ejjaVjAw7WUu48=', max_length=128),
        ),
    ]
