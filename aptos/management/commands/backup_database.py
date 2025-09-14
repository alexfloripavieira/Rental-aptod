"""
Management command para backup do banco de dados PostgreSQL
"""
import os
import subprocess
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone


class Command(BaseCommand):
    help = 'Cria backup do banco de dados PostgreSQL'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='/app/backups',
            help='Diretório para salvar o backup'
        )
        parser.add_argument(
            '--format',
            type=str,
            default='custom',
            choices=['custom', 'tar', 'plain'],
            help='Formato do backup (custom, tar, plain)'
        )
        parser.add_argument(
            '--compress',
            type=int,
            default=6,
            help='Nível de compressão (0-9)'
        )

    def handle(self, *args, **options):
        """Executa o backup do banco PostgreSQL"""
        output_dir = options['output_dir']
        format_type = options['format']
        compress_level = options['compress']

        # Garante que o diretório existe
        os.makedirs(output_dir, exist_ok=True)

        # Obtém configurações do banco
        db_config = settings.DATABASES['default']

        if db_config['ENGINE'] != 'django.db.backends.postgresql':
            self.stdout.write(
                self.style.ERROR('Este comando só funciona com PostgreSQL')
            )
            return

        # Gera nome do arquivo com timestamp
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        extension = 'dump' if format_type == 'custom' else format_type
        backup_file = os.path.join(
            output_dir,
            f"aptos_backup_{timestamp}.{extension}"
        )

        # Monta comando pg_dump
        env = os.environ.copy()
        env['PGPASSWORD'] = db_config['PASSWORD']

        pg_dump_cmd = [
            'pg_dump',
            '-h', db_config['HOST'],
            '-p', str(db_config['PORT']),
            '-U', db_config['USER'],
            '-d', db_config['NAME'],
            '-f', backup_file,
            f'-F{format_type[0]}',  # c for custom, t for tar, p for plain
            f'-Z{compress_level}',
            '--verbose',
            '--no-owner',
            '--no-privileges',
        ]

        try:
            self.stdout.write(f'Iniciando backup para: {backup_file}')

            # Executa pg_dump
            result = subprocess.run(
                pg_dump_cmd,
                env=env,
                capture_output=True,
                text=True,
                check=True
            )

            # Verifica tamanho do arquivo
            file_size = os.path.getsize(backup_file)
            file_size_mb = file_size / (1024 * 1024)

            self.stdout.write(
                self.style.SUCCESS(
                    f'Backup criado com sucesso!\n'
                    f'Arquivo: {backup_file}\n'
                    f'Tamanho: {file_size_mb:.2f} MB'
                )
            )

            # Remove backups antigos (mantém últimos 7)
            self.cleanup_old_backups(output_dir)

        except subprocess.CalledProcessError as e:
            self.stdout.write(
                self.style.ERROR(f'Erro ao criar backup: {e.stderr}')
            )
            # Remove arquivo parcial se existir
            if os.path.exists(backup_file):
                os.remove(backup_file)
            raise
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erro inesperado: {str(e)}')
            )
            raise

    def cleanup_old_backups(self, backup_dir, keep_count=7):
        """Remove backups antigos, mantendo apenas os mais recentes"""
        try:
            # Lista todos os backups
            backups = [
                f for f in os.listdir(backup_dir)
                if f.startswith('aptos_backup_') and (
                    f.endswith('.dump') or
                    f.endswith('.tar') or
                    f.endswith('.plain')
                )
            ]

            # Ordena por data de modificação
            backups.sort(
                key=lambda x: os.path.getmtime(os.path.join(backup_dir, x)),
                reverse=True
            )

            # Remove os mais antigos
            for old_backup in backups[keep_count:]:
                old_file = os.path.join(backup_dir, old_backup)
                os.remove(old_file)
                self.stdout.write(
                    self.style.WARNING(f'Backup antigo removido: {old_backup}')
                )
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'Erro ao limpar backups antigos: {str(e)}')
            )