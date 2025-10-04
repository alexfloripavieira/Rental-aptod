# CONT-001: Backend Completo (API + PDF + Validações)

## Metadata
- **Status**: Pendente
- **Prioridade**: Alta (bloqueador para CONT-002)
- **Estimativa**: ~15 dias úteis
- **Complexidade**: Alta
- **Dependências**: Nenhuma
- **Desbloqueia**: CONT-002

## Visão Geral

Implementar toda a camada backend necessária para geração de contratos de locação em PDF, incluindo validações, serializers, template HTML/CSS, geração programática de PDF com WeasyPrint e endpoint RESTful completo.

## Objetivos

1. Criar estrutura de módulo `aptos/contratos/` completa
2. Implementar validadores customizados para CPF, RG, telefone, email, CEP
3. Configurar serializers Django REST com validações robustas
4. Desenvolver template HTML/CSS de 4 páginas idêntico ao contrato padrão
5. Implementar geração de PDF com WeasyPrint
6. Criar endpoint `POST /api/v1/contratos/gerar/` com permissões
7. Garantir logs de auditoria para rastreabilidade
8. Atingir cobertura de testes ≥85% no módulo

## Subtarefas Detalhadas

### 1. Setup de Estrutura de Módulo (1 dia)

**Atividades**:
- [ ] Criar diretório `aptos/contratos/` com `__init__.py`
- [ ] Criar arquivos base:
  - `views.py`
  - `serializers.py`
  - `pdf_generator.py`
  - `validators.py`
  - `permissions.py`
  - `utils.py` (formatação, hashing)
- [ ] Criar diretório `templates/` com `contrato_locacao.html`
- [ ] Criar diretório `tests/` com arquivos de teste
- [ ] Adicionar módulo em `INSTALLED_APPS` (se necessário)
- [ ] Configurar rota em `app/urls.py`: `path('api/v1/contratos/', include('aptos.contratos.urls'))`

**Arquivos Criados**:
```
aptos/contratos/
├── __init__.py
├── views.py
├── serializers.py
├── pdf_generator.py
├── validators.py
├── permissions.py
├── utils.py
├── urls.py
├── templates/
│   └── contrato_locacao.html
└── tests/
    ├── __init__.py
    ├── test_views.py
    ├── test_serializers.py
    ├── test_pdf_generator.py
    └── test_validators.py
```

---

### 2. Validadores Customizados (2 dias)

**Arquivo**: `aptos/contratos/validators.py`

**Validadores a Implementar**:

```python
def validarCpf(cpf: str) -> bool:
    """
    Valida CPF brasileiro com dígitos verificadores.
    Formato esperado: XXX.XXX.XXX-XX ou XXXXXXXXXXX
    """
    # Implementar algoritmo de validação de CPF
    pass

def validarRg(rg: str, orgao: str) -> bool:
    """
    Valida RG brasileiro.
    Formato esperado: números + SSP/UF
    """
    pass

def validarTelefone(telefone: str) -> bool:
    """
    Valida telefone brasileiro.
    Formato esperado: (XX) XXXXX-XXXX
    """
    pass

def validarCep(cep: str) -> bool:
    """
    Valida CEP brasileiro.
    Formato esperado: XXXXX-XXX
    """
    pass

def validarEmail(email: str) -> bool:
    """Valida formato de email com regex padrão."""
    pass
```

**Testes** (`tests/test_validators.py`):
- [ ] Testes de CPF válidos
- [ ] Testes de CPF inválidos (dígitos incorretos, formato errado)
- [ ] Testes de RG válidos/inválidos
- [ ] Testes de telefone (formato brasileiro)
- [ ] Testes de CEP válidos/inválidos
- [ ] Testes de email válidos/inválidos

---

### 3. Serializers com Validações (2 dias)

**Arquivo**: `aptos/contratos/serializers.py`

**Estrutura de Serializers**:

