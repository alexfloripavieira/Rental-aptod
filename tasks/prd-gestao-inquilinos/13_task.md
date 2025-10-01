---
status: pending
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>backend/compliance</domain>
<type>implementation</type>
<scope>middleware</scope>
<complexity>high</complexity>
<dependencies>database</dependencies>
<unblocks>16.0</unblocks>
</task_context>

# Tarefa 13.0: Implementar conformidade LGPD e auditoria

## Visão Geral
Implementar sistema completo de conformidade com LGPD (Lei Geral de Proteção de Dados), incluindo criptografia de dados sensíveis, log de auditoria, controle de retenção de dados, e funcionalidades para exercício de direitos dos titulares. Sistema crítico para compliance legal.

## Requisitos
- Criptografia de dados sensíveis (CPF, RG, dados financeiros)
- Log completo de auditoria para todas as operações
- Sistema de controle de retenção e purga de dados
- Funcionalidades para direitos LGPD (acesso, retificação, exclusão)
- Consentimento explícito para tratamento de dados
- Relatórios de compliance e auditoria
- Base legal para cada tratamento de dados
- Anonização de dados históricos

## Subtarefas
- [ ] 13.1 Implementar criptografia de dados sensíveis
- [ ] 13.2 Criar sistema de log de auditoria
- [ ] 13.3 Desenvolver controle de retenção de dados
- [ ] 13.4 Implementar exercício de direitos LGPD
- [ ] 13.5 Criar sistema de consentimento
- [ ] 13.6 Desenvolver relatórios de compliance
- [ ] 13.7 Implementar anonização de dados
- [ ] 13.8 Configurar políticas de backup seguro

## Sequenciamento
- Bloqueado por: 1.0 (Modelo Inquilino criado)
- Desbloqueia: 16.0 (Integração final)
- Paralelizável: Sim (pode ser desenvolvido em paralelo)

## Detalhes de Implementação

### Sistema de Criptografia
```python
# aptos/crypto.py
from cryptography.fernet import Fernet
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
import base64
import os

class DataEncryption:
    def __init__(self):
        key = getattr(settings, 'ENCRYPTION_KEY', None)
        if not key:
            # Gerar chave se não existir (apenas desenvolvimento)
            if settings.DEBUG:
                key = Fernet.generate_key()
                print(f"Generated encryption key: {key.decode()}")
            else:
                raise ImproperlyConfigured("ENCRYPTION_KEY must be set in production")

        if isinstance(key, str):
            key = key.encode()

        self.cipher = Fernet(key)

    def encrypt(self, data):
        """Criptografa dados sensíveis"""
        if not data:
            return data

        if isinstance(data, str):
            data = data.encode()

        encrypted = self.cipher.encrypt(data)
        return base64.b64encode(encrypted).decode()

    def decrypt(self, encrypted_data):
        """Descriptografa dados sensíveis"""
        if not encrypted_data:
            return encrypted_data

        try:
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception:
            # Retorna o dado original se não conseguir descriptografar
            # (compatibilidade com dados não criptografados)
            return encrypted_data

# Instância global
data_encryption = DataEncryption()

# Campos customizados para criptografia
from django.db import models

class EncryptedCharField(models.CharField):
    """Campo CharField que criptografa automaticamente"""

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return data_encryption.decrypt(value)

    def to_python(self, value):
        if isinstance(value, str) or value is None:
            return value
        return data_encryption.decrypt(value)

    def get_prep_value(self, value):
        if value is None:
            return value
        return data_encryption.encrypt(value)

class EncryptedTextField(models.TextField):
    """Campo TextField que criptografa automaticamente"""

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return data_encryption.decrypt(value)

    def to_python(self, value):
        if isinstance(value, str) or value is None:
            return value
        return data_encryption.decrypt(value)

    def get_prep_value(self, value):
        if value is None:
            return value
        return data_encryption.encrypt(value)
```

