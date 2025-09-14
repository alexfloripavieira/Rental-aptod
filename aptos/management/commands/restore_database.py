"""
Management command para restaurar backup do banco de dados PostgreSQL
"""
import os
import subprocess
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Restaura backup do banco de dados PostgreSQL'

    def add_arguments(self, parser):
        parser.add_argument(
            'backup_file',
            type=str,
            help='Caminho para o arquivo de backup'
        )
        parser.add_argument(
            '--no-confirm',
            action='store_true',
            help='Pula confirmação antes de restaurar'
        )
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Limpa o banco antes de restaurar'
        )

    def handle(self, *args, **options):
        """Executa a restauração do banco PostgreSQL"""
        backup_file = options['backup_file']
        no_confirm = options['no_confirm']
        clean = options['clean']

        # Verifica se o arquivo existe
        if not os.path.exists(backup_file):
            raise CommandError(f'Arquivo de backup não encontrado: {backup_file}')

        # Obtém configurações do banco
        db_config = settings.DATABASES['default']

        if db_config['ENGINE'] != 'django.db.backends.postgresql':
            raise CommandError('Este comando só funciona com PostgreSQL')

        # Solicita confirmação
        if not no_confirm:
            self.stdout.write(
                self.style.WARNING(
                    f'\nATENÇÃO: Esta operação irá sobrescrever o banco de dados atual!\n'
                    f'Banco: {db_config["NAME"]}\n'
                    f'Host: {db_config["HOST"]}\n'
                    f'Arquivo: {backup_file}\n'
                )
            )
            confirm = input('Digite "yes" para continuar: ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR('Operação cancelada'))
                return

        # Detecta formato do backup
        file_extension = os.path.splitext(backup_file)[1]

        # Configura variáveis de ambiente
        env = os.environ.copy()
        env['PGPASSWORD'] = db_config['PASSWORD']

        try:
            # Se clean, limpa o banco primeiro
            if clean:
                self.stdout.write('Limpando banco de dados...')
                self.drop_all_tables(db_config, env)

            # Determina comando baseado no formato
            if file_extension in ['.dump', '.tar']:
                # Usa pg_restore para formatos custom e tar
                restore_cmd = [
                    'pg_restore',
                    '-h', db_config['HOST'],
                    '-p', str(db_config['PORT']),
                    '-U', db_config['USER'],
                    '-d', db_config['NAME'],
                    '--verbose',
                    '--no-owner',
                    '--no-privileges',
                ]

                if clean:
                    restore_cmd.append('--clean')
                    restore_cmd.append('--if-exists')

                restore_cmd.append(backup_file)
            else:
                # Usa psql para formato plain SQL
                restore_cmd = [
                    'psql',
                    '-h', db_config['HOST'],
                    '-p', str(db_config['PORT']),
                    '-U', db_config['USER'],
                    '-d', db_config['NAME'],
                    '-f', backup_file
                ]

            self.stdout.write(f'Restaurando backup de: {backup_file}')

            # Executa restauração
            result = subprocess.run(
                restore_cmd,
                env=env,
                capture_output=True,
                text=True,
                check=False  # Não falha em warnings
            )

            # Verifica resultado
            if result.returncode != 0:
                # pg_restore pode retornar warnings como erros
                if 'ERROR' in result.stderr:
                    self.stdout.write(
                        self.style.ERROR(f'Erros durante restauração:\n{result.stderr}')
                    )
                    raise CommandError('Restauração falhou com erros')
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Avisos durante restauração:\n{result.stderr}')
                    )

            # Executa migrações para garantir esquema atualizado
            self.stdout.write('Aplicando migrações...')
            call_command('migrate', '--no-input')

            # Coleta estatísticas para otimizar performance
            self.analyze_database(db_config, env)

            self.stdout.write(
                self.style.SUCCESS(
                    f'\nBackup restaurado com sucesso!\n'
                    f'Banco: {db_config["NAME"]}\n'
                    f'Arquivo: {backup_file}'
                )
            )

        except subprocess.CalledProcessError as e:
            self.stdout.write(
                self.style.ERROR(f'Erro ao restaurar backup: {e.stderr}')
            )
            raise
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erro inesperado: {str(e)}')
            )
            raise

    def drop_all_tables(self, db_config, env):
        """Remove todas as tabelas do banco"""
        drop_sql = """
        DO $$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;
        """

        psql_cmd = [
            'psql',
            '-h', db_config['HOST'],
            '-p', str(db_config['PORT']),
            '-U', db_config['USER'],
            '-d', db_config['NAME'],
            '-c', drop_sql
        ]

        subprocess.run(psql_cmd, env=env, check=True, capture_output=True)

    def analyze_database(self, db_config, env):
        """Executa ANALYZE para atualizar estatísticas do PostgreSQL"""
        analyze_cmd = [
            'psql',
            '-h', db_config['HOST'],
            '-p', str(db_config['PORT']),
            '-U', db_config['USER'],
            '-d', db_config['NAME'],
            '-c', 'ANALYZE;'
        ]

        try:
            subprocess.run(analyze_cmd, env=env, check=True, capture_output=True)
            self.stdout.write('Estatísticas do banco atualizadas')
        except Exception:
            pass  # Não é crítico se falhar