```python
from rest_framework import serializers
from .validators import validarCpf, validarRg, validarTelefone, validarCep

class EnderecoLocadorSerializer(serializers.Serializer):
    rua = serializers.CharField(max_length=200)
    numero = serializers.CharField(max_length=20)
    bairro = serializers.CharField(max_length=100)
    cidade = serializers.CharField(max_length=100)
    estado = serializers.CharField(max_length=2)
    cep = serializers.CharField(max_length=9)

    def validate_cep(self, value):
        if not validarCep(value):
            raise serializers.ValidationError("CEP inválido")
        return value

class LocadorSerializer(serializers.Serializer):
    nome_completo = serializers.CharField(max_length=200)
    nacionalidade = serializers.CharField(max_length=50)
    estado_civil = serializers.CharField(max_length=30)
    profissao = serializers.CharField(max_length=100)
    cpf = serializers.CharField(max_length=14)
    endereco = EnderecoLocadorSerializer()

    def validate_cpf(self, value):
        if not validarCpf(value):
            raise serializers.ValidationError("CPF inválido")
        return value

class LocatarioSerializer(serializers.Serializer):
    nome_completo = serializers.CharField(max_length=200)
    nacionalidade = serializers.CharField(max_length=50)
    profissao = serializers.CharField(max_length=100)
    cpf = serializers.CharField(max_length=14)
    rg = serializers.CharField(max_length=20)
    rg_orgao = serializers.CharField(max_length=20)
    endereco_completo = serializers.CharField(max_length=300)
    telefone = serializers.CharField(max_length=15)
    email = serializers.EmailField()

    def validate_cpf(self, value):
        if not validarCpf(value):
            raise serializers.ValidationError("CPF inválido")
        return value

    def validate_telefone(self, value):
        if not validarTelefone(value):
            raise serializers.ValidationError("Telefone inválido")
        return value

class ContratoDetalhesSerializer(serializers.Serializer):
    data_inicio = serializers.DateField()
    valor_caucao = serializers.DecimalField(max_digits=10, decimal_places=2)
    clausula_segunda = serializers.CharField(min_length=50, max_length=5000)

    def validate_valor_caucao(self, value):
        if value <= 0:
            raise serializers.ValidationError("Valor deve ser positivo")
        return value

class ContratoSerializer(serializers.Serializer):
    locador = LocadorSerializer()
    locatario = LocatarioSerializer()
    contrato = ContratoDetalhesSerializer()
    inventario_moveis = serializers.CharField(min_length=20, max_length=2000)
```

**Testes** (`tests/test_serializers.py`):
- [ ] Teste de payload válido completo
- [ ] Teste de campos obrigatórios faltantes
- [ ] Teste de CPF inválido (locador e locatário)
- [ ] Teste de valores monetários inválidos
- [ ] Teste de datas passadas (se aplicável)
- [ ] Teste de limites de caracteres (min/max)

---

### 4. Template HTML/CSS (4 páginas) (4 dias)

**Arquivo**: `aptos/contratos/templates/contrato_locacao.html`

**Requisitos**:
- [ ] Página 1: Título, dados locador/locatário, objeto, cláusulas PRIMEIRA a QUARTA
- [ ] Página 2: Cláusulas QUINTA a NONA
- [ ] Página 3: Cláusulas DÉCIMA a DÉCIMA OITAVA + assinaturas
- [ ] Página 4: Regimento interno (texto fixo idêntico ao contrato padrão)

**Estrutura HTML**:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Contrato de Locação Residencial</title>
    <style>
        @page {
            size: A4;
            margin: 2cm 2.5cm;
        }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
        }
        .page-break {
            page-break-after: always;
        }
        .titulo {
            text-align: center;
            font-weight: bold;
            font-size: 14pt;
            margin-bottom: 20px;
        }
        .clausula {
            margin-bottom: 15px;
            text-align: justify;
        }
        .assinatura {
            margin-top: 40px;
            text-align: center;
        }
    </style>
