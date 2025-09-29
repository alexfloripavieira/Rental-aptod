from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('aptos', '0014_alter_inquilinoapartamento_options_and_more'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='inquilinoapartamento',
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name='inquilinoapartamento',
            constraint=models.UniqueConstraint(
                fields=('apartamento',),
                name='unique_apartamento_associacao_ativa',
                condition=models.Q(('ativo', True)),
            ),
        ),
    ]
