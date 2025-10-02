"""
Migration para adicionar índices de performance ao banco de dados.

Esta migration cria índices otimizados para melhorar performance de queries
comuns no sistema de gestão de inquilinos.
"""
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('aptos', '0017_metricaocupacao_relatoriotemplate_relatorioexecucao'),
    ]

    operations = [
        # ====== Índices para modelo Inquilino ======

        # Índice para status (usado em filtros frequentes)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_inquilino_status ON aptos_inquilino(status);",
            reverse_sql="DROP INDEX IF EXISTS idx_inquilino_status;"
        ),

        # Índice para email (usado em buscas e validações)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_inquilino_email ON aptos_inquilino(email);",
            reverse_sql="DROP INDEX IF EXISTS idx_inquilino_email;"
        ),

        # Índice para CPF (apenas onde não é NULL)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_inquilino_cpf ON aptos_inquilino(cpf) WHERE cpf IS NOT NULL;",
            reverse_sql="DROP INDEX IF EXISTS idx_inquilino_cpf;"
        ),

        # Índice para CNPJ (apenas onde não é NULL)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_inquilino_cnpj ON aptos_inquilino(cnpj) WHERE cnpj IS NOT NULL;",
            reverse_sql="DROP INDEX IF EXISTS idx_inquilino_cnpj;"
        ),

        # Índice para tipo (PF/PJ)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_inquilino_tipo ON aptos_inquilino(tipo);",
            reverse_sql="DROP INDEX IF EXISTS idx_inquilino_tipo;"
        ),

        # Índice composto para filtros comuns (tipo + status)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_inquilino_tipo_status ON aptos_inquilino(tipo, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_inquilino_tipo_status;"
        ),

        # Índice para datas de criação (ordenação e filtros)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_inquilino_created_at ON aptos_inquilino(created_at DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_inquilino_created_at;"
        ),

        # ====== Índices para modelo InquilinoApartamento ======

        # Índice composto para associações ativas
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_assoc_ativo_datas ON aptos_inquilinoapartamento(ativo, data_inicio, data_fim);",
            reverse_sql="DROP INDEX IF EXISTS idx_assoc_ativo_datas;"
        ),

        # Índice para apartamento + ativo (verificações de disponibilidade)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_assoc_apartamento_ativo ON aptos_inquilinoapartamento(apartamento_id, ativo);",
            reverse_sql="DROP INDEX IF EXISTS idx_assoc_apartamento_ativo;"
        ),

        # Índice para inquilino + ativo (histórico de inquilino)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_assoc_inquilino_ativo ON aptos_inquilinoapartamento(inquilino_id, ativo);",
            reverse_sql="DROP INDEX IF EXISTS idx_assoc_inquilino_ativo;"
        ),

        # Índice para data_inicio (ordenação e queries por período)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_assoc_data_inicio ON aptos_inquilinoapartamento(data_inicio DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_assoc_data_inicio;"
        ),

        # ====== Índices para Full-Text Search ======

        # Índice de busca full-text para inquilinos (PostgreSQL)
        # Combina nome_completo, razao_social e email para buscas rápidas
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS idx_inquilino_search
                ON aptos_inquilino
                USING gin(
                    to_tsvector('portuguese',
                        coalesce(nome_completo, '') || ' ' ||
                        coalesce(razao_social, '') || ' ' ||
                        coalesce(email, '')
                    )
                );
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_inquilino_search;"
        ),

        # ====== Índices para modelo HistoricoStatus ======

        # Índice composto para histórico de inquilino
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_historico_inquilino_timestamp ON aptos_historicostatus(inquilino_id, timestamp DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_historico_inquilino_timestamp;"
        ),

        # Índice para status_novo (filtros e analytics)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_historico_status_novo ON aptos_historicostatus(status_novo, timestamp DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_historico_status_novo;"
        ),

        # ====== Índices para modelo DocumentoInquilino ======

        # Índice composto para documentos ativos
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_documento_inquilino_ativo ON aptos_documentoinquilino(inquilino_id, ativo, tipo_documento);",
            reverse_sql="DROP INDEX IF EXISTS idx_documento_inquilino_ativo;"
        ),

        # ====== Índices para modelo Aptos (otimizações adicionais) ======

        # Índice para disponibilidade (queries de apartamentos disponíveis)
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_aptos_available ON aptos_aptos(is_available) WHERE is_available = true;",
            reverse_sql="DROP INDEX IF EXISTS idx_aptos_available;"
        ),

        # Índice composto para filtros comuns de busca
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_aptos_building_available ON aptos_aptos(building_name_id, is_available);",
            reverse_sql="DROP INDEX IF EXISTS idx_aptos_building_available;"
        ),
    ]