</head>
<body>
    <!-- Página 1 -->
    <div class="titulo">CONTRATO DE LOCAÇÃO RESIDENCIAL</div>

    <p><strong>LOCADOR:</strong> {{ locador.nome_completo }}, {{ locador.nacionalidade }},
    {{ locador.estado_civil }}, {{ locador.profissao }}, portador do CPF {{ locador.cpf }},
    residente e domiciliado na {{ locador.endereco.rua }}, nº {{ locador.endereco.numero }},
    {{ locador.endereco.bairro }}, {{ locador.endereco.cidade }}-{{ locador.endereco.estado }},
    CEP {{ locador.endereco.cep }}.</p>

    <p><strong>LOCATÁRIO:</strong> {{ locatario.nome_completo }}, {{ locatario.nacionalidade }},
    {{ locatario.profissao }}, portador do CPF {{ locatario.cpf }}, RG {{ locatario.rg }}
    {{ locatario.rg_orgao }}, residente e domiciliado em {{ locatario.endereco_completo }},
    telefone {{ locatario.telefone }}, e-mail {{ locatario.email }}.</p>

    <div class="clausula">
        <strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O LOCADOR é proprietário do imóvel
        situado na [ENDEREÇO DO IMÓVEL], o qual dá em locação ao LOCATÁRIO pelo prazo e
        condições estabelecidas neste contrato.
    </div>

    <div class="clausula">
        <strong>CLÁUSULA SEGUNDA - DO ALUGUEL E FORMA DE PAGAMENTO:</strong>
        {{ contrato.clausula_segunda }}
    </div>

    <!-- Demais cláusulas fixas -->

    <div class="page-break"></div>

    <!-- Página 2 -->
    <!-- Cláusulas QUINTA a NONA -->

    <div class="page-break"></div>

    <!-- Página 3 -->
    <!-- Cláusulas DÉCIMA a DÉCIMA OITAVA -->

    <div class="assinatura">
        <p>Florianópolis, {{ data_formatada }}</p>
        <br><br>
        <p>_________________________________</p>
        <p>{{ locador.nome_completo }}</p>
        <p>LOCADOR</p>
        <br><br>
        <p>_________________________________</p>
        <p>{{ locatario.nome_completo }}</p>
        <p>LOCATÁRIO</p>
    </div>

    <div class="page-break"></div>

    <!-- Página 4 -->
    <div class="titulo">REGIMENTO INTERNO</div>
    <!-- Texto fixo do regimento interno idêntico ao contrato_padrao.pdf -->

    <div class="clausula">
        <strong>INVENTÁRIO DE MÓVEIS E UTENSÍLIOS:</strong><br>
        {{ inventario_moveis }}
    </div>
</body>
</html>
```

**Validações**:
- [ ] Comparação visual com `contrato_padrao.pdf`
- [ ] Fontes, margens e espaçamentos idênticos
- [ ] Quebras de página corretas (4 páginas exatas)
- [ ] Formatação de datas: "DD de mês_extenso de YYYY"
- [ ] Formatação de valores: "R$ X.XXX,XX"

---

### 5. Geração de PDF com WeasyPrint (3 dias)

**Arquivo**: `aptos/contratos/pdf_generator.py`

**Implementação**:

```python
from weasyprint import HTML
from django.template.loader import render_to_string
from datetime import datetime
from decimal import Decimal
import locale

# Configurar locale para português brasileiro
locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')

def formatarData(data: datetime) -> str:
    """Formata data como 'DD de mês_extenso de YYYY'"""
    meses = {
        1: 'janeiro', 2: 'fevereiro', 3: 'março', 4: 'abril',
        5: 'maio', 6: 'junho', 7: 'julho', 8: 'agosto',
        9: 'setembro', 10: 'outubro', 11: 'novembro', 12: 'dezembro'
    }
    dia = data.day
    mes = meses[data.month]
    ano = data.year
    return f"{dia} de {mes} de {ano}"

def formatarValor(valor: Decimal) -> str:
    """Formata valor como 'R$ X.XXX,XX'"""
    return f"R$ {valor:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

