"""
Management command para backup dos arquivos de mídia
"""
import os
import shutil
import tarfile
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone


class Command(BaseCommand):
    help = 'Cria backup dos arquivos de mídia'

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
            default='tar.gz',
            choices=['tar.gz', 'zip', 'tar'],
            help='Formato do arquivo de backup'
        )

    def handle(self, *args, **options):
        """Executa o backup dos arquivos de mídia"""
        output_dir = options['output_dir']
        format_type = options['format']

        # Garante que o diretório existe
        os.makedirs(output_dir, exist_ok=True)

        # Verifica se MEDIA_ROOT existe
        if not hasattr(settings, 'MEDIA_ROOT') or not settings.MEDIA_ROOT:
            self.stdout.write(
                self.style.ERROR('MEDIA_ROOT não configurado')
            )
            return

        media_root = settings.MEDIA_ROOT
        if not os.path.exists(media_root):
            self.stdout.write(
                self.style.WARNING(f'Diretório de mídia não existe: {media_root}')
            )
            return

        # Gera nome do arquivo com timestamp
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"media_backup_{timestamp}"

        if format_type == 'tar.gz':
            backup_file = os.path.join(output_dir, f"{backup_filename}.tar.gz")
            self.create_tar_backup(media_root, backup_file, compressed=True)
        elif format_type == 'tar':
            backup_file = os.path.join(output_dir, f"{backup_filename}.tar")
            self.create_tar_backup(media_root, backup_file, compressed=False)
        elif format_type == 'zip':
            backup_file = os.path.join(output_dir, f"{backup_filename}.zip")
            self.create_zip_backup(media_root, backup_file)

        # Verifica tamanho do arquivo
        file_size = os.path.getsize(backup_file)
        file_size_mb = file_size / (1024 * 1024)

        self.stdout.write(
            self.style.SUCCESS(
                f'Backup de mídia criado com sucesso!\n'
                f'Arquivo: {backup_file}\n'
                f'Tamanho: {file_size_mb:.2f} MB'
            )
        )

        # Remove backups antigos (mantém últimos 5)
        self.cleanup_old_media_backups(output_dir)

    def create_tar_backup(self, source_dir, backup_file, compressed=True):
        """Cria backup em formato TAR"""
        mode = 'w:gz' if compressed else 'w'

        with tarfile.open(backup_file, mode) as tar:
            # Adiciona informações sobre o diretório de mídia
            self.stdout.write(f'Criando backup TAR de: {source_dir}')

            # Conta arquivos para progresso
            total_files = sum(len(files) for _, _, files in os.walk(source_dir))
            processed = 0

            for root, dirs, files in os.walk(source_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    # Nome relativo no arquivo TAR
                    arcname = os.path.relpath(file_path, source_dir)

                    tar.add(file_path, arcname=arcname)
                    processed += 1

                    if processed % 10 == 0 or processed == total_files:
                        progress = (processed / total_files) * 100
                        self.stdout.write(
                            f'\rProgresso: {progress:.1f}% ({processed}/{total_files})',
                            ending=''
                        )

            self.stdout.write('')  # Nova linha

    def create_zip_backup(self, source_dir, backup_file):
        """Cria backup em formato ZIP"""
        import zipfile

        self.stdout.write(f'Criando backup ZIP de: {source_dir}')

        with zipfile.ZipFile(backup_file, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Conta arquivos para progresso
            total_files = sum(len(files) for _, _, files in os.walk(source_dir))
            processed = 0

            for root, dirs, files in os.walk(source_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    # Nome relativo no arquivo ZIP
                    arcname = os.path.relpath(file_path, source_dir)

                    zip_file.write(file_path, arcname)
                    processed += 1

                    if processed % 10 == 0 or processed == total_files:
                        progress = (processed / total_files) * 100
                        self.stdout.write(
                            f'\rProgresso: {progress:.1f}% ({processed}/{total_files})',
                            ending=''
                        )

            self.stdout.write('')  # Nova linha

    def cleanup_old_media_backups(self, backup_dir, keep_count=5):
        """Remove backups de mídia antigos"""
        try:
            # Lista todos os backups de mídia
            backups = [
                f for f in os.listdir(backup_dir)
                if f.startswith('media_backup_') and (
                    f.endswith('.tar.gz') or
                    f.endswith('.tar') or
                    f.endswith('.zip')
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
                    self.style.WARNING(f'Backup de mídia antigo removido: {old_backup}')
                )
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'Erro ao limpar backups de mídia: {str(e)}')
            )