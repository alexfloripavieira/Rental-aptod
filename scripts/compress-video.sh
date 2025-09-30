#!/bin/bash

# Script para comprimir vídeos para upload
# Limite: 100MB (nginx) e 50MB (Django recomendado para uploads)

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ -z "$1" ]; then
    log_error "Uso: $0 <arquivo_video> [tamanho_max_mb] [arquivo_saida]"
    echo ""
    echo "Exemplos:"
    echo "  $0 video.mov                    # Comprime para ~50MB"
    echo "  $0 video.mov 80                 # Comprime para ~80MB"
    echo "  $0 video.mov 50 video_compressed.mp4  # Define nome de saída"
    exit 1
fi

INPUT_FILE="$1"
TARGET_SIZE_MB="${2:-50}"  # Padrão: 50MB
OUTPUT_FILE="${3}"

# Verificar se ffmpeg está instalado
if ! command -v ffmpeg &> /dev/null; then
    log_error "ffmpeg não está instalado!"
    echo ""
    echo "Instale com:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS:         brew install ffmpeg"
    exit 1
fi

# Verificar se arquivo existe
if [ ! -f "$INPUT_FILE" ]; then
    log_error "Arquivo não encontrado: $INPUT_FILE"
    exit 1
fi

# Obter informações do arquivo
FILE_SIZE=$(stat -f%z "$INPUT_FILE" 2>/dev/null || stat -c%s "$INPUT_FILE")
FILE_SIZE_MB=$((FILE_SIZE / 1024 / 1024))
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT_FILE")

log_info "=========================================="
log_info "Compressão de Vídeo"
log_info "=========================================="
echo ""
log_info "Arquivo de entrada: $INPUT_FILE"
log_info "Tamanho atual: ${FILE_SIZE_MB}MB"
log_info "Duração: ${DURATION}s"
log_info "Tamanho alvo: ${TARGET_SIZE_MB}MB"
echo ""

# Definir nome de saída se não fornecido
if [ -z "$OUTPUT_FILE" ]; then
    FILENAME=$(basename "$INPUT_FILE")
    FILENAME_NO_EXT="${FILENAME%.*}"
    OUTPUT_FILE="${FILENAME_NO_EXT}_compressed.mp4"
fi

# Calcular bitrate alvo
# Fórmula: bitrate = (tamanho_alvo_MB * 8192) / duração_segundos * 0.95
# 0.95 é um fator de segurança para áudio
DURATION_INT=$(echo "$DURATION" | cut -d. -f1)
TARGET_BITRATE=$(echo "scale=0; ($TARGET_SIZE_MB * 8192 / $DURATION_INT) * 0.95 / 1" | bc)

log_info "Bitrate calculado: ${TARGET_BITRATE}k"
echo ""

# Mostrar opções de qualidade
log_info "Comprimindo com as seguintes configurações:"
log_info "  - Codec vídeo: H.264 (x264)"
log_info "  - Codec áudio: AAC"
log_info "  - Resolução: mantida (ou reduzida se necessário)"
log_info "  - Taxa de quadros: 30fps"
echo ""

# Comprimir vídeo
log_info "Iniciando compressão..."
echo ""

ffmpeg -i "$INPUT_FILE" \
    -c:v libx264 \
    -preset medium \
    -b:v "${TARGET_BITRATE}k" \
    -maxrate "${TARGET_BITRATE}k" \
    -bufsize $((TARGET_BITRATE * 2))k \
    -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
    -r 30 \
    -c:a aac \
    -b:a 128k \
    -ac 2 \
    -movflags +faststart \
    -y \
    "$OUTPUT_FILE" 2>&1 | grep -E "(time=|size=|bitrate=)" || ffmpeg -i "$INPUT_FILE" \
    -c:v libx264 \
    -preset medium \
    -b:v "${TARGET_BITRATE}k" \
    -maxrate "${TARGET_BITRATE}k" \
    -bufsize $((TARGET_BITRATE * 2))k \
    -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
    -r 30 \
    -c:a aac \
    -b:a 128k \
    -ac 2 \
    -movflags +faststart \
    -y \
    "$OUTPUT_FILE"

echo ""

# Verificar resultado
if [ -f "$OUTPUT_FILE" ]; then
    OUTPUT_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE")
    OUTPUT_SIZE_MB=$((OUTPUT_SIZE / 1024 / 1024))

    log_info "=========================================="
    log_info "Compressão concluída!"
    log_info "=========================================="
    echo ""
    log_info "Arquivo de saída: $OUTPUT_FILE"
    log_info "Tamanho original: ${FILE_SIZE_MB}MB"
    log_info "Tamanho comprimido: ${OUTPUT_SIZE_MB}MB"
    log_info "Redução: $((100 - (OUTPUT_SIZE * 100 / FILE_SIZE)))%"
    echo ""

    if [ "$OUTPUT_SIZE_MB" -gt "$TARGET_SIZE_MB" ]; then
        log_warn "⚠️  Arquivo ainda está acima do alvo (${OUTPUT_SIZE_MB}MB > ${TARGET_SIZE_MB}MB)"
        log_warn "Tente com um tamanho menor: $0 '$INPUT_FILE' $((TARGET_SIZE_MB - 10))"
    elif [ "$OUTPUT_SIZE_MB" -gt 100 ]; then
        log_error "❌ Arquivo excede limite do Nginx (100MB)"
    else
        log_info "✅ Arquivo pronto para upload!"
    fi
else
    log_error "Erro ao comprimir vídeo!"
    exit 1
fi