def gerarContratoPdf(dados_validados: dict) -> bytes:
    """
    Gera PDF do contrato a partir de dados validados.

    Args:
        dados_validados: Dict com dados validados do ContratoSerializer

    Returns:
        bytes: PDF gerado
    """
    # Preparar contexto para template
    contexto = {
        'locador': dados_validados['locador'],
        'locatario': dados_validados['locatario'],
        'contrato': dados_validados['contrato'],
        'inventario_moveis': dados_validados['inventario_moveis'],
        'data_formatada': formatarData(datetime.now()),
        'valor_caucao_formatado': formatarValor(
            dados_validados['contrato']['valor_caucao']
        ),
    }

    # Renderizar template HTML
    html_string = render_to_string('contrato_locacao.html', contexto)

    # Gerar PDF
    pdf_bytes = HTML(string=html_string).write_pdf()

    return pdf_bytes
```

**Testes** (`tests/test_pdf_generator.py`):
- [ ] Teste de geração com dados válidos completos
- [ ] Teste de formatação de datas
- [ ] Teste de formatação de valores monetários
- [ ] Teste de conteúdo do PDF (extrair texto e validar campos)
- [ ] Teste de número de páginas (deve ser 4)
- [ ] Teste de performance (< 5 segundos)

**Dependências a Instalar**:
```bash
pip install weasyprint
```

---

### 6. Permissões Customizadas (1 dia)

**Arquivo**: `aptos/contratos/permissions.py`

**Implementação**:

```python
from rest_framework.permissions import BasePermission

