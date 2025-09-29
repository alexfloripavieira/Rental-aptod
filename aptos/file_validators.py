"""
Validadores de arquivo para upload de documentos.

Este módulo implementa validações de segurança para upload de arquivos,
incluindo verificação de tipos, tamanhos e conteúdo malicioso.
"""

import os
import magic
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.conf import settings


# Configurações de upload
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
]
ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
]
ALLOWED_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp'
]


def validar_tamanho_arquivo(arquivo):
    """
    Valida o tamanho do arquivo.

    Args:
        arquivo: Arquivo Django UploadedFile

    Raises:
        ValidationError: Se arquivo exceder tamanho máximo
    """
    if arquivo.size > MAX_FILE_SIZE:
        size_mb = MAX_FILE_SIZE / 1024 / 1024
        raise ValidationError(
            _('Arquivo muito grande. Tamanho máximo permitido: {size_mb}MB')
            .format(size_mb=size_mb)
        )


def validar_extensao_arquivo(arquivo):
    """
    Valida a extensão do arquivo.

    Args:
        arquivo: Arquivo Django UploadedFile

    Raises:
        ValidationError: Se extensão não for permitida
    """
    nome_arquivo = arquivo.name.lower()
    extensao = os.path.splitext(nome_arquivo)[1]

    if extensao not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            _('Extensão de arquivo não permitida. Extensões válidas: {extensions}')
            .format(extensions=', '.join(ALLOWED_EXTENSIONS))
        )


def validar_tipo_mime(arquivo):
    """
    Valida o tipo MIME real do arquivo usando python-magic.

    Args:
        arquivo: Arquivo Django UploadedFile

    Raises:
        ValidationError: Se tipo MIME não for permitido
    """
    try:
        # Lê uma amostra do arquivo para verificar o tipo real
        arquivo.seek(0)
        sample = arquivo.read(1024)
        arquivo.seek(0)

        mime_type = magic.from_buffer(sample, mime=True)

        allowed_types = ALLOWED_IMAGE_TYPES + ALLOWED_DOCUMENT_TYPES

        if mime_type not in allowed_types:
            raise ValidationError(
                _('Tipo de arquivo não permitido: {mime_type}')
                .format(mime_type=mime_type)
            )

    except Exception as e:
        raise ValidationError(
            _('Erro ao validar tipo de arquivo: {error}')
            .format(error=str(e))
        )


def validar_nome_arquivo(arquivo):
    """
    Valida o nome do arquivo para evitar problemas de segurança.

    Args:
        arquivo: Arquivo Django UploadedFile

    Raises:
        ValidationError: Se nome for inseguro
    """
    nome = arquivo.name

    # Verificar caracteres perigosos
    caracteres_perigosos = ['..', '/', '\\', '<', '>', ':', '"', '|', '?', '*']
    for char in caracteres_perigosos:
        if char in nome:
            raise ValidationError(
                _('Nome de arquivo contém caracteres não permitidos')
            )

    # Verificar se nome não está vazio
    if not nome or nome.strip() == '':
        raise ValidationError(_('Nome de arquivo não pode estar vazio'))

    # Verificar tamanho do nome
    if len(nome) > 255:
        raise ValidationError(_('Nome de arquivo muito longo (máximo 255 caracteres)'))


def validar_conteudo_malicioso(arquivo):
    """
    Verificação básica de conteúdo malicioso.

    Args:
        arquivo: Arquivo Django UploadedFile

    Raises:
        ValidationError: Se conteúdo suspeito for detectado
    """
    try:
        arquivo.seek(0)
        content = arquivo.read(1024).decode('utf-8', errors='ignore').lower()
        arquivo.seek(0)

        # Padrões suspeitos
        padroes_suspeitos = [
            '<script',
            'javascript:',
            'vbscript:',
            'onload=',
            'onerror=',
            'eval(',
            'document.cookie'
        ]

        for padrao in padroes_suspeitos:
            if padrao in content:
                raise ValidationError(_('Arquivo contém conteúdo suspeito'))

    except UnicodeDecodeError:
        # Arquivo binário - ok para documentos e imagens
        pass
    except Exception as e:
        raise ValidationError(
            _('Erro ao validar conteúdo do arquivo: {error}')
            .format(error=str(e))
        )


