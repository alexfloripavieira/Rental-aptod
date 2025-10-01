---
status: pending
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>backend/storage</domain>
<type>implementation</type>
<scope>middleware</scope>
<complexity>low</complexity>
<dependencies>http_server</dependencies>
<unblocks>8.0</unblocks>
</task_context>

# Tarefa 3.0: Configurar sistema de upload e gestão de documentos

## Visão Geral
Implementar sistema seguro de upload e gestão de documentos para inquilinos (RG, CNH, comprovantes de renda e residência), integrado ao sistema de media existente do Django. Incluir controle de acesso, versionamento e organização por inquilino.

## Requisitos
- Upload de documentos PDF, JPG, PNG
- Organização de arquivos por inquilino
- Controle de acesso baseado em permissões
- Versionamento de documentos
- Validação de tipos de arquivo e tamanho
- Integração com modelo Inquilino
- API endpoints para upload/download
- Limpeza automática de arquivos órfãos

## Subtarefas
- [ ] 3.1 Criar modelo DocumentoInquilino
- [ ] 3.2 Configurar storage e estrutura de diretórios
- [ ] 3.3 Implementar validadores de arquivo
- [ ] 3.4 Criar endpoints de upload/download
- [ ] 3.5 Implementar controle de acesso
- [ ] 3.6 Adicionar versionamento de documentos
- [ ] 3.7 Criar utilitário de limpeza de arquivos
- [ ] 3.8 Configurar Django admin para documentos

## Sequenciamento
- Bloqueado por: 1.0 (Modelo Inquilino criado)
- Desbloqueia: 8.0 (Formulários com upload)
- Paralelizável: Sim (pode ser desenvolvido em paralelo com 2.0)

## Detalhes de Implementação

### Modelo de Documento
```python
# aptos/models.py
import os
from django.core.validators import FileExtensionValidator

def documento_upload_path(instance, filename):
    """Gera path para upload de documentos"""
    inquilino_id = instance.inquilino.id
    tipo_doc = instance.tipo_documento.lower()
    ext = filename.split('.')[-1]
    new_filename = f"{tipo_doc}_{instance.versao}.{ext}"
    return f"inquilinos/{inquilino_id}/documentos/{new_filename}"

class TipoDocumento(models.TextChoices):
    RG = 'RG', 'RG'
    CNH = 'CNH', 'CNH'
    COMPROVANTE_RENDA = 'COMPROVANTE_RENDA', 'Comprovante de Renda'
    COMPROVANTE_RESIDENCIA = 'COMPROVANTE_RESIDENCIA', 'Comprovante de Residência'
    OUTROS = 'OUTROS', 'Outros'

class DocumentoInquilino(models.Model):
    inquilino = models.ForeignKey(
        Inquilino,
        on_delete=models.CASCADE,
        related_name='documentos'
    )
    tipo_documento = models.CharField(
        max_length=30,
        choices=TipoDocumento.choices
    )
    arquivo = models.FileField(
        upload_to=documento_upload_path,
        validators=[
            FileExtensionValidator(['pdf', 'jpg', 'jpeg', 'png']),
        ]
    )
    nome_original = models.CharField(max_length=255)
    versao = models.PositiveIntegerField(default=1)
    tamanho = models.PositiveIntegerField()  # em bytes
    mime_type = models.CharField(max_length=100)
    uploaded_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True
    )
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['inquilino', 'tipo_documento', 'versao']
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.arquivo:
            self.tamanho = self.arquivo.size
            self.nome_original = self.arquivo.name
        super().save(*args, **kwargs)
```

### Validadores de Arquivo
```python
# aptos/validators.py
from django.core.exceptions import ValidationError

def validar_tamanho_arquivo(arquivo):
    """Valida tamanho máximo de 5MB"""
    max_size = 5 * 1024 * 1024  # 5MB
    if arquivo.size > max_size:
        raise ValidationError('Arquivo muito grande. Máximo 5MB.')

def validar_tipo_arquivo(arquivo):
    """Valida tipos de arquivo permitidos"""
    allowed_types = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]
    if hasattr(arquivo, 'content_type'):
        if arquivo.content_type not in allowed_types:
            raise ValidationError('Tipo de arquivo não permitido.')
```

### API de Upload
```python
# aptos/views.py
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json

@csrf_exempt
@login_required
def upload_documento(request, inquilino_id):
    """Upload de documento para inquilino"""
    if request.method == 'POST':
        try:
            inquilino = Inquilino.objects.get(id=inquilino_id)
            arquivo = request.FILES.get('arquivo')
            tipo_documento = request.POST.get('tipo_documento')

            # Validações
            validar_tamanho_arquivo(arquivo)
            validar_tipo_arquivo(arquivo)

            # Verificar versão
            ultima_versao = DocumentoInquilino.objects.filter(
                inquilino=inquilino,
                tipo_documento=tipo_documento
            ).aggregate(max_versao=models.Max('versao'))['max_versao'] or 0

            # Criar documento
            documento = DocumentoInquilino.objects.create(
                inquilino=inquilino,
                tipo_documento=tipo_documento,
                arquivo=arquivo,
                versao=ultima_versao + 1,
                mime_type=arquivo.content_type,
                uploaded_by=request.user
            )

            return JsonResponse({
                'success': True,
                'documento_id': documento.id,
                'versao': documento.versao
            })

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

@login_required
def download_documento(request, documento_id):
    """Download de documento com controle de acesso"""
    try:
        documento = DocumentoInquilino.objects.get(
            id=documento_id,
            ativo=True
        )

        # Verificar permissões (implementar conforme necessário)
        if not request.user.has_perm('aptos.view_documentoinquilino'):
            return HttpResponse('Sem permissão', status=403)

        response = HttpResponse(
            documento.arquivo.read(),
            content_type=documento.mime_type
        )
        response['Content-Disposition'] = f'attachment; filename="{documento.nome_original}"'
        return response

    except DocumentoInquilino.DoesNotExist:
        return HttpResponse('Documento não encontrado', status=404)
```

### Utilitário de Limpeza
```python
# aptos/management/commands/limpar_documentos_orfaos.py
from django.core.management.base import BaseCommand
from aptos.models import DocumentoInquilino
import os

class Command(BaseCommand):
    help = 'Remove arquivos órfãos do sistema de documentos'

    def handle(self, *args, **options):
        # Encontrar documentos inativos antigos
        documentos_antigos = DocumentoInquilino.objects.filter(
            ativo=False,
            created_at__lt=timezone.now() - timedelta(days=30)
        )

        removidos = 0
        for doc in documentos_antigos:
            if doc.arquivo and os.path.exists(doc.arquivo.path):
                os.remove(doc.arquivo.path)
                removidos += 1
            doc.delete()

        self.stdout.write(
            self.style.SUCCESS(f'Removidos {removidos} documentos órfãos')
        )
```

## Critérios de Sucesso
- [ ] Upload de documentos funcionando para todos os tipos permitidos
- [ ] Estrutura de diretórios organizada por inquilino
- [ ] Validação de tipos e tamanhos de arquivo
- [ ] Versionamento funcionando corretamente
- [ ] Controle de acesso implementado
- [ ] API endpoints respondendo corretamente
- [ ] Django admin configurado para gestão de documentos
- [ ] Comando de limpeza funcionando
- [ ] Testes unitários cobrindo cenários principais
- [ ] Performance adequada para uploads grandes