### Modelo de Auditoria
```python
# aptos/models.py (adição)
class AuditoriaLGPD(models.Model):
    OPERACAO_CHOICES = [
        ('CREATE', 'Criação'),
        ('READ', 'Consulta'),
        ('UPDATE', 'Atualização'),
        ('DELETE', 'Exclusão'),
        ('EXPORT', 'Exportação'),
        ('CONSENT', 'Consentimento'),
        ('WITHDRAW', 'Revogação'),
        ('ANONYMIZE', 'Anonimização'),
    ]

    BASE_LEGAL_CHOICES = [
        ('CONSENTIMENTO', 'Consentimento'),
        ('EXECUCAO_CONTRATO', 'Execução de Contrato'),
        ('INTERESSE_LEGITIMO', 'Interesse Legítimo'),
        ('OBRIGACAO_LEGAL', 'Obrigação Legal'),
    ]

    # Dados da operação
    operacao = models.CharField(max_length=20, choices=OPERACAO_CHOICES)
    modelo = models.CharField(max_length=100)  # Nome do modelo
    objeto_id = models.CharField(max_length=100)  # ID do objeto
    dados_acessados = models.JSONField(default=list)  # Campos acessados
    base_legal = models.CharField(max_length=30, choices=BASE_LEGAL_CHOICES)
    finalidade = models.TextField()

    # Dados do usuário/sistema
    usuario = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)

    # Dados do titular
    titular_id = models.CharField(max_length=100, blank=True, null=True)
    titular_documento = EncryptedCharField(max_length=200, blank=True, null=True)

    # Metadados
    timestamp = models.DateTimeField(auto_now_add=True)
    detalhes_adicionais = models.JSONField(default=dict)

    class Meta:
        indexes = [
            models.Index(fields=['titular_id', 'timestamp']),
            models.Index(fields=['operacao', 'timestamp']),
            models.Index(fields=['modelo', 'objeto_id']),
        ]

    def __str__(self):
        return f"{self.operacao} - {self.modelo} - {self.timestamp}"

class ConsentimentoLGPD(models.Model):
    """Registro de consentimentos LGPD"""
    inquilino = models.ForeignKey(
        Inquilino,
        on_delete=models.CASCADE,
        related_name='consentimentos'
    )
    finalidade = models.TextField()
    dados_tratados = models.JSONField(default=list)
    consentimento_dado = models.BooleanField(default=False)
    data_consentimento = models.DateTimeField(blank=True, null=True)
    data_revogacao = models.DateTimeField(blank=True, null=True)
    versao_politica = models.CharField(max_length=20, default='1.0')
    ip_consentimento = models.GenericIPAddressField(blank=True, null=True)
    evidencia = models.JSONField(default=dict)  # Evidências do consentimento

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['inquilino', 'finalidade', 'versao_politica']

    @property
    def esta_ativo(self):
        return self.consentimento_dado and not self.data_revogacao

class RetencaoDados(models.Model):
    """Controle de retenção de dados"""
    inquilino = models.OneToOneField(
        Inquilino,
        on_delete=models.CASCADE,
        related_name='retencao_dados'
    )
    data_ultimo_uso = models.DateTimeField(auto_now=True)
    prazo_retencao_anos = models.IntegerField(default=5)
    motivo_retencao = models.TextField()
    agendado_para_purga = models.BooleanField(default=False)
    data_agendamento_purga = models.DateTimeField(blank=True, null=True)
    anonimizado = models.BooleanField(default=False)
    data_anonimizacao = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### Middleware de Auditoria
```python
# aptos/middleware.py
from django.utils.deprecation import MiddlewareMixin
from .models import AuditoriaLGPD
import json
import uuid

