# Generated by Django 5.1.4 on 2025-03-22 00:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('atlas_backend', '0013_team_access_code_team_team_owner_alter_team_password_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='team',
            name='description',
        ),
        migrations.AlterField(
            model_name='team',
            name='password',
            field=models.CharField(default='pbkdf2_sha256$870000$hgnOQkui0hcP38HkUF5jp3$1DNpCqEN+VCLhwGMDewGb4opXD1Go84ZlWr5gfALpyM=', max_length=128),
        ),
    ]
