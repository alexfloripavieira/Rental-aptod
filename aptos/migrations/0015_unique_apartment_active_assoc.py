from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('aptos', '0014_alter_inquilinoapartamento_options_and_more'),
    ]

    operations = [
        # Removido DROP CONSTRAINT por incompatibilidade com SQLite durante testes.
        # Em ambientes que já possuam a constraint antiga, o passo de limpeza deve ser
        # tratado no banco alvo (ex.: PostgreSQL). Mantemos a remoção do índice, que é
        # suportada pelo SQLite e não causa erro em bases limpas de teste.
        migrations.RunSQL(
            sql='DROP INDEX IF EXISTS unique_apartamento_associacao_ativa',
            reverse_sql='',
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
