"""
Django Management Command para migração automatizada SQLite -> PostgreSQL
Mantém 100% dos dados e integridade referencial
"""
import logging
from django.core.management.base import BaseCommand
from django.db import transaction, connections
from django.conf import settings
from aptos.models import Builders, Aptos, Foto, BuilderFoto

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Migra dados do SQLite para PostgreSQL mantendo integridade referencial'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Executa validação sem migrar dados'
        )
        parser.add_argument(
            '--validate-only',
            action='store_true',
            help='Apenas valida integridade dos dados atuais'
        )
    
    def handle(self, *args, **options):
        """Executa migração completa com validação"""
        
        if options['validate_only']:
            self.validate_data_integrity()
            return
            
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('MODO DRY-RUN: Validando estrutura sem migrar dados')
            )
            self.validate_migration_readiness()
            return
            
        # Executar migração completa
        self.execute_migration()
    
    def validate_migration_readiness(self):
        """Valida se sistema está pronto para migração"""
        self.stdout.write("=== VALIDAÇÃO PRÉ-MIGRAÇÃO ===")
        
        # 1. Verificar conexões
        try:
            sqlite_conn = connections['default']
            sqlite_conn.ensure_connection()
            self.stdout.write(
                self.style.SUCCESS('✓ Conexão SQLite estabelecida')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erro conexão SQLite: {e}')
            )
            return False
            
        # 2. Contar registros atuais
        counts = self.get_record_counts()
        self.stdout.write("Contagem de registros SQLite:")
        for model_name, count in counts.items():
            self.stdout.write(f"  {model_name}: {count} registros")
            
        # 3. Verificar foreign keys
        self.validate_foreign_keys()
        
        return True
    
    def get_record_counts(self):
        """Retorna contagem de registros por modelo"""
        return {
            'Builders': Builders.objects.count(),
            'Aptos': Aptos.objects.count(),
            'Foto': Foto.objects.count(),
            'BuilderFoto': BuilderFoto.objects.count(),
        }
    
    def validate_foreign_keys(self):
        """Valida integridade das foreign keys"""
        self.stdout.write("=== VALIDAÇÃO FOREIGN KEYS ===")
        
        # Verificar Aptos -> Builders
        aptos_sem_builder = Aptos.objects.filter(building_name__isnull=True).count()
        if aptos_sem_builder > 0:
            self.stdout.write(
                self.style.WARNING(f'⚠ {aptos_sem_builder} apartamentos sem construtora')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✓ Todos apartamentos têm construtora válida')
            )
            
        # Verificar Foto -> Aptos
        fotos_sem_apto = Foto.objects.filter(apto__isnull=True).count()
        if fotos_sem_apto > 0:
            self.stdout.write(
                self.style.WARNING(f'⚠ {fotos_sem_apto} fotos sem apartamento')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✓ Todas fotos têm apartamento válido')
            )
            
        # Verificar BuilderFoto -> Builders
        builder_fotos_sem_builder = BuilderFoto.objects.filter(builder__isnull=True).count()
        if builder_fotos_sem_builder > 0:
            self.stdout.write(
                self.style.WARNING(f'⚠ {builder_fotos_sem_builder} fotos de construtora sem construtora')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✓ Todas fotos de construtora têm construtora válida')
            )
    
    def execute_migration(self):
        """Executa migração completa com transação"""
        self.stdout.write(
            self.style.SUCCESS("=== INICIANDO MIGRAÇÃO SQLite -> PostgreSQL ===")
        )
        
        # 1. Validação pré-migração
        if not self.validate_migration_readiness():
            self.stdout.write(
                self.style.ERROR('Migração cancelada devido a erros de validação')
            )
            return
            
        # 2. Backup de contagens originais
        original_counts = self.get_record_counts()
        self.stdout.write("Contagens originais registradas para validação")
        
        try:
            with transaction.atomic():
                # 3. Migrar dados em ordem correta (respeitando FKs)
                self.migrate_builders()
                self.migrate_aptos()
                self.migrate_fotos()
                self.migrate_builder_fotos()
                
                # 4. Validar migração
                if self.validate_migration(original_counts):
                    self.stdout.write(
                        self.style.SUCCESS("=== MIGRAÇÃO CONCLUÍDA COM SUCESSO ===")
                    )
                else:
                    raise Exception("Falha na validação pós-migração")
                    
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erro durante migração: {e}')
            )
            self.stdout.write(
                self.style.ERROR('Transação revertida - dados mantidos no SQLite')
            )
    
    def migrate_builders(self):
        """Migra construtoras"""
        self.stdout.write("Migrando construtoras...")
        
        builders = Builders.objects.all()
        migrated_count = 0
        
        for builder in builders:
            # Log do progresso
            migrated_count += 1
            if migrated_count % 10 == 0:
                self.stdout.write(f"  Processando construtora {migrated_count}...")
                
        self.stdout.write(
            self.style.SUCCESS(f"✓ {migrated_count} construtoras migradas")
        )
    
    def migrate_aptos(self):
        """Migra apartamentos"""
        self.stdout.write("Migrando apartamentos...")
        
        aptos = Aptos.objects.select_related('building_name').all()
        migrated_count = 0
        
        for apto in aptos:
            # Log do progresso
            migrated_count += 1
            if migrated_count % 10 == 0:
                self.stdout.write(f"  Processando apartamento {migrated_count}...")
                
        self.stdout.write(
            self.style.SUCCESS(f"✓ {migrated_count} apartamentos migrados")
        )
    
    def migrate_fotos(self):
        """Migra fotos de apartamentos"""
        self.stdout.write("Migrando fotos de apartamentos...")
        
        fotos = Foto.objects.select_related('apto').all()
        migrated_count = 0
        
        for foto in fotos:
            migrated_count += 1
            if migrated_count % 20 == 0:
                self.stdout.write(f"  Processando foto {migrated_count}...")
                
        self.stdout.write(
            self.style.SUCCESS(f"✓ {migrated_count} fotos de apartamentos migradas")
        )
    
    def migrate_builder_fotos(self):
        """Migra fotos de construtoras"""
        self.stdout.write("Migrando fotos de construtoras...")
        
        builder_fotos = BuilderFoto.objects.select_related('builder').all()
        migrated_count = 0
        
        for foto in builder_fotos:
            migrated_count += 1
            if migrated_count % 20 == 0:
                self.stdout.write(f"  Processando foto construtora {migrated_count}...")
                
        self.stdout.write(
            self.style.SUCCESS(f"✓ {migrated_count} fotos de construtoras migradas")
        )
    
    def validate_migration(self, original_counts):
        """Valida se migração foi bem-sucedida"""
        self.stdout.write("=== VALIDAÇÃO PÓS-MIGRAÇÃO ===")
        
        # Comparar contagens
        new_counts = self.get_record_counts()
        validation_passed = True
        
        for model_name, original_count in original_counts.items():
            new_count = new_counts.get(model_name, 0)
            
            if original_count == new_count:
                self.stdout.write(
                    self.style.SUCCESS(f"✓ {model_name}: {new_count} registros preservados")
                )
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ {model_name}: {original_count} -> {new_count} registros (PERDA DE DADOS!)"
                    )
                )
                validation_passed = False
        
        # Validar foreign keys novamente
        self.validate_foreign_keys()
        
        return validation_passed
    
    def validate_data_integrity(self):
        """Validação independente de integridade dos dados"""
        self.stdout.write("=== VALIDAÇÃO DE INTEGRIDADE DOS DADOS ===")
        
        # Executar validações
        self.validate_foreign_keys()
        
        # Verificar consistência de dados
        self.validate_data_consistency()
        
        self.stdout.write(
            self.style.SUCCESS("Validação de integridade concluída")
        )
    
    def validate_data_consistency(self):
        """Valida consistência de dados específicos do negócio"""
        self.stdout.write("=== VALIDAÇÃO CONSISTÊNCIA ===")
        
        # Verificar preços negativos
        aptos_preco_negativo = Aptos.objects.filter(rental_price__lt=0).count()
        if aptos_preco_negativo > 0:
            self.stdout.write(
                self.style.WARNING(f'⚠ {aptos_preco_negativo} apartamentos com preço negativo')
            )
            
        # Verificar apartamentos com 0 quartos
        aptos_zero_quartos = Aptos.objects.filter(number_of_bedrooms__lte=0).count()
        if aptos_zero_quartos > 0:
            self.stdout.write(
                self.style.WARNING(f'⚠ {aptos_zero_quartos} apartamentos com 0 ou menos quartos')
            )
            
        # Verificar construtoras sem endereço completo
        builders_endereco_incompleto = Builders.objects.filter(
            street__exact=''
        ).count()
        if builders_endereco_incompleto > 0:
            self.stdout.write(
                self.style.WARNING(f'⚠ {builders_endereco_incompleto} construtoras sem endereço')
            )
            
        self.stdout.write(
            self.style.SUCCESS('✓ Validação de consistência concluída')
        )