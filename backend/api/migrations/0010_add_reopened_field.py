from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_chainofcustody_consent_evidencephoto_observer'),
    ]

    operations = [
        migrations.AddField(
            model_name='autopsycase',
            name='reopened',
            field=models.BooleanField(default=False),
        ),
    ]