class LGPDAuditMiddleware(MiddlewareMixin):
    """Middleware para auditoria automática LGPD"""

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        # Gerar ID único para a requisição
        request._audit_id = str(uuid.uuid4())

        # Verificar se é operação sobre dados de inquilinos
        if self._should_audit(request):
            request._should_audit = True
            request._audit_data = {
                'ip_address': self._get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'method': request.method,
                'path': request.path,
                'user': request.user if request.user.is_authenticated else None,
            }

    def process_response(self, request, response):
        # Registrar auditoria se necessário
        if hasattr(request, '_should_audit') and request._should_audit:
            self._create_audit_log(request, response)

        return response

    def _should_audit(self, request):
        """Verifica se a requisição deve ser auditada"""
        audit_paths = [
            '/api/v1/inquilinos/',
            '/admin/aptos/inquilino/',
        ]

        return any(request.path.startswith(path) for path in audit_paths)

    def _get_client_ip(self, request):
        """Obtém IP real do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def _create_audit_log(self, request, response):
        """Cria log de auditoria"""
        try:
            audit_data = request._audit_data

            # Determinar operação baseada no método HTTP
            operation_map = {
                'GET': 'READ',
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete',
            }

            operacao = operation_map.get(audit_data['method'].upper(), 'read')

            # Extrair ID do objeto se disponível
            objeto_id = self._extract_object_id(request.path)

            AuditoriaLGPD.objects.create(
                operacao=operacao.upper(),
                modelo='Inquilino',
                objeto_id=objeto_id or 'N/A',
                dados_acessados=['*'],  # Implementar detecção específica
                base_legal='EXECUCAO_CONTRATO',  # Definir baseado no contexto
                finalidade='Gestão de locações',
                usuario=audit_data['user'],
                ip_address=audit_data['ip_address'],
                user_agent=audit_data['user_agent'],
                detalhes_adicionais={
                    'request_id': request._audit_id,
                    'path': audit_data['path'],
                    'method': audit_data['method'],
                    'status_code': response.status_code,
                }
            )

        except Exception as e:
            # Log silencioso para não afetar a aplicação
            import logging
            logger = logging.getLogger('lgpd_audit')
            logger.error(f"Erro ao criar log de auditoria: {e}")

    def _extract_object_id(self, path):
        """Extrai ID do objeto da URL"""
        import re
        match = re.search(r'/(\d+)/?$', path)
        return match.group(1) if match else None
```

### Serviços LGPD
```python
# aptos/services/lgpd_service.py
from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta
from ..models import Inquilino, AuditoriaLGPD, ConsentimentoLGPD, RetencaoDados
import hashlib

class LGPDService:
    """Serviços para conformidade LGPD"""

    def registrar_consentimento(self, inquilino, finalidade, dados_tratados,
                               consentimento_dado=True, ip_address=None, evidencia=None):
        """Registra consentimento do titular"""
        with transaction.atomic():
            consentimento, created = ConsentimentoLGPD.objects.get_or_create(
                inquilino=inquilino,
                finalidade=finalidade,
                versao_politica='1.0',
                defaults={
                    'dados_tratados': dados_tratados,
                    'consentimento_dado': consentimento_dado,
                    'data_consentimento': timezone.now() if consentimento_dado else None,
                    'ip_consentimento': ip_address,
                    'evidencia': evidencia or {},
                }
            )

            if not created and consentimento_dado != consentimento.consentimento_dado:
                consentimento.consentimento_dado = consentimento_dado
                if consentimento_dado:
                    consentimento.data_consentimento = timezone.now()
                    consentimento.data_revogacao = None
                else:
                    consentimento.data_revogacao = timezone.now()
                consentimento.save()

            return consentimento

    def exportar_dados_titular(self, inquilino):
        """Exporta todos os dados do titular (Direito de Acesso)"""
        dados = {
            'informacoes_pessoais': {
                'tipo': inquilino.tipo,
                'nome_completo': inquilino.nome_completo,
                'razao_social': inquilino.razao_social,
                'email': inquilino.email,
                'telefone': inquilino.telefone,
                'status': inquilino.status,
                'data_cadastro': inquilino.created_at.isoformat(),
            },
            'documentos': {
                'cpf': inquilino.cpf,
                'cnpj': inquilino.cnpj,
                'rg': inquilino.rg,
            },
            'locacoes': [],
            'documentos_anexos': [],
            'historico_status': [],
            'consentimentos': [],
        }

        # Adicionar locações
        for associacao in inquilino.associacoes_apartamento.all():
            dados['locacoes'].append({
                'apartamento': str(associacao.apartamento),
                'data_inicio': associacao.data_inicio.isoformat(),
                'data_fim': associacao.data_fim.isoformat() if associacao.data_fim else None,
                'valor_aluguel': str(associacao.valor_aluguel) if associacao.valor_aluguel else None,
                'ativo': associacao.ativo,
            })

        # Adicionar documentos
        for documento in inquilino.documentos.all():
            dados['documentos_anexos'].append({
                'tipo': documento.tipo_documento,
                'nome_arquivo': documento.nome_original,
                'data_upload': documento.created_at.isoformat(),
                'tamanho': documento.tamanho,
            })

        # Adicionar histórico de status
        for historico in inquilino.historico_status.all():
            dados['historico_status'].append({
                'status_anterior': historico.status_anterior,
                'status_novo': historico.status_novo,
                'data': historico.timestamp.isoformat(),
                'motivo': historico.motivo,
            })

        # Adicionar consentimentos
        for consentimento in inquilino.consentimentos.all():
            dados['consentimentos'].append({
                'finalidade': consentimento.finalidade,
                'dados_tratados': consentimento.dados_tratados,
                'consentimento_ativo': consentimento.esta_ativo,
                'data_consentimento': consentimento.data_consentimento.isoformat() if consentimento.data_consentimento else None,
                'data_revogacao': consentimento.data_revogacao.isoformat() if consentimento.data_revogacao else None,
            })

        # Registrar auditoria
        AuditoriaLGPD.objects.create(
            operacao='EXPORT',
            modelo='Inquilino',
            objeto_id=str(inquilino.id),
            dados_acessados=['*'],
            base_legal='CONSENTIMENTO',
            finalidade='Exercício do direito de acesso LGPD',
            titular_id=str(inquilino.id),
            ip_address='127.0.0.1',  # Será preenchido pelo middleware
        )

        return dados

    def anonimizar_dados_titular(self, inquilino, motivo='Exercício do direito ao esquecimento'):
        """Anonimiza dados do titular (Direito ao Esquecimento)"""
        with transaction.atomic():
            # Hash do ID original para manter referências
            id_hash = hashlib.sha256(str(inquilino.id).encode()).hexdigest()[:16]

            # Anonimizar dados pessoais
            inquilino.nome_completo = f"Titular Anonimizado {id_hash}"
            inquilino.razao_social = f"Empresa Anonimizada {id_hash}"
            inquilino.nome_fantasia = None
            inquilino.cpf = None
            inquilino.cnpj = None
            inquilino.rg = None
            inquilino.email = f"anonimizado_{id_hash}@example.com"
            inquilino.telefone = "00000000000"
            inquilino.data_nascimento = None
            inquilino.estado_civil = None
            inquilino.profissao = "Anonimizado"
            inquilino.renda = None
            inquilino.inscricao_estadual = None
            inquilino.responsavel_legal = None
            inquilino.endereco_completo = "Endereço anonimizado"
            inquilino.observacoes = "Dados anonimizados conforme LGPD"
            inquilino.status = 'INATIVO'
            inquilino.save()

            # Marcar como anonimizado na retenção
            retencao, created = RetencaoDados.objects.get_or_create(
                inquilino=inquilino,
                defaults={
                    'prazo_retencao_anos': 5,
                    'motivo_retencao': 'Dados anonimizados',
                }
            )
            retencao.anonimizado = True
            retencao.data_anonimizacao = timezone.now()
            retencao.save()

            # Registrar auditoria
            AuditoriaLGPD.objects.create(
                operacao='ANONYMIZE',
                modelo='Inquilino',
                objeto_id=str(inquilino.id),
                dados_acessados=['*'],
                base_legal='CONSENTIMENTO',
                finalidade='Exercício do direito ao esquecimento LGPD',
                titular_id=id_hash,
                ip_address='127.0.0.1',
                detalhes_adicionais={'motivo': motivo}
            )

            return True

    def verificar_dados_para_purga(self):
        """Verifica dados que devem ser purgados"""
        limite_retencao = timezone.now() - timedelta(days=5*365)  # 5 anos

        candidatos_purga = RetencaoDados.objects.filter(
            data_ultimo_uso__lt=limite_retencao,
            agendado_para_purga=False,
            anonimizado=False
        )

        for retencao in candidatos_purga:
            # Verificar se ainda há base legal para manter os dados
            if not self._verificar_base_legal_ativa(retencao.inquilino):
                retencao.agendado_para_purga = True
                retencao.data_agendamento_purga = timezone.now()
                retencao.save()

        return candidatos_purga.count()

    def _verificar_base_legal_ativa(self, inquilino):
        """Verifica se ainda há base legal para manter os dados"""
        # Verificar locações ativas
        if inquilino.associacoes_apartamento.filter(ativo=True).exists():
            return True

        # Verificar consentimentos ativos
        if inquilino.consentimentos.filter(
            consentimento_dado=True,
            data_revogacao__isnull=True
        ).exists():
            return True

        # Verificar obrigações legais (ex: contábeis, fiscais)
        # Implementar conforme necessário

        return False

# Instância global do serviço
lgpd_service = LGPDService()
```

## Critérios de Sucesso
- [ ] Criptografia de dados sensíveis funcionando
- [ ] Log completo de auditoria para todas as operações
- [ ] Sistema de consentimento implementado
- [ ] Exercício de direitos LGPD funcionando (acesso, esquecimento)
- [ ] Controle de retenção de dados implementado
- [ ] Anonização de dados funcionando corretamente
- [ ] Relatórios de compliance gerados
- [ ] Backup seguro configurado
- [ ] Testes de compliance passando
- [ ] Documentação LGPD completa