class IsSuperAdminUser(BasePermission):
    """
    Permissão que permite acesso apenas a super administradores.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser
```

**Testes** (`tests/test_permissions.py`):
- [ ] Teste de acesso com super admin (deve permitir)
- [ ] Teste de acesso com usuário comum (deve negar - 403)
- [ ] Teste de acesso sem autenticação (deve negar - 403)

---

### 7. View e Endpoint RESTful (2 dias)

**Arquivo**: `aptos/contratos/views.py`

**Implementação**:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from .serializers import ContratoSerializer
from .pdf_generator import gerarContratoPdf
from .permissions import IsSuperAdminUser
from .utils import hashCpf
import logging

logger = logging.getLogger(__name__)

class GerarContratoView(APIView):
    permission_classes = [IsSuperAdminUser]

    def post(self, request):
        """
        Endpoint para gerar contrato de locação em PDF.

        Request Body: JSON com dados de locador, locatário, contrato e inventário
        Response: PDF binário (application/pdf)
        """
        serializer = ContratoSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        dados_validados = serializer.validated_data

        try:
            # Gerar PDF
            pdf_bytes = gerarContratoPdf(dados_validados)

            # Log de auditoria (CPF hasheado para segurança)
            cpf_locatario = dados_validados['locatario']['cpf']
            logger.info(
                f"Contrato gerado por {request.user.username} - "
                f"CPF Locatário (hash): {hashCpf(cpf_locatario)}"
            )

            # Nome do arquivo
            cpf_sanitizado = cpf_locatario.replace('.', '').replace('-', '')
            data_inicio = dados_validados['contrato']['data_inicio'].strftime('%Y-%m-%d')
            nome_arquivo = f"contrato_locacao_{cpf_sanitizado}_{data_inicio}.pdf"

            # Response com PDF
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{nome_arquivo}"'
            return response

        except Exception as e:
            logger.error(f"Erro ao gerar contrato: {str(e)}", exc_info=True)
            return Response(
                {'detail': 'Erro ao gerar contrato. Tente novamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

**Arquivo**: `aptos/contratos/utils.py`

```python
import hashlib

def hashCpf(cpf: str) -> str:
    """Retorna hash SHA256 do CPF para logs seguros."""
    return hashlib.sha256(cpf.encode()).hexdigest()[:16]
```

**Arquivo**: `aptos/contratos/urls.py`

```python
from django.urls import path
from .views import GerarContratoView

urlpatterns = [
    path('gerar/', GerarContratoView.as_view(), name='gerar-contrato'),
]
```

**Testes** (`tests/test_views.py`):
- [ ] Teste de POST com payload válido (retorna 200 + PDF)
- [ ] Teste de POST com payload inválido (retorna 400 + errors)
- [ ] Teste de acesso sem permissão (retorna 403)
- [ ] Teste de Content-Type da resposta (`application/pdf`)
- [ ] Teste de header `Content-Disposition` com nome de arquivo correto
- [ ] Teste de log de auditoria (verificar se foi registrado)

---

### 8. Logs de Auditoria (Integrado no item 7)

**Requisitos**:
- [ ] Registrar usuário que gerou o contrato
- [ ] Registrar timestamp da geração
- [ ] Registrar CPF do locatário (hasheado)
- [ ] Registrar sucesso ou falha na geração
- [ ] Configurar nível de log: INFO para sucesso, ERROR para falha

**Configuração em `settings.py`**:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/contratos.log',
        },
    },
    'loggers': {
        'aptos.contratos': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

---

## Arquivos Afetados

### Novos Arquivos
- `aptos/contratos/__init__.py`
- `aptos/contratos/views.py`
- `aptos/contratos/serializers.py`
- `aptos/contratos/pdf_generator.py`
- `aptos/contratos/validators.py`
- `aptos/contratos/permissions.py`
- `aptos/contratos/utils.py`
- `aptos/contratos/urls.py`
- `aptos/contratos/templates/contrato_locacao.html`
- `aptos/contratos/tests/test_views.py`
- `aptos/contratos/tests/test_serializers.py`
- `aptos/contratos/tests/test_pdf_generator.py`
- `aptos/contratos/tests/test_validators.py`

### Arquivos Modificados
- `app/urls.py` (adicionar rota `/api/v1/contratos/`)
- `requirements.txt` (adicionar `weasyprint`)
- Opcional: `app/settings.py` (configurar LOGGING)

---

## Critérios de Aceitação

### Funcionalidade
- [ ] Endpoint `POST /api/v1/contratos/gerar/` funcional
- [ ] PDF gerado possui exatamente 4 páginas
- [ ] Todos os campos variáveis são preenchidos corretamente
- [ ] Formatação idêntica ao `contrato_padrao.pdf`
- [ ] Valores monetários formatados como R$ X.XXX,XX
- [ ] Datas formatadas como "DD de mês_extenso de YYYY"

### Validação
- [ ] CPF validado com algoritmo de dígito verificador
- [ ] RG, telefone, CEP, email validados corretamente
- [ ] Campos obrigatórios impedem geração se vazios
- [ ] Mensagens de erro claras e específicas

### Segurança
- [ ] Apenas super admins acessam endpoint (403 para outros)
- [ ] CPF hasheado em logs (não aparecem em texto plano)
- [ ] Payload sanitizado contra XSS/SQL Injection
- [ ] HTTPS em produção (configuração de infra)

### Performance
- [ ] PDF gerado em < 5 segundos (p95)
- [ ] Endpoint responde em < 6 segundos total (p95)

### Testes
- [ ] Cobertura de testes ≥ 85% no módulo `aptos/contratos/`
- [ ] Todos os testes passando (0 falhas)
- [ ] Testes de validação abrangentes
- [ ] Testes de geração de PDF com casos extremos

### Documentação
- [ ] Docstrings em todas as funções principais
- [ ] Comentários explicando lógica complexa (geração PDF, validações)
- [ ] README com instruções de instalação do WeasyPrint

---

## Riscos e Mitigações

### Risco 1: Complexidade do Template HTML
- **Mitigação**: Desenvolvimento iterativo, comparação visual constante com PDF original

### Risco 2: Performance de Geração de PDF
- **Mitigação**: Testes de performance, otimização de template, cache de configurações

### Risco 3: Validação de CPF Incorreta
- **Mitigação**: Usar biblioteca `validate-docbr` ou algoritmo testado, testes abrangentes

---

## Definição de Pronto (DoD)

- [ ] Todos os subtasks concluídos
- [ ] Código revisado (code review aprovado)
- [ ] Testes com cobertura ≥ 85%
- [ ] Lint/ruff sem erros
- [ ] PDF gerado manualmente e visualmente idêntico ao contrato_padrao.pdf
- [ ] Logs de auditoria funcionando
- [ ] Documentação mínima criada
- [ ] Deploy em ambiente de staging bem-sucedido
- [ ] Aprovação de QA/PO

---

**Próxima Tarefa**: CONT-002 - Frontend Completo (depende desta tarefa)