def validar_arquivo_completo(arquivo):
    """
    Executa todas as validações de arquivo.

    Args:
        arquivo: Arquivo Django UploadedFile

    Raises:
        ValidationError: Se qualquer validação falhar
    """
    validar_nome_arquivo(arquivo)
    validar_tamanho_arquivo(arquivo)
    validar_extensao_arquivo(arquivo)
    validar_tipo_mime(arquivo)
    validar_conteudo_malicioso(arquivo)


def gerar_nome_arquivo_seguro(arquivo, inquilino_id, tipo_documento):
    """
    Gera nome de arquivo seguro com timestamp.

    Args:
        arquivo: Arquivo Django UploadedFile
        inquilino_id: ID do inquilino
        tipo_documento: Tipo do documento

    Returns:
        str: Nome de arquivo seguro
    """
    import uuid
    from datetime import datetime

    extensao = os.path.splitext(arquivo.name)[1].lower()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    uuid_str = str(uuid.uuid4())[:8]

    return f"inquilino_{inquilino_id}_{tipo_documento}_{timestamp}_{uuid_str}{extensao}"


def get_upload_path(instance, filename):
    """
    Gera caminho de upload organizado por inquilino.

    Args:
        instance: Instância do modelo DocumentoInquilino
        filename: Nome do arquivo

    Returns:
        str: Caminho do arquivo
    """
    nome_seguro = gerar_nome_arquivo_seguro(
        type('MockFile', (), {'name': filename})(),
        instance.inquilino.id,
        instance.tipo
    )

    return f"inquilinos/documentos/{instance.inquilino.id}/{nome_seguro}"

def documento_upload_path(instance, filename):
    """
    Gera path para upload de documentos conforme especificação da tarefa.
    
    Args:
        instance: Instância do modelo DocumentoInquilino
        filename: Nome original do arquivo
    
    Returns:
        str: Path para upload do documento
    """
    inquilino_id = instance.inquilino.id
    tipo_doc = instance.tipo_documento.lower()
    ext = filename.split('.')[-1]
    new_filename = f"{tipo_doc}_{instance.versao}.{ext}"
    return f"inquilinos/{inquilino_id}/documentos/{new_filename}"


class FileValidator:
    """
    Classe validadora de arquivos reutilizável.
    """

    def __init__(self, max_size=MAX_FILE_SIZE, allowed_types=None, allowed_extensions=None):
        self.max_size = max_size
        self.allowed_types = allowed_types or (ALLOWED_IMAGE_TYPES + ALLOWED_DOCUMENT_TYPES)
        self.allowed_extensions = allowed_extensions or ALLOWED_EXTENSIONS

    def __call__(self, arquivo):
        """
        Executa validação customizada.

        Args:
            arquivo: Arquivo Django UploadedFile

        Raises:
            ValidationError: Se validação falhar
        """
        self.validar_tamanho(arquivo)
        self.validar_extensao(arquivo)
        self.validar_tipo_mime(arquivo)
        validar_nome_arquivo(arquivo)
        validar_conteudo_malicioso(arquivo)

    def validar_tamanho(self, arquivo):
        if arquivo.size > self.max_size:
            size_mb = self.max_size / 1024 / 1024
            raise ValidationError(
                _('Arquivo muito grande. Tamanho máximo: {size_mb}MB')
                .format(size_mb=size_mb)
            )

    def validar_extensao(self, arquivo):
        nome_arquivo = arquivo.name.lower()
        extensao = os.path.splitext(nome_arquivo)[1]

        if extensao not in self.allowed_extensions:
            raise ValidationError(
                _('Extensão não permitida. Válidas: {extensions}')
                .format(extensions=', '.join(self.allowed_extensions))
            )

    def validar_tipo_mime(self, arquivo):
        try:
            arquivo.seek(0)
            sample = arquivo.read(1024)
            arquivo.seek(0)

            mime_type = magic.from_buffer(sample, mime=True)

            if mime_type not in self.allowed_types:
                raise ValidationError(
                    _('Tipo de arquivo não permitido: {mime_type}')
                    .format(mime_type=mime_type)
                )

        except Exception as e:
            raise ValidationError(
                _('Erro ao validar arquivo: {error}')
                .format(error=str(e))
            )


# Instâncias pré-configuradas
validador_documento = FileValidator()
validador_imagem = FileValidator(
    allowed_types=ALLOWED_IMAGE_TYPES,
    allowed_extensions=['.jpg', '.jpeg', '.png', '.gif', '.webp']
)