import atlas_backend.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("atlas_backend", "0014_remove_team_description_alter_team_password"),
    ]

    operations = [
        migrations.AlterField(
            model_name="team",
            name="password",
            field=models.CharField(
                default=atlas_backend.models.default_team_password,
                max_length=128,
            ),
        ),
    ]
