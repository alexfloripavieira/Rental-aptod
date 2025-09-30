#!/bin/bash

echo "=========================================="
echo "Teste de Upload de Vídeo"
echo "=========================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
log_info "Testando criação de Aptos com vídeo via shell..."

docker compose exec -T backend python manage.py shell << 'PYTHON_EOF'
import sys
from django.core.files.uploadedfile import SimpleUploadedFile
from aptos.models import Aptos, Builders

try:
    # Criar ou pegar uma construtora
    builder, created = Builders.objects.get_or_create(
        name="Construtora Teste Upload",
        defaults={
            'street': 'Rua Teste',
            'neighborhood': 'Bairro Teste',
            'city': 'São Paulo',
            'state': 'SP',
            'zip_code': '01000-000',
            'country': 'Brasil'
        }
    )
    print(f'✓ Construtora: {builder.name} (ID: {builder.id})')

    # Tentar criar um apartamento SEM vídeo primeiro
    apto_sem_video = Aptos.objects.create(
        unit_number='TEST-001',
        building_name=builder,
        description='Apartamento de teste sem vídeo',
        rental_price=1000.0,
        number_of_bedrooms=2,
        number_of_bathrooms=1,
        square_footage=80
    )
    print(f'✓ Apartamento criado SEM vídeo: {apto_sem_video.unit_number} (ID: {apto_sem_video.id})')

    # Agora testar COM um vídeo pequeno fake
    video_content = b'fake video content for testing'
    video_file = SimpleUploadedFile(
        "test_video.mp4",
        video_content,
        content_type="video/mp4"
    )

    apto_com_video = Aptos.objects.create(
        unit_number='TEST-002',
        building_name=builder,
        description='Apartamento de teste COM vídeo',
        rental_price=1500.0,
        number_of_bedrooms=3,
        number_of_bathrooms=2,
        square_footage=100,
        video=video_file
    )
    print(f'✓ Apartamento criado COM vídeo fake: {apto_com_video.unit_number} (ID: {apto_com_video.id})')
    print(f'✓ Vídeo salvo em: {apto_com_video.video.name}')

    # Limpar testes
    apto_sem_video.delete()
    apto_com_video.delete()
    if created:
        builder.delete()

    print('\n✅ Todos os testes passaram! O problema pode estar no admin interface.')
    print('\nPossíveis causas:')
    print('  1. Tamanho do arquivo ainda muito grande')
    print('  2. Timeout na requisição')
    print('  3. Problema com validação no admin')
    print('  4. Problema com inline forms')

except Exception as e:
    print(f'\n❌ ERRO ao criar apartamento:', file=sys.stderr)
    print(f'Tipo: {type(e).__name__}', file=sys.stderr)
    print(f'Mensagem: {str(e)}', file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_EOF

echo ""
log_info "=========================================="
log_info "Agora vamos verificar os logs EM TEMPO REAL"
log_info "=========================================="
echo ""
log_warn "Por favor, tente fazer o upload novamente no admin..."
log_warn "Pressione Ctrl+C após ver o erro para parar os logs"
echo ""

sleep 2
docker compose logs backend -f --tail=0