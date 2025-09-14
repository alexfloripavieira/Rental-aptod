"""
Comando para migração real dos dados do SQLite para PostgreSQL
"""
from django.core.management.base import BaseCommand
from django.db import transaction, connections
from django.conf import settings
import sqlite3
import psycopg2
from psycopg2.extras import DictCursor
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Migra dados reais do SQLite para PostgreSQL'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Apenas simula a migração'
        )
    
    def handle(self, *args, **options):
        self.stdout.write("=== MIGRAÇÃO REAL DE DADOS ===")
        
        # Conectar aos bancos
        sqlite_path = '/home/alexvieira/Aptos/db.sqlite3'
        
        try:
            # Conexão SQLite
            sqlite_conn = sqlite3.connect(sqlite_path)
            sqlite_conn.row_factory = sqlite3.Row
            sqlite_cursor = sqlite_conn.cursor()
            
            # Conexão PostgreSQL
            pg_conn = psycopg2.connect(
                host='localhost',
                port=5432,
                database='aptos_db',
                user='rentali',
                password='rentali123'
            )
            pg_cursor = pg_conn.cursor(cursor_factory=DictCursor)
            
            self.stdout.write("✓ Conexões estabelecidas")
            
            if options['dry_run']:
                self.stdout.write(self.style.WARNING("MODO DRY-RUN"))
                self.dry_run_migration(sqlite_cursor, pg_cursor)
            else:
                self.execute_real_migration(sqlite_cursor, pg_cursor, pg_conn)
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro: {e}"))
        finally:
            if 'sqlite_conn' in locals():
                sqlite_conn.close()
            if 'pg_conn' in locals():
                pg_conn.close()
    
    def dry_run_migration(self, sqlite_cursor, pg_cursor):
        """Executa simulação da migração"""
        # Contar registros SQLite
        tables = ['aptos_builders', 'aptos_aptos', 'aptos_foto', 'aptos_builderfoto']
        
        self.stdout.write("Registros no SQLite:")
        for table in tables:
            sqlite_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = sqlite_cursor.fetchone()[0]
            self.stdout.write(f"  {table}: {count}")
            
        self.stdout.write("Registros no PostgreSQL:")
        for table in tables:
            pg_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = pg_cursor.fetchone()[0]
            self.stdout.write(f"  {table}: {count}")
    
    def execute_real_migration(self, sqlite_cursor, pg_cursor, pg_conn):
        """Executa migração real"""
        try:
            with pg_conn:
                # 1. Migrar Builders
                self.migrate_builders(sqlite_cursor, pg_cursor)
                
                # 2. Migrar Aptos
                self.migrate_aptos(sqlite_cursor, pg_cursor)
                
                # 3. Migrar Fotos
                self.migrate_fotos(sqlite_cursor, pg_cursor)
                
                # 4. Migrar Builder Fotos
                self.migrate_builder_fotos(sqlite_cursor, pg_cursor)
                
                # 5. Validar migração
                self.validate_migration(sqlite_cursor, pg_cursor)
                
                self.stdout.write(self.style.SUCCESS("=== MIGRAÇÃO CONCLUÍDA ==="))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro na migração: {e}"))
            pg_conn.rollback()
            raise
    
    def migrate_builders(self, sqlite_cursor, pg_cursor):
        """Migra construtoras"""
        self.stdout.write("Migrando construtoras...")
        
        sqlite_cursor.execute("SELECT * FROM aptos_builders")
        builders = sqlite_cursor.fetchall()
        
        for builder in builders:
            pg_cursor.execute("""
                INSERT INTO aptos_builders 
                (id, name, street, neighborhood, city, state, zip_code, country, created_at, updated_at, video)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                builder['id'], builder['name'], builder['street'],
                builder['neighborhood'], builder['city'], builder['state'],
                builder['zip_code'], builder['country'], builder['created_at'],
                builder['updated_at'], builder['video']
            ))
        
        self.stdout.write(f"✓ {len(builders)} construtoras migradas")
    
    def migrate_aptos(self, sqlite_cursor, pg_cursor):
        """Migra apartamentos"""
        self.stdout.write("Migrando apartamentos...")
        
        sqlite_cursor.execute("SELECT * FROM aptos_aptos")
        aptos = sqlite_cursor.fetchall()
        
        for apto in aptos:
            pg_cursor.execute("""
                INSERT INTO aptos_aptos 
                (id, unit_number, floor, description, rental_price, is_available, 
                is_furnished, is_pets_allowed, has_laundry, has_parking, has_internet,
                has_air_conditioning, number_of_bedrooms, number_of_bathrooms, 
                square_footage, created_at, updated_at, building_name_id, video)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                apto['id'], apto['unit_number'], apto['floor'], apto['description'],
                apto['rental_price'], bool(apto['is_available']), bool(apto['is_furnished']),
                bool(apto['is_pets_allowed']), bool(apto['has_laundry']), bool(apto['has_parking']),
                bool(apto['has_internet']), bool(apto['has_air_conditioning']), apto['number_of_bedrooms'],
                apto['number_of_bathrooms'], apto['square_footage'], apto['created_at'],
                apto['updated_at'], apto['building_name_id'], apto['video']
            ))
        
        self.stdout.write(f"✓ {len(aptos)} apartamentos migrados")
    
    def migrate_fotos(self, sqlite_cursor, pg_cursor):
        """Migra fotos dos apartamentos"""
        self.stdout.write("Migrando fotos de apartamentos...")
        
        sqlite_cursor.execute("SELECT * FROM aptos_foto")
        fotos = sqlite_cursor.fetchall()
        
        for foto in fotos:
            pg_cursor.execute("""
                INSERT INTO aptos_foto (id, photos, apto_id, description)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (foto['id'], foto['photos'], foto['apto_id'], foto['description']))
        
        self.stdout.write(f"✓ {len(fotos)} fotos de apartamentos migradas")
    
    def migrate_builder_fotos(self, sqlite_cursor, pg_cursor):
        """Migra fotos das construtoras"""
        self.stdout.write("Migrando fotos de construtoras...")
        
        sqlite_cursor.execute("SELECT * FROM aptos_builderfoto")
        fotos = sqlite_cursor.fetchall()
        
        for foto in fotos:
            pg_cursor.execute("""
                INSERT INTO aptos_builderfoto (id, description, photos, builder_id)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (foto['id'], foto['description'], foto['photos'], foto['builder_id']))
        
        self.stdout.write(f"✓ {len(fotos)} fotos de construtoras migradas")
    
    def validate_migration(self, sqlite_cursor, pg_cursor):
        """Valida se migração foi bem-sucedida"""
        self.stdout.write("=== VALIDAÇÃO PÓS-MIGRAÇÃO ===")
        
        tables = {
            'aptos_builders': 'Construtoras',
            'aptos_aptos': 'Apartamentos', 
            'aptos_foto': 'Fotos Apartamentos',
            'aptos_builderfoto': 'Fotos Construtoras'
        }
        
        validation_passed = True
        
        for table, label in tables.items():
            # Contar SQLite
            sqlite_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            sqlite_count = sqlite_cursor.fetchone()[0]
            
            # Contar PostgreSQL
            pg_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            pg_count = pg_cursor.fetchone()[0]
            
            if sqlite_count == pg_count:
                self.stdout.write(
                    self.style.SUCCESS(f"✓ {label}: {pg_count} registros")
                )
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ {label}: SQLite={sqlite_count}, PostgreSQL={pg_count}"
                    )
                )
                validation_passed = False
        
        if validation_passed:
            self.stdout.write(self.style.SUCCESS("✓ Migração validada com sucesso"))
        else:
            self.stdout.write(self.style.ERROR("✗ Falha na validação da migração"))
            
        return validation_passed