# Generated by Django 5.1.4 on 2025-02-25 16:25

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('atlas_backend', '0002_remove_challenge_flag_answer_remove_team_challenge_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='container',
            old_name='ssh_key',
            new_name='ssh_password',
        ),
        migrations.AlterUniqueTogether(
            name='submission',
            unique_together=set(),
        ),
        migrations.RemoveField(
            model_name='container',
            name='id',
        ),
        migrations.RemoveField(
            model_name='container',
            name='status',
        ),
        migrations.AddField(
            model_name='challenge',
            name='file_links',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='challenge',
            name='hints',
            field=models.JSONField(blank=True, default=list, help_text='\n        List of hint objects with format:\n        [\n            {\n                "content": "Hint text",\n                "cost": "Percentage of max points (0-100)"\n            }\n        ]\n    '),
        ),
        migrations.AddField(
            model_name='challenge',
            name='is_hidden',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='challenge',
            name='port',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='challenge',
            name='ssh_user',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='submission',
            name='user',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='team',
            name='is_banned',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='team',
            name='is_hidden',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='team',
            name='max_attempts_per_challenge',
            field=models.IntegerField(default=10),
        ),
        migrations.AddField(
            model_name='team',
            name='password',
            field=models.CharField(default='pbkdf2_sha256$870000$eBzqj6LC3rbFkggSSB8Szq$1wRGUyav7hFOlmIpeOb4Xb5LsPoeqNhuxpmdzk2C+rg=', max_length=128),
        ),
        migrations.AddField(
            model_name='team',
            name='team_email',
            field=models.EmailField(default='team@example.com', max_length=254, unique=True),
        ),
        migrations.AddField(
            model_name='team',
            name='team_score',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='challenge',
            name='category',
            field=models.CharField(choices=[('web', 'Web'), ('crypto', 'Cryptography'), ('pwn', 'Binary Exp>loitation'), ('reverse', 'Reverse Engineering'), ('forensics', 'Forensics'), ('misc', 'Miscellaneous')], max_length=50),
        ),
        migrations.AlterField(
            model_name='challenge',
            name='max_team_size',
            field=models.IntegerField(default=3),
        ),
        migrations.AlterField(
            model_name='container',
            name='challenge',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='containers', to='atlas_backend.challenge'),
        ),
        migrations.AlterField(
            model_name='container',
            name='container_id',
            field=models.CharField(max_length=100, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='container',
            name='team',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='containers', to='atlas_backend.team'),
        ),
        migrations.AlterField(
            model_name='submission',
            name='challenge',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='atlas_backend.challenge'),
        ),
        migrations.AlterField(
            model_name='submission',
            name='team',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='atlas_backend.team'),
        ),
        migrations.AlterField(
            model_name='user',
            name='team',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='members', to='atlas_backend.team'),
        ),
        migrations.AlterUniqueTogether(
            name='submission',
            unique_together={('team', 'challenge', 'attempt_number')},
        ),
        migrations.CreateModel(
            name='HintPurchase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('hint_index', models.IntegerField()),
                ('hint_cost_percentage', models.IntegerField()),
                ('points_deducted', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('challenge', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='atlas_backend.challenge')),
                ('team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='atlas_backend.team')),
            ],
            options={
                'unique_together': {('team', 'challenge', 'hint_index')},
            },
        ),
    ]
