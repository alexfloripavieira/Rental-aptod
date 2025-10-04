# Tech Spec - Gerador de Contratos de Locação Residencial

**Versão**: 1.0
**Data**: 2025-10-04
**Autor**: Claude Code Agent
**PRD Relacionado**: `prd-geracao-contratos-locacao.md`
**Status**: Draft - Aguardando Aprovação

---

## 1. Visão Geral da Arquitetura

### 1.1 Contexto Técnico

Esta funcionalidade adiciona geração programática de contratos de locação em PDF ao sistema Aptos. A solução segue arquitetura cliente-servidor existente:

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Django 5.2 + Django REST Framework
- **Geração de PDF**: WeasyPrint (HTML/CSS → PDF)
- **Autenticação**: Django Session Authentication + Permissões

### 1.2 Diagrama de Fluxo de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE GERAÇÃO DE CONTRATO                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Frontend    │       │   Backend    │       │ PDF Generator│
│  (React)     │       │  (Django)    │       │ (WeasyPrint) │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                      │                      │
       │ 1. Usuário clica     │                      │
       │    "Gerar Contrato"  │                      │
       │──────────────────────│                      │
       │                      │                      │
       │ 2. Modal abre        │                      │
       │    com formulário    │                      │
       │◄─────────────────────│                      │
       │                      │                      │
       │ 3. Preenche campos   │                      │
       │    e valida (Yup)    │                      │
       │──────────────────────│                      │
       │                      │                      │
       │ 4. POST /api/v1/     │                      │
       │    contratos/gerar/  │                      │
       │─────────────────────►│                      │
       │                      │                      │
       │                      │ 5. Valida permissões │
       │                      │    (is_superuser)    │
       │                      │──────────────────────│
       │                      │                      │
       │                      │ 6. Valida payload    │
       │                      │    (Serializer)      │
       │                      │──────────────────────│
       │                      │                      │
       │                      │ 7. Chama gerador     │
       │                      │────────────────────► │
       │                      │                      │
       │                      │                      │ 8. Renderiza
       │                      │                      │    template HTML
       │                      │                      │    com variáveis
       │                      │                      │
       │                      │                      │ 9. Converte
       │                      │                      │    HTML → PDF
       │                      │                      │
       │                      │ 10. Retorna bytes    │
       │                      │◄─────────────────────│
       │                      │                      │
       │                      │ 11. Registra log     │
       │                      │    de auditoria      │
       │                      │──────────────────────│
       │                      │                      │
       │ 12. Response: PDF    │                      │
       │    (application/pdf) │                      │
       │◄─────────────────────│                      │
       │                      │                      │
       │ 13. Cria Blob URL    │                      │
       │     e download       │                      │
       │──────────────────────│                      │
       │                      │                      │
       │ 14. Exibe modal      │                      │
       │     de sucesso       │                      │
       │──────────────────────│                      │
```

### 1.3 Componentes Principais

**Frontend**:
1. `GerarContratoButton` - Botão de ação em InquilinosListPage
2. `GerarContratoModal` - Modal container principal
3. `FormularioContrato` - Formulário multi-seção
4. `ContratoSucessoModal` - Modal de sucesso com download
5. `useGerarContrato` - Hook customizado para API calls

**Backend**:
1. `aptos/contratos/views.py` - `GerarContratoView` (APIView)
2. `aptos/contratos/serializers.py` - `ContratoSerializer`
3. `aptos/contratos/pdf_generator.py` - `gerarContratoPdf()`
4. `aptos/contratos/validators.py` - Validadores customizados
5. `aptos/contratos/permissions.py` - `IsSuperAdminUser`
6. `aptos/contratos/templates/contrato_locacao.html` - Template HTML

---

## 2. Design de Componentes

### 2.1 Componentes Frontend

#### 2.1.1 GerarContratoButton

**Localização**: `/frontend/src/components/contratos/GerarContratoButton.tsx`

**Responsabilidade**: Renderizar botão de ação condicionalmente para super admins.

**Props**:
```typescript
interface GerarContratoButtonProps {
  onOpenModal: () => void;
}
```

**Comportamento**:
- Verifica `user.is_superuser` antes de renderizar
- Exibe tooltip "Gerar Contrato de Locação" ao hover
- Abre modal ao clicar

**Exemplo de Uso**:
```tsx
<GerarContratoButton onOpenModal={() => setModalOpen(true)} />
```

---

#### 2.1.2 GerarContratoModal

**Localização**: `/frontend/src/components/contratos/GerarContratoModal.tsx`

**Responsabilidade**: Container principal que orquestra fluxo de geração.

**Props**:
```typescript
interface GerarContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Estados**:
```typescript
const [step, setStep] = useState<'form' | 'loading' | 'success' | 'error'>('form');
const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
const [errorMessage, setErrorMessage] = useState<string>('');
```

**Comportamento**:
- `step='form'`: Renderiza `FormularioContrato`
- `step='loading'`: Exibe spinner durante geração
- `step='success'`: Renderiza `ContratoSucessoModal`
- `step='error'`: Exibe mensagem de erro com opção de retry

---

#### 2.1.3 FormularioContrato

**Localização**: `/frontend/src/components/contratos/FormularioContrato.tsx`

**Responsabilidade**: Formulário completo com validações client-side.

**Props**:
```typescript
interface FormularioContratoProps {
  onSubmit: (data: ContratoFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}
```

**Schema de Validação (Yup)**:
```typescript
import * as yup from 'yup';

const contratoSchema = yup.object({
  locador: yup.object({
    nomeCompleto: yup.string().required('Campo obrigatório').max(200),
    nacionalidade: yup.string().required('Campo obrigatório').max(50),
    estadoCivil: yup.string().required('Campo obrigatório').max(30),
    profissao: yup.string().required('Campo obrigatório').max(100),
    cpf: yup.string()
      .required('Campo obrigatório')
      .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato inválido: XXX.XXX.XXX-XX')
      .test('cpf-valido', 'CPF inválido', validarCpf),
    endereco: yup.object({
      rua: yup.string().required('Campo obrigatório').max(200),
      numero: yup.string().required('Campo obrigatório').max(20),
      bairro: yup.string().required('Campo obrigatório').max(100),
      cidade: yup.string().required('Campo obrigatório').max(100),
      estado: yup.string().required('Campo obrigatório').length(2, 'UF com 2 letras'),
      cep: yup.string()
        .required('Campo obrigatório')
        .matches(/^\d{5}-\d{3}$/, 'Formato inválido: XXXXX-XXX'),
    }),
  }),
  locatario: yup.object({
    nomeCompleto: yup.string().required('Campo obrigatório').max(200),
    nacionalidade: yup.string().required('Campo obrigatório').max(50),
    profissao: yup.string().required('Campo obrigatório').max(100),
    cpf: yup.string()
      .required('Campo obrigatório')
      .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato inválido')
      .test('cpf-valido', 'CPF inválido', validarCpf),
    rg: yup.string().required('Campo obrigatório').max(20),
    rgOrgao: yup.string().required('Campo obrigatório').max(20),
    enderecoCompleto: yup.string().required('Campo obrigatório').max(300),
    telefone: yup.string()
      .required('Campo obrigatório')
      .matches(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato inválido: (XX) XXXXX-XXXX'),
    email: yup.string()
      .required('Campo obrigatório')
      .email('Email inválido'),
  }),
  contrato: yup.object({
    dataInicio: yup.date()
      .required('Campo obrigatório')
      .min(new Date(), 'Data deve ser futura'),
    valorCaucao: yup.number()
      .required('Campo obrigatório')
      .positive('Valor deve ser positivo')
      .max(999999.99, 'Valor máximo excedido'),
    clausulaSegunda: yup.string()
      .required('Campo obrigatório')
      .min(50, 'Mínimo 50 caracteres')
      .max(5000, 'Máximo 5000 caracteres'),
  }),
  inventarioMoveis: yup.string()
    .required('Campo obrigatório')
    .min(20, 'Mínimo 20 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
});
```

**Estrutura do Formulário**:
```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  {/* Seção 1: Dados do Locador */}
  <section>
    <h3>Dados do Locador</h3>
    <Input name="locador.nomeCompleto" label="Nome Completo" required />
    <Input name="locador.nacionalidade" label="Nacionalidade" required />
    <Input name="locador.estadoCivil" label="Estado Civil" required />
    <Input name="locador.profissao" label="Profissão" required />
    <Input name="locador.cpf" label="CPF" mask="999.999.999-99" required />

    <h4>Endereço do Locador</h4>
    <Input name="locador.endereco.rua" label="Rua" required />
    <Input name="locador.endereco.numero" label="Número" required />
    <Input name="locador.endereco.bairro" label="Bairro" required />
    <Input name="locador.endereco.cidade" label="Cidade" required />
    <Input name="locador.endereco.estado" label="UF" maxLength={2} required />
    <Input name="locador.endereco.cep" label="CEP" mask="99999-999" required />
  </section>

  {/* Seção 2: Dados do Locatário */}
  <section>
    <h3>Dados do Locatário</h3>
    <Input name="locatario.nomeCompleto" label="Nome Completo" required />
    <Input name="locatario.nacionalidade" label="Nacionalidade" required />
    <Input name="locatario.profissao" label="Profissão" required />
    <Input name="locatario.cpf" label="CPF" mask="999.999.999-99" required />
    <Input name="locatario.rg" label="RG" required />
    <Input name="locatario.rgOrgao" label="Órgão Emissor" placeholder="SSP/SC" required />
    <Textarea name="locatario.enderecoCompleto" label="Endereço Completo" required />
    <Input name="locatario.telefone" label="Telefone" mask="(99) 99999-9999" required />
    <Input name="locatario.email" label="Email" type="email" required />
  </section>

  {/* Seção 3: Detalhes do Contrato */}
  <section>
    <h3>Detalhes do Contrato</h3>
    <Input name="contrato.dataInicio" label="Data de Início" type="date" required />
    <Input
      name="contrato.valorCaucao"
      label="Valor da Caução"
      type="number"
      step="0.01"
      prefix="R$"
      required
    />
    <Textarea
      name="contrato.clausulaSegunda"
      label="Cláusula Segunda (Acordo de Pagamento)"
      minLength={50}
      maxLength={5000}
      showCharCount
      required
    />
  </section>

  {/* Seção 4: Inventário de Móveis */}
  <section>
    <h3>Inventário de Móveis</h3>
    <Textarea
      name="inventarioMoveis"
      label="Descrição dos Móveis"
      placeholder="armário de pia com tampo em granito, guarda-roupa, fogão elétrico..."
      minLength={20}
      maxLength={2000}
      showCharCount
      required
    />
  </section>

  {/* Botões de Ação */}
  <div className="flex justify-end space-x-3">
    <button type="button" onClick={onCancel}>Cancelar</button>
    <button type="submit" disabled={loading || !isValid}>
      {loading ? 'Gerando...' : 'Gerar Contrato'}
    </button>
  </div>
</form>
```

---

#### 2.1.4 ContratoSucessoModal

**Localização**: `/frontend/src/components/contratos/ContratoSucessoModal.tsx`

**Responsabilidade**: Exibir sucesso e opções de download/impressão.

**Props**:
```typescript
interface ContratoSucessoModalProps {
  pdfBlob: Blob;
  nomeArquivo: string;
  onClose: () => void;
}
```

**Comportamento**:
```tsx
const baixarPdf = () => {
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
};

const imprimirPdf = () => {
  const url = URL.createObjectURL(pdfBlob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.contentWindow?.print();
};
```

---

#### 2.1.5 useGerarContrato Hook

**Localização**: `/frontend/src/hooks/useGerarContrato.ts`

**Responsabilidade**: Lógica de API call e gerenciamento de estado.

```typescript
import axios from 'axios';
import { useState } from 'react';
import type { ContratoFormData } from '../types/contrato';

interface UseGerarContratoReturn {
  gerarContrato: (data: ContratoFormData) => Promise<Blob>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGerarContrato(): UseGerarContratoReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gerarContrato = async (data: ContratoFormData): Promise<Blob> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        '/api/v1/contratos/gerar/',
        transformarParaPayload(data),
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 200) {
        throw new Error('Erro ao gerar contrato');
      }

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao gerar contrato';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { gerarContrato, loading, error, clearError };
}

function transformarParaPayload(data: ContratoFormData) {
  return {
    locador: {
      nome_completo: data.locador.nomeCompleto,
      nacionalidade: data.locador.nacionalidade,
      estado_civil: data.locador.estadoCivil,
      profissao: data.locador.profissao,
      cpf: data.locador.cpf,
      endereco: {
        rua: data.locador.endereco.rua,
        numero: data.locador.endereco.numero,
        bairro: data.locador.endereco.bairro,
        cidade: data.locador.endereco.cidade,
        estado: data.locador.endereco.estado,
        cep: data.locador.endereco.cep,
      },
    },
    locatario: {
      nome_completo: data.locatario.nomeCompleto,
      nacionalidade: data.locatario.nacionalidade,
      profissao: data.locatario.profissao,
      cpf: data.locatario.cpf,
      rg: data.locatario.rg,
      rg_orgao: data.locatario.rgOrgao,
      endereco_completo: data.locatario.enderecoCompleto,
      telefone: data.locatario.telefone,
      email: data.locatario.email,
    },
    contrato: {
      data_inicio: data.contrato.dataInicio,
      valor_caucao: data.contrato.valorCaucao,
      clausula_segunda: data.contrato.clausulaSegunda,
    },
    inventario_moveis: data.inventarioMoveis,
  };
}
```

---

### 2.2 Módulos Backend

#### 2.2.1 Estrutura de Diretórios

```
aptos/
├── contratos/
│   ├── __init__.py
│   ├── views.py              # GerarContratoView (APIView)
│   ├── serializers.py        # ContratoSerializer
│   ├── pdf_generator.py      # gerarContratoPdf()
│   ├── validators.py         # Validadores customizados
│   ├── permissions.py        # IsSuperAdminUser
│   ├── utils.py              # Helpers (formatação, hashing)
│   ├── templates/
│   │   └── contrato_locacao.html  # Template HTML do contrato
│   └── tests/
│       ├── __init__.py
│       ├── test_views.py
│       ├── test_serializers.py
│       ├── test_pdf_generator.py
│       └── test_validators.py
```

---

#### 2.2.2 Views - GerarContratoView

**Localização**: `aptos/contratos/views.py`

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from .serializers import ContratoSerializer
from .pdf_generator import gerarContratoPdf
from .permissions import IsSuperAdminUser
import logging

logger = logging.getLogger(__name__)


class GerarContratoView(APIView):
    permission_classes = [IsSuperAdminUser]

    def post(self, request, *args, **kwargs):
        serializer = ContratoSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        validated_data = serializer.validated_data

        try:
            pdf_bytes = gerarContratoPdf(validated_data)

            cpf_locatario = validated_data['locatario']['cpf'].replace('.', '').replace('-', '')
            data_inicio = validated_data['contrato']['data_inicio'].strftime('%Y-%m-%d')
            nome_arquivo = f"contrato_locacao_{cpf_locatario}_{data_inicio}.pdf"

            logger.info(
                f"Contrato gerado por {request.user.username} para CPF {self._hashCpf(cpf_locatario)}",
                extra={
                    'user_id': request.user.id,
                    'cpf_hash': self._hashCpf(cpf_locatario),
                }
            )

            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{nome_arquivo}"'
            return response

        except Exception as e:
            logger.error(f"Erro ao gerar PDF: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Erro interno ao gerar contrato. Tente novamente."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _hashCpf(self, cpf):
        import hashlib
        return hashlib.sha256(cpf.encode()).hexdigest()[:8]
```

---

#### 2.2.3 Serializers - ContratoSerializer

**Localização**: `aptos/contratos/serializers.py`

```python
from rest_framework import serializers
from aptos.validators import validar_cpf, limpar_documento
from .validators import validarRg, validarTelefone, validarCep


class EnderecoLocadorSerializer(serializers.Serializer):
    rua = serializers.CharField(max_length=200)
    numero = serializers.CharField(max_length=20)
    bairro = serializers.CharField(max_length=100)
    cidade = serializers.CharField(max_length=100)
    estado = serializers.CharField(max_length=2)
    cep = serializers.CharField(max_length=9, validators=[validarCep])


class LocadorSerializer(serializers.Serializer):
    nome_completo = serializers.CharField(max_length=200)
    nacionalidade = serializers.CharField(max_length=50)
    estado_civil = serializers.CharField(max_length=30)
    profissao = serializers.CharField(max_length=100)
    cpf = serializers.CharField(max_length=14, validators=[validar_cpf])
    endereco = EnderecoLocadorSerializer()

    def validate_cpf(self, value):
        return limpar_documento(value)


class LocatarioSerializer(serializers.Serializer):
    nome_completo = serializers.CharField(max_length=200)
    nacionalidade = serializers.CharField(max_length=50)
    profissao = serializers.CharField(max_length=100)
    cpf = serializers.CharField(max_length=14, validators=[validar_cpf])
    rg = serializers.CharField(max_length=20, validators=[validarRg])
    rg_orgao = serializers.CharField(max_length=20)
    endereco_completo = serializers.CharField(max_length=300)
    telefone = serializers.CharField(max_length=20, validators=[validarTelefone])
    email = serializers.EmailField()

    def validate_cpf(self, value):
        return limpar_documento(value)


class ContratoDetalheSerializer(serializers.Serializer):
    data_inicio = serializers.DateField()
    valor_caucao = serializers.DecimalField(max_digits=10, decimal_places=2)
    clausula_segunda = serializers.CharField(min_length=50, max_length=5000)

    def validate_valor_caucao(self, value):
        if value <= 0:
            raise serializers.ValidationError("Valor deve ser positivo")
        if value > 999999.99:
            raise serializers.ValidationError("Valor máximo excedido")
        return value


class ContratoSerializer(serializers.Serializer):
    locador = LocadorSerializer()
    locatario = LocatarioSerializer()
    contrato = ContratoDetalheSerializer()
    inventario_moveis = serializers.CharField(min_length=20, max_length=2000)
```

---

#### 2.2.4 Validators - Validadores Customizados

**Localização**: `aptos/contratos/validators.py`

```python
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validarRg(value):
    if not value:
        raise ValidationError(_('RG é obrigatório'))

    rg_limpo = re.sub(r'[^0-9X]', '', value.upper())

    if len(rg_limpo) < 5 or len(rg_limpo) > 15:
        raise ValidationError(_('RG deve ter entre 5 e 15 caracteres'))

    return value


def validarTelefone(value):
    if not value:
        raise ValidationError(_('Telefone é obrigatório'))

    pattern = r'^\(\d{2}\) \d{5}-\d{4}$'

    if not re.match(pattern, value):
        raise ValidationError(_('Formato inválido. Use: (XX) XXXXX-XXXX'))

    return value


def validarCep(value):
    if not value:
        raise ValidationError(_('CEP é obrigatório'))

    pattern = r'^\d{5}-\d{3}$'

    if not re.match(pattern, value):
        raise ValidationError(_('Formato inválido. Use: XXXXX-XXX'))

    return value
```

---

#### 2.2.5 Permissions - IsSuperAdminUser

**Localização**: `aptos/contratos/permissions.py`

```python
from rest_framework.permissions import BasePermission


class IsSuperAdminUser(BasePermission):
    message = "Apenas super administradores podem gerar contratos."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_superuser
        )
```

---

#### 2.2.6 PDF Generator - Geração de PDF

**Localização**: `aptos/contratos/pdf_generator.py`

```python
from weasyprint import HTML, CSS
from django.template.loader import render_to_string
from django.conf import settings
from datetime import datetime
import os


def gerarContratoPdf(dados):
    contexto = prepararContexto(dados)

    html_string = render_to_string(
        'contratos/contrato_locacao.html',
        contexto
    )

    css_path = os.path.join(settings.BASE_DIR, 'aptos/contratos/templates/contratos/contrato_styles.css')

    html = HTML(string=html_string)
    css = CSS(filename=css_path)

    pdf_bytes = html.write_pdf(stylesheets=[css])

    return pdf_bytes


def prepararContexto(dados):
    locador = dados['locador']
    locatario = dados['locatario']
    contrato = dados['contrato']
    inventario = dados['inventario_moveis']

    data_inicio_formatada = formatarDataPorExtenso(contrato['data_inicio'])
    valor_caucao_formatado = formatarValorBrl(contrato['valor_caucao'])
    valor_caucao_extenso = numeroParaExtenso(contrato['valor_caucao'])

    return {
        'locador': {
            'nome_completo': locador['nome_completo'].upper(),
            'nacionalidade': locador['nacionalidade'],
            'estado_civil': locador['estado_civil'],
            'profissao': locador['profissao'],
            'cpf': formatarCpf(locador['cpf']),
            'endereco_completo': formatarEnderecoCompleto(locador['endereco']),
        },
        'locatario': {
            'nome_completo': locatario['nome_completo'].upper(),
            'nacionalidade': locatario['nacionalidade'],
            'profissao': locatario['profissao'],
            'cpf': formatarCpf(locatario['cpf']),
            'rg': f"{locatario['rg']} {locatario['rg_orgao']}",
            'endereco_completo': locatario['endereco_completo'],
            'telefone': locatario['telefone'],
            'email': locatario['email'],
        },
        'contrato': {
            'data_inicio': data_inicio_formatada,
            'valor_caucao': valor_caucao_formatado,
            'valor_caucao_extenso': valor_caucao_extenso,
            'clausula_segunda': contrato['clausula_segunda'],
        },
        'inventario_moveis': inventario,
        'data_geracao': datetime.now().strftime('%d/%m/%Y'),
    }


def formatarDataPorExtenso(data):
    meses = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ]
    return f"{data.day} de {meses[data.month - 1]} de {data.year}"


def formatarValorBrl(valor):
    return f"R$ {valor:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')


def formatarCpf(cpf):
    cpf_limpo = cpf.replace('.', '').replace('-', '')
    return f"{cpf_limpo[:3]}.{cpf_limpo[3:6]}.{cpf_limpo[6:9]}-{cpf_limpo[9:]}"


def formatarEnderecoCompleto(endereco):
    return (
        f"{endereco['rua']}, {endereco['numero']}, "
        f"{endereco['bairro']}, {endereco['cidade']}-{endereco['estado']}, "
        f"CEP {endereco['cep']}"
    )


def numeroParaExtenso(valor):
    from num2words import num2words
    reais = int(valor)
    centavos = int((valor - reais) * 100)

    extenso_reais = num2words(reais, lang='pt_BR')

    if centavos > 0:
        extenso_centavos = num2words(centavos, lang='pt_BR')
        return f"{extenso_reais} reais e {extenso_centavos} centavos"
    else:
        return f"{extenso_reais} reais"
```

---

#### 2.2.7 Template HTML do Contrato

**Localização**: `aptos/contratos/templates/contratos/contrato_locacao.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Contrato de Locação Residencial</title>
</head>
<body>
    <!-- PÁGINA 1 -->
    <div class="page">
        <h1>CONTRATO DE LOCAÇÃO RESIDENCIAL</h1>

        <section class="clausula">
            <p><strong>LOCADOR:</strong> {{ locador.nome_completo }}, {{ locador.nacionalidade }},
            {{ locador.estado_civil }}, {{ locador.profissao }}, inscrito no CPF sob o nº {{ locador.cpf }},
            residente e domiciliado em {{ locador.endereco_completo }}.</p>
        </section>

        <section class="clausula">
            <p><strong>LOCATÁRIO:</strong> {{ locatario.nome_completo }}, {{ locatario.nacionalidade }},
            {{ locatario.profissao }}, inscrito no CPF sob o nº {{ locatario.cpf }}, portador do RG nº {{ locatario.rg }},
            residente e domiciliado em {{ locatario.endereco_completo }},
            telefone {{ locatario.telefone }}, email {{ locatario.email }}.</p>
        </section>

        <section class="clausula">
            <p><strong>DO OBJETO:</strong> O presente contrato tem por objeto a locação do imóvel residencial
            situado em {{ locador.endereco_completo }}, doravante denominado simplesmente "IMÓVEL".</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA PRIMEIRA - DO PRAZO</h3>
            <p>O prazo de locação é de 12 (doze) meses, com início em {{ contrato.data_inicio }},
            renovável automaticamente por iguais períodos, salvo manifestação em contrário de qualquer das partes,
            com antecedência mínima de 30 (trinta) dias.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO</h3>
            <p>{{ contrato.clausula_segunda }}</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA TERCEIRA - DA CAUÇÃO</h3>
            <p>O LOCATÁRIO entregará ao LOCADOR, neste ato, a título de caução, a quantia de
            {{ contrato.valor_caucao }} ({{ contrato.valor_caucao_extenso }}),
            que será devolvida ao término do contrato, mediante a comprovação de quitação de todas as despesas
            e da entrega do imóvel nas mesmas condições em que foi recebido.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA QUARTA - DAS OBRIGAÇÕES DO LOCATÁRIO</h3>
            <p>São obrigações do LOCATÁRIO:</p>
            <ol>
                <li>Pagar pontualmente o aluguel até o dia estipulado;</li>
                <li>Pagar as despesas de consumo de água, luz, gás e condomínio, se houver;</li>
                <li>Manter o imóvel em perfeito estado de conservação;</li>
                <li>Não promover alterações ou benfeitorias sem autorização prévia do LOCADOR;</li>
                <li>Permitir vistorias do LOCADOR mediante agendamento prévio;</li>
                <li>Respeitar o regimento interno do edifício;</li>
                <li>Devolver o imóvel nas mesmas condições em que o recebeu.</li>
            </ol>
        </section>
    </div>

    <!-- PÁGINA 2 -->
    <div class="page">
        <section class="clausula">
            <h3>CLÁUSULA QUINTA - DAS OBRIGAÇÕES DO LOCADOR</h3>
            <p>São obrigações do LOCADOR:</p>
            <ol>
                <li>Entregar o imóvel em perfeitas condições de uso;</li>
                <li>Garantir ao LOCATÁRIO o uso pacífico do imóvel;</li>
                <li>Realizar reparos estruturais necessários à conservação do imóvel;</li>
                <li>Respeitar o direito de preferência do LOCATÁRIO na renovação do contrato.</li>
            </ol>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA SEXTA - DO REAJUSTE</h3>
            <p>O valor do aluguel será reajustado anualmente pela variação do Índice Geral de Preços
            do Mercado (IGPM) acumulado nos últimos 12 (doze) meses, ou outro índice que venha a substituí-lo.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA SÉTIMA - DA RESCISÃO</h3>
            <p>O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação
            prévia de 30 (trinta) dias, ficando o LOCATÁRIO obrigado ao pagamento proporcional do aluguel
            até a data da efetiva desocupação.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA OITAVA - DA MULTA</h3>
            <p>Em caso de atraso no pagamento do aluguel, será aplicada multa de 1% (um por cento) ao dia,
            até o limite de 20% (vinte por cento), acrescida de juros de mora de 1% (um por cento) ao mês.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA NONA - DO INVENTÁRIO DE MÓVEIS</h3>
            <p>O IMÓVEL é entregue ao LOCATÁRIO com os seguintes móveis e utensílios:</p>
            <p>{{ inventario_moveis }}</p>
        </section>
    </div>

    <!-- PÁGINA 3 -->
    <div class="page">
        <section class="clausula">
            <h3>CLÁUSULA DÉCIMA - DA VISTORIA INICIAL</h3>
            <p>O LOCATÁRIO declara ter vistoriado o imóvel e seus equipamentos, recebendo-os em perfeitas
            condições de uso e habitabilidade, comprometendo-se a devolvê-los no mesmo estado.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA DÉCIMA PRIMEIRA - DA SUBLOCAÇÃO</h3>
            <p>É vedada a sublocação total ou parcial do imóvel sem autorização expressa do LOCADOR.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA DÉCIMA SEGUNDA - DA CESSÃO</h3>
            <p>É vedada a cessão deste contrato a terceiros sem anuência do LOCADOR.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA DÉCIMA TERCEIRA - DO FORO</h3>
            <p>As partes elegem o foro da Comarca de {{ locador.endereco_completo.split(',')[-2].strip().split('-')[0].strip() }}
            para dirimir quaisquer dúvidas ou controvérsias oriundas deste contrato,
            com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA DÉCIMA QUARTA - DA VIGÊNCIA</h3>
            <p>Este contrato entra em vigor na data de {{ contrato.data_inicio }}.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA DÉCIMA QUINTA - DAS DISPOSIÇÕES GERAIS</h3>
            <p>O LOCATÁRIO declara conhecer e aceitar o regimento interno do edifício, comprometendo-se
            a cumpri-lo integralmente.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA DÉCIMA SEXTA - DA RESPONSABILIDADE CIVIL</h3>
            <p>O LOCATÁRIO é responsável por quaisquer danos causados ao imóvel ou a terceiros durante
            o período de locação.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA DÉCIMA SÉTIMA - DA ENTREGA DO IMÓVEL</h3>
            <p>Ao término do contrato, o LOCATÁRIO deverá devolver o imóvel limpo e em perfeito estado de conservação,
            respondendo por eventuais danos além do desgaste natural.</p>
        </section>

        <section class="clausula">
            <h3>CLÁUSULA DÉCIMA OITAVA - DA ACEITAÇÃO</h3>
            <p>E, por estarem justas e contratadas, as partes assinam o presente instrumento em 02 (duas) vias
            de igual teor e forma, na presença de duas testemunhas.</p>
        </section>

        <div class="assinaturas">
            <p>{{ locador.endereco_completo.split(',')[-2].strip().split('-')[0].strip() }},
            {{ data_geracao }}</p>

            <div class="assinatura-bloco">
                <p>_______________________________________</p>
                <p><strong>LOCADOR</strong></p>
                <p>{{ locador.nome_completo }}</p>
            </div>

            <div class="assinatura-bloco">
                <p>_______________________________________</p>
                <p><strong>LOCATÁRIO</strong></p>
                <p>{{ locatario.nome_completo }}</p>
            </div>

            <div class="testemunhas">
                <p><strong>TESTEMUNHAS:</strong></p>
                <div class="testemunha">
                    <p>_______________________________________</p>
                    <p>Nome: _________________________________</p>
                    <p>CPF: __________________________________</p>
                </div>
                <div class="testemunha">
                    <p>_______________________________________</p>
                    <p>Nome: _________________________________</p>
                    <p>CPF: __________________________________</p>
                </div>
            </div>
        </div>
    </div>

    <!-- PÁGINA 4 - REGIMENTO INTERNO -->
    <div class="page">
        <h2>REGIMENTO INTERNO</h2>

        <section class="regimento">
            <h3>ARTIGO 1º - DA FINALIDADE</h3>
            <p>O presente regimento estabelece as normas de convivência e boa conduta que deverão ser
            observadas por todos os moradores e visitantes do edifício.</p>
        </section>

        <section class="regimento">
            <h3>ARTIGO 2º - DO HORÁRIO DE SILÊNCIO</h3>
            <p>Deverá ser observado rigoroso silêncio no período das 22h às 8h, evitando-se ruídos
            que perturbem o sossego dos demais moradores.</p>
        </section>

        <section class="regimento">
            <h3>ARTIGO 3º - DO USO DAS ÁREAS COMUNS</h3>
            <p>As áreas comuns (salão de festas, churrasqueira, playground) deverão ser utilizadas
            com respeito e conservação, sendo de responsabilidade do usuário a limpeza após o uso.</p>
        </section>

        <section class="regimento">
            <h3>ARTIGO 4º - DOS ANIMAIS DOMÉSTICOS</h3>
            <p>É permitida a permanência de animais domésticos de pequeno porte, desde que não causem
            incômodo aos demais moradores e sejam conduzidos presos nas áreas comuns.</p>
        </section>

        <section class="regimento">
            <h3>ARTIGO 5º - DAS REFORMAS</h3>
            <p>Quaisquer obras ou reformas deverão ser previamente comunicadas ao síndico/administração,
            respeitando-se os horários permitidos (8h às 18h, de segunda a sexta-feira).</p>
        </section>

        <section class="regimento">
            <h3>ARTIGO 6º - DA SEGURANÇA</h3>
            <p>Visitantes deverão ser anunciados pelo morador e registrados na portaria.
            É proibido o acesso de vendedores ambulantes sem autorização.</p>
        </section>

        <section class="regimento">
            <h3>ARTIGO 7º - DO DESCARTE DE LIXO</h3>
            <p>O lixo deverá ser acondicionado em sacos plásticos fechados e depositado nos locais
            apropriados, respeitando-se os horários de coleta.</p>
        </section>

        <section class="regimento">
            <h3>ARTIGO 8º - DAS PENALIDADES</h3>
            <p>O descumprimento deste regimento sujeitará o infrator às sanções previstas em lei,
            incluindo advertência, multa e, em casos graves, rescisão contratual.</p>
        </section>

        <section class="regimento">
            <h3>ARTIGO 9º - DAS DISPOSIÇÕES FINAIS</h3>
            <p>Os casos omissos serão resolvidos pelo síndico/administração, com possível convocação
            de assembleia extraordinária.</p>
        </section>
    </div>
</body>
</html>
```

---

#### 2.2.8 CSS do Template

**Localização**: `aptos/contratos/templates/contratos/contrato_styles.css`

```css
@page {
    size: A4;
    margin: 2cm 2.5cm;
}

body {
    font-family: 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
}

h1 {
    text-align: center;
    font-size: 16pt;
    font-weight: bold;
    margin-bottom: 1.5cm;
    text-transform: uppercase;
}

h2 {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    margin-top: 1cm;
    margin-bottom: 1cm;
}

h3 {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 0.5cm;
    margin-bottom: 0.3cm;
}

.page {
    page-break-after: always;
}

.page:last-child {
    page-break-after: avoid;
}

.clausula {
    text-align: justify;
    margin-bottom: 0.8cm;
}

.clausula p {
    margin: 0.3cm 0;
}

.clausula ol {
    margin-left: 1cm;
    margin-top: 0.3cm;
}

.clausula ol li {
    margin-bottom: 0.2cm;
}

.assinaturas {
    margin-top: 2cm;
}

.assinatura-bloco {
    margin-top: 1.5cm;
    text-align: center;
}

.assinatura-bloco p {
    margin: 0.2cm 0;
}

.testemunhas {
    margin-top: 2cm;
}

.testemunha {
    margin-top: 1cm;
}

.testemunha p {
    margin: 0.2cm 0;
}

.regimento {
    margin-bottom: 0.8cm;
    text-align: justify;
}

.regimento h3 {
    font-size: 11pt;
    font-weight: bold;
}

.regimento p {
    margin: 0.3cm 0;
}
```

---

## 3. Especificação de API

### 3.1 Endpoint de Geração de Contrato

**Método**: `POST`
**Path**: `/api/v1/contratos/gerar/`
**Autenticação**: Django Session Authentication
**Permissões**: `is_superuser` obrigatório

---

### 3.2 Request Payload

**Content-Type**: `application/json`

**Schema JSON**:
```json
{
  "locador": {
    "nome_completo": "string (max 200)",
    "nacionalidade": "string (max 50)",
    "estado_civil": "string (max 30)",
    "profissao": "string (max 100)",
    "cpf": "string (formato XXX.XXX.XXX-XX)",
    "endereco": {
      "rua": "string (max 200)",
      "numero": "string (max 20)",
      "bairro": "string (max 100)",
      "cidade": "string (max 100)",
      "estado": "string (2 chars - UF)",
      "cep": "string (formato XXXXX-XXX)"
    }
  },
  "locatario": {
    "nome_completo": "string (max 200)",
    "nacionalidade": "string (max 50)",
    "profissao": "string (max 100)",
    "cpf": "string (formato XXX.XXX.XXX-XX)",
    "rg": "string (max 20)",
    "rg_orgao": "string (max 20)",
    "endereco_completo": "string (max 300)",
    "telefone": "string (formato (XX) XXXXX-XXXX)",
    "email": "string (email válido)"
  },
  "contrato": {
    "data_inicio": "date (YYYY-MM-DD)",
    "valor_caucao": "decimal (max 999999.99)",
    "clausula_segunda": "string (min 50, max 5000)"
  },
  "inventario_moveis": "string (min 20, max 2000)"
}
```

**Exemplo de Request**:
```json
{
  "locador": {
    "nome_completo": "ALEXSANDER VIEIRA",
    "nacionalidade": "brasileiro",
    "estado_civil": "casado",
    "profissao": "analista de sistemas",
    "cpf": "908.833.149-91",
    "endereco": {
      "rua": "Rua Bento Gonçalves",
      "numero": "183",
      "bairro": "Centro",
      "cidade": "Florianópolis",
      "estado": "SC",
      "cep": "88010-080"
    }
  },
  "locatario": {
    "nome_completo": "FELIPE NASCIMENTO TELES DE FREITAS",
    "nacionalidade": "brasileiro",
    "profissao": "assistente de infraestrutura",
    "cpf": "063.857.409-94",
    "rg": "6.505.0271",
    "rg_orgao": "SSP/SC",
    "endereco_completo": "Avenida Max Schramm, 2700, CEP 88095-000, Florianópolis - SC",
    "telefone": "(48) 99811-3393",
    "email": "f.n.t.freitas@gmail.com"
  },
  "contrato": {
    "data_inicio": "2025-08-05",
    "valor_caucao": 1700.00,
    "clausula_segunda": "O aluguel convencionado é de R$ 1.700,00 mensais, devendo ser pago até o dia dez do mês vincendo, mediante depósito bancário ou transferência PIX para a conta corrente do LOCADOR."
  },
  "inventario_moveis": "armário de pia com tampo em granito, guarda-roupa de 4 portas, fogão elétrico Fischer duas bocas, geladeira Consul 280L, mesa de jantar com 4 cadeiras, sofá 3 lugares."
}
```

---

### 3.3 Response - Sucesso

**Status Code**: `200 OK`
**Content-Type**: `application/pdf`
**Headers**:
```
Content-Disposition: attachment; filename="contrato_locacao_06385740994_2025-08-05.pdf"
Content-Length: <tamanho_em_bytes>
```

**Body**: Stream binário do PDF (4 páginas, ~150-200KB)

---

### 3.4 Response - Erro de Validação

**Status Code**: `400 Bad Request`
**Content-Type**: `application/json`

**Exemplo**:
```json
{
  "errors": {
    "locador": {
      "cpf": ["CPF inválido"]
    },
    "contrato": {
      "clausula_segunda": ["Campo obrigatório, mínimo 50 caracteres"],
      "valor_caucao": ["Valor deve ser positivo"]
    }
  }
}
```

---

### 3.5 Response - Erro de Permissão

**Status Code**: `403 Forbidden`
**Content-Type**: `application/json`

**Exemplo**:
```json
{
  "detail": "Apenas super administradores podem gerar contratos."
}
```

---

### 3.6 Response - Erro Interno

**Status Code**: `500 Internal Server Error`
**Content-Type**: `application/json`

**Exemplo**:
```json
{
  "detail": "Erro interno ao gerar contrato. Tente novamente."
}
```

---

## 4. Modelos de Dados

### 4.1 Tipos TypeScript (Frontend)

**Localização**: `/frontend/src/types/contrato.ts`

```typescript
export interface EnderecoLocador {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface DadosLocador {
  nomeCompleto: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  cpf: string;
  endereco: EnderecoLocador;
}

export interface DadosLocatario {
  nomeCompleto: string;
  nacionalidade: string;
  profissao: string;
  cpf: string;
  rg: string;
  rgOrgao: string;
  enderecoCompleto: string;
  telefone: string;
  email: string;
}

export interface DetalhesContrato {
  dataInicio: string;
  valorCaucao: number;
  clausulaSegunda: string;
}

export interface ContratoFormData {
  locador: DadosLocador;
  locatario: DadosLocatario;
  contrato: DetalhesContrato;
  inventarioMoveis: string;
}
```

---

### 4.2 Transformações de Dados

**Frontend → Backend** (camelCase → snake_case):
```typescript
// Ver função transformarParaPayload no hook useGerarContrato
```

**Backend → PDF** (snake_case → contexto HTML):
```python
# Ver função prepararContexto em pdf_generator.py
```

---

## 5. Validações

### 5.1 Validações Frontend (Yup)

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| `locador.nomeCompleto` | required, max 200 | "Campo obrigatório" |
| `locador.cpf` | required, regex, validarCpf() | "CPF inválido" |
| `locador.endereco.cep` | required, regex `^\d{5}-\d{3}$` | "Formato inválido: XXXXX-XXX" |
| `locatario.cpf` | required, regex, validarCpf() | "CPF inválido" |
| `locatario.telefone` | required, regex `^\(\d{2}\) \d{5}-\d{4}$` | "Formato inválido: (XX) XXXXX-XXXX" |
| `locatario.email` | required, email() | "Email inválido" |
| `contrato.dataInicio` | required, min(today) | "Data deve ser futura" |
| `contrato.valorCaucao` | required, positive, max 999999.99 | "Valor inválido" |
| `contrato.clausulaSegunda` | required, min 50, max 5000 | "Mínimo 50 caracteres" |
| `inventarioMoveis` | required, min 20, max 2000 | "Mínimo 20 caracteres" |

---

### 5.2 Validações Backend (Django Serializers)

Todas as validações do frontend são replicadas no backend via:
- `ContratoSerializer` e serializers aninhados
- Validadores customizados em `validators.py`
- Validadores reutilizados de `aptos/validators.py` (CPF)

---

### 5.3 Validador de CPF (Reutilizado)

```typescript
// Frontend: /frontend/src/utils/validadores.ts
export function validarCpf(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');

  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo[i]) * (10 - i);
  }
  let resto = soma % 11;
  const dv1 = resto < 2 ? 0 : 11 - resto;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo[i]) * (11 - i);
  }
  resto = soma % 11;
  const dv2 = resto < 2 ? 0 : 11 - resto;

  return cpfLimpo.slice(-2) === `${dv1}${dv2}`;
}
```

---

## 6. Segurança

### 6.1 Autenticação e Autorização

1. **Autenticação**: Django Session Authentication (já existente)
2. **Autorização**: Permission class `IsSuperAdminUser`
3. **Frontend**: Verificar `user.is_superuser` antes de renderizar botão
4. **Backend**: Validar `request.user.is_superuser` em todas as requisições

---

### 6.2 Sanitização de Inputs

- **XSS**: Django Template Engine escapa automaticamente variáveis
- **SQL Injection**: Django ORM protege (sem queries customizadas)
- **CSRF**: Django CSRF middleware ativado (cookies HTTP-only)

---

### 6.3 Dados Sensíveis (LGPD)

**CPF/RG/Email** são dados pessoais sensíveis:

1. **Logs**: Apenas hash SHA-256 dos CPFs
   ```python
   import hashlib
   cpf_hash = hashlib.sha256(cpf.encode()).hexdigest()[:8]
   logger.info(f"Contrato gerado para CPF hash {cpf_hash}")
   ```

2. **HTTPS**: Obrigatório em produção (nginx com TLS)

3. **Não persistir PDFs**: Contratos gerados apenas sob demanda (não salvar no BD)

---

### 6.4 CORS e Headers de Segurança

- **CORS**: Django-CORS-Headers já configurado
- **Content-Security-Policy**: Configurar em nginx (produção)
- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY`

---

## 7. Testes

### 7.1 Cobertura Alvo

**Meta**: 85% de cobertura mínima (conforme rules/review.md)

---

### 7.2 Testes Frontend (Vitest)

**Localização**: `/frontend/src/components/contratos/__tests__/`

#### 7.2.1 GerarContratoButton.test.tsx

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GerarContratoButton } from '../GerarContratoButton';

describe('GerarContratoButton', () => {
  it('renderiza botão quando usuário é superuser', () => {
    const mockOpenModal = vi.fn();
    render(<GerarContratoButton onOpenModal={mockOpenModal} />);

    const button = screen.getByRole('button', { name: /gerar contrato/i });
    expect(button).toBeInTheDocument();
  });

  it('chama onOpenModal ao clicar', async () => {
    const mockOpenModal = vi.fn();
    render(<GerarContratoButton onOpenModal={mockOpenModal} />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(mockOpenModal).toHaveBeenCalledTimes(1);
  });
});
```

---

#### 7.2.2 FormularioContrato.test.tsx

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormularioContrato } from '../FormularioContrato';

describe('FormularioContrato', () => {
  it('exibe erros de validação para campos vazios', async () => {
    const mockSubmit = vi.fn();
    render(<FormularioContrato onSubmit={mockSubmit} onCancel={vi.fn()} loading={false} />);

    const submitButton = screen.getByRole('button', { name: /gerar contrato/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('valida CPF inválido', async () => {
    render(<FormularioContrato onSubmit={vi.fn()} onCancel={vi.fn()} loading={false} />);

    const cpfInput = screen.getByLabelText(/cpf/i);
    await userEvent.type(cpfInput, '111.111.111-11');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText('CPF inválido')).toBeInTheDocument();
    });
  });

  it('submete formulário com dados válidos', async () => {
    const mockSubmit = vi.fn();
    render(<FormularioContrato onSubmit={mockSubmit} onCancel={vi.fn()} loading={false} />);

    // Preencher todos os campos com dados válidos
    await userEvent.type(screen.getByLabelText(/nome completo/i), 'João Silva');
    await userEvent.type(screen.getByLabelText(/cpf/i), '908.833.149-91');
    // ... (outros campos)

    const submitButton = screen.getByRole('button', { name: /gerar contrato/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        locador: expect.objectContaining({
          nomeCompleto: 'João Silva',
          cpf: '908.833.149-91'
        })
      }));
    });
  });
});
```

---

#### 7.2.3 useGerarContrato.test.ts

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useGerarContrato } from '../useGerarContrato';
import axios from 'axios';

vi.mock('axios');

describe('useGerarContrato', () => {
  it('gera contrato com sucesso', async () => {
    const mockPdfBlob = new Blob(['PDF content'], { type: 'application/pdf' });
    (axios.post as any).mockResolvedValue({ status: 200, data: mockPdfBlob });

    const { result } = renderHook(() => useGerarContrato());

    const pdfBlob = await result.current.gerarContrato(mockFormData);

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('trata erro 403 (permissão negada)', async () => {
    (axios.post as any).mockRejectedValue({
      response: { status: 403, data: { detail: 'Permissão negada' } }
    });

    const { result } = renderHook(() => useGerarContrato());

    await expect(result.current.gerarContrato(mockFormData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe('Permissão negada');
    });
  });
});
```

---

### 7.3 Testes Backend (pytest-django)

**Localização**: `/aptos/contratos/tests/`

#### 7.3.1 test_views.py

```python
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestGerarContratoView:

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def superuser(self):
        return User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='admin123'
        )

    @pytest.fixture
    def normal_user(self):
        return User.objects.create_user(
            username='user',
            email='user@test.com',
            password='user123'
        )

    @pytest.fixture
    def payload_valido(self):
        return {
            "locador": {
                "nome_completo": "ALEXSANDER VIEIRA",
                "nacionalidade": "brasileiro",
                "estado_civil": "casado",
                "profissao": "analista de sistemas",
                "cpf": "908.833.149-91",
                "endereco": {
                    "rua": "Rua Bento Gonçalves",
                    "numero": "183",
                    "bairro": "Centro",
                    "cidade": "Florianópolis",
                    "estado": "SC",
                    "cep": "88010-080"
                }
            },
            "locatario": {
                "nome_completo": "FELIPE NASCIMENTO",
                "nacionalidade": "brasileiro",
                "profissao": "assistente",
                "cpf": "063.857.409-94",
                "rg": "6.505.0271",
                "rg_orgao": "SSP/SC",
                "endereco_completo": "Av. Max Schramm, 2700, Florianópolis-SC",
                "telefone": "(48) 99811-3393",
                "email": "teste@test.com"
            },
            "contrato": {
                "data_inicio": "2025-08-05",
                "valor_caucao": 1700.00,
                "clausula_segunda": "O aluguel é de R$ 1.700,00 mensais" * 5
            },
            "inventario_moveis": "armário, guarda-roupa, fogão"
        }

    def test_gerar_contrato_sucesso(self, api_client, superuser, payload_valido):
        api_client.force_authenticate(user=superuser)
        url = reverse('gerar-contrato')

        response = api_client.post(url, payload_valido, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'application/pdf'
        assert 'contrato_locacao_' in response['Content-Disposition']
        assert len(response.content) > 1000  # PDF tem conteúdo

    def test_gerar_contrato_sem_autenticacao(self, api_client, payload_valido):
        url = reverse('gerar-contrato')

        response = api_client.post(url, payload_valido, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_gerar_contrato_usuario_normal(self, api_client, normal_user, payload_valido):
        api_client.force_authenticate(user=normal_user)
        url = reverse('gerar-contrato')

        response = api_client.post(url, payload_valido, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'super administradores' in response.data['detail'].lower()

    def test_gerar_contrato_cpf_invalido(self, api_client, superuser, payload_valido):
        api_client.force_authenticate(user=superuser)
        payload_valido['locador']['cpf'] = '111.111.111-11'
        url = reverse('gerar-contrato')

        response = api_client.post(url, payload_valido, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cpf' in response.data['errors']['locador']

    def test_gerar_contrato_campos_obrigatorios_faltando(self, api_client, superuser):
        api_client.force_authenticate(user=superuser)
        payload_incompleto = {"locador": {"nome_completo": "Test"}}
        url = reverse('gerar-contrato')

        response = api_client.post(url, payload_incompleto, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
```

---

#### 7.3.2 test_serializers.py

```python
import pytest
from aptos.contratos.serializers import ContratoSerializer


@pytest.mark.django_db
class TestContratoSerializer:

    def test_validacao_cpf_valido(self):
        data = {
            "locador": {
                "cpf": "908.833.149-91",
                # ... outros campos
            },
            # ... outros dados
        }

        serializer = ContratoSerializer(data=data)
        assert serializer.is_valid()

    def test_validacao_cpf_invalido(self):
        data = {
            "locador": {
                "cpf": "000.000.000-00",
                # ... outros campos
            }
        }

        serializer = ContratoSerializer(data=data)
        assert not serializer.is_valid()
        assert 'cpf' in serializer.errors['locador']

    def test_validacao_telefone_formato_invalido(self):
        data = {
            "locatario": {
                "telefone": "48999999999",  # Sem formatação
                # ... outros campos
            }
        }

        serializer = ContratoSerializer(data=data)
        assert not serializer.is_valid()

    def test_validacao_valor_caucao_negativo(self):
        data = {
            "contrato": {
                "valor_caucao": -100.00
            }
        }

        serializer = ContratoSerializer(data=data)
        assert not serializer.is_valid()
        assert 'valor_caucao' in serializer.errors['contrato']
```

---

#### 7.3.3 test_pdf_generator.py

```python
import pytest
from aptos.contratos.pdf_generator import gerarContratoPdf, prepararContexto
import pdfplumber


@pytest.mark.django_db
class TestPdfGenerator:

    @pytest.fixture
    def dados_validos(self):
        return {
            "locador": {
                "nome_completo": "ALEXSANDER VIEIRA",
                "cpf": "90883314991",
                "endereco": {
                    "rua": "Rua Bento Gonçalves",
                    "numero": "183",
                    "bairro": "Centro",
                    "cidade": "Florianópolis",
                    "estado": "SC",
                    "cep": "88010-080"
                }
            },
            "locatario": {
                "nome_completo": "FELIPE NASCIMENTO",
                "cpf": "06385740994"
            },
            "contrato": {
                "data_inicio": "2025-08-05",
                "valor_caucao": 1700.00
            }
        }

    def test_gerar_pdf_retorna_bytes(self, dados_validos):
        pdf_bytes = gerarContratoPdf(dados_validos)

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 1000
        assert pdf_bytes[:4] == b'%PDF'  # Header PDF

    def test_pdf_contem_4_paginas(self, dados_validos):
        pdf_bytes = gerarContratoPdf(dados_validos)

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            assert len(pdf.pages) == 4

    def test_pdf_contem_dados_locador(self, dados_validos):
        pdf_bytes = gerarContratoPdf(dados_validos)

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            texto_pagina1 = pdf.pages[0].extract_text()
            assert 'ALEXSANDER VIEIRA' in texto_pagina1
            assert '908.833.149-91' in texto_pagina1

    def test_preparar_contexto_formata_cpf(self, dados_validos):
        contexto = prepararContexto(dados_validos)

        assert contexto['locador']['cpf'] == '908.833.149-91'

    def test_preparar_contexto_formata_data_por_extenso(self, dados_validos):
        contexto = prepararContexto(dados_validos)

        assert 'agosto de 2025' in contexto['contrato']['data_inicio']
```

---

#### 7.3.4 test_validators.py

```python
import pytest
from django.core.exceptions import ValidationError
from aptos.contratos.validators import validarRg, validarTelefone, validarCep


class TestValidadores:

    def test_validar_rg_valido(self):
        assert validarRg('6.505.0271') == '6.505.0271'
        assert validarRg('1234567X') == '1234567X'

    def test_validar_rg_invalido_curto(self):
        with pytest.raises(ValidationError):
            validarRg('123')

    def test_validar_telefone_valido(self):
        assert validarTelefone('(48) 99811-3393')

    def test_validar_telefone_formato_invalido(self):
        with pytest.raises(ValidationError):
            validarTelefone('48999113393')

    def test_validar_cep_valido(self):
        assert validarCep('88010-080')

    def test_validar_cep_formato_invalido(self):
        with pytest.raises(ValidationError):
            validarCep('88010080')
```

---

### 7.4 Testes de Integração (E2E - Opcional)

**Ferramentas**: Playwright (desabilitado atualmente)

**Cenário**:
1. Login como superuser
2. Navegar para /inquilinos
3. Clicar "Gerar Contrato"
4. Preencher formulário completo
5. Clicar "Gerar Contrato"
6. Verificar download do PDF

---

## 8. Plano de Implementação

### 8.1 Fase 1: Setup e Estrutura Base (5 dias)

**Backend**:
- [ ] Criar estrutura de diretórios `aptos/contratos/`
- [ ] Configurar endpoint em `aptos/api_urls.py`
- [ ] Implementar `IsSuperAdminUser` permission
- [ ] Criar serializers básicos (sem validações customizadas)
- [ ] Implementar `GerarContratoView` (retornando mock PDF)
- [ ] Adicionar WeasyPrint ao `requirements.txt`
- [ ] Configurar Dockerfile para dependências WeasyPrint
- [ ] Testes unitários de permissões

**Frontend**:
- [ ] Criar estrutura de diretórios `/components/contratos/`
- [ ] Implementar `GerarContratoButton` (mock)
- [ ] Integrar botão em `InquilinosListPage`
- [ ] Criar tipos TypeScript básicos
- [ ] Testes do botão

**Critério de Conclusão**: Botão visível apenas para superusers, API endpoint responde 403 para não-superusers.

---

### 8.2 Fase 2: Formulário e Validações (7 dias)

**Backend**:
- [ ] Implementar validadores customizados (RG, telefone, CEP)
- [ ] Completar `ContratoSerializer` com todas as validações
- [ ] Testes de serializers (100% cobertura)
- [ ] Testes de validadores (casos válidos e inválidos)

**Frontend**:
- [ ] Implementar `GerarContratoModal` (container)
- [ ] Implementar `FormularioContrato` completo
- [ ] Configurar React Hook Form + Yup
- [ ] Implementar validador de CPF frontend
- [ ] Implementar máscaras de input (CPF, telefone, CEP)
- [ ] Testes de componentes de formulário
- [ ] Testes de validação (Yup schemas)

**Critério de Conclusão**: Formulário completo com validações client-side e backend, mensagens de erro claras.

---

### 8.3 Fase 3: Geração de PDF (10 dias)

**Backend**:
- [ ] Criar template HTML base (`contrato_locacao.html`)
- [ ] Criar CSS do contrato (`contrato_styles.css`)
- [ ] Implementar `pdf_generator.py` completo
- [ ] Implementar helpers de formatação (CPF, datas, valores BRL)
- [ ] Implementar conversão numérica para extenso (`num2words`)
- [ ] Ajustar template para 4 páginas (iteração incremental)
- [ ] Testes de geração (PDFs válidos, 4 páginas)
- [ ] Testes de conteúdo (extrair texto com pdfplumber)
- [ ] Ajustes visuais (comparação com contrato_padrao.pdf)

**Validações**:
- [ ] PDF gerado com exatamente 4 páginas
- [ ] Todos os campos variáveis preenchidos
- [ ] Formatação idêntica ao contrato_padrao.pdf
- [ ] Tamanho do PDF < 200KB

**Critério de Conclusão**: Endpoint gera PDF completo de 4 páginas com todos os campos preenchidos corretamente.

---

### 8.4 Fase 4: Integração Frontend-Backend (5 dias)

**Frontend**:
- [ ] Implementar `useGerarContrato` hook
- [ ] Conectar formulário ao endpoint
- [ ] Implementar loading states (spinner)
- [ ] Tratamento de erros (400, 403, 500)
- [ ] Implementar `ContratoSucessoModal`
- [ ] Funcionalidade de download (Blob URL)
- [ ] Funcionalidade de impressão (iframe)
- [ ] Testes do hook customizado
- [ ] Testes de integração (mock API)

**Backend**:
- [ ] Implementar logs de auditoria
- [ ] Ajustes de performance (caching de configs)
- [ ] Tratamento de erros robusto
- [ ] Monitoramento de tempo de geração

**Critério de Conclusão**: Fluxo end-to-end completo, usuário consegue gerar e baixar PDF.

---

### 8.5 Fase 5: Testes e Refinamento (5 dias)

**Backend**:
- [ ] Testes de integração (API completa)
- [ ] Testes de performance (tempo < 5s)
- [ ] Cobertura de testes >= 85%
- [ ] Code review interno
- [ ] Ajustes baseados em review

**Frontend**:
- [ ] Testes de componentes (cobertura >= 85%)
- [ ] Testes de acessibilidade (WCAG AA)
- [ ] Testes de responsividade (mobile/tablet/desktop)
- [ ] Ajustes de UX baseados em testes
- [ ] Code review interno

**Refinamentos**:
- [ ] Ajustes visuais no PDF
- [ ] Mensagens de erro mais claras
- [ ] Loading states otimizados
- [ ] Documentação inline (comentários)

**Critério de Conclusão**: Todos os testes passando, cobertura >= 85%, code review aprovado.

---

### 8.6 Fase 6: Deploy e Treinamento (3 dias)

**Deploy**:
- [ ] Build frontend com `make build-frontend`
- [ ] Deploy em staging (`make up`)
- [ ] Testes de aceitação com superusers (staging)
- [ ] Validação de performance (tempo de geração)
- [ ] Deploy em produção (`make up-prod`)
- [ ] Monitoramento de logs (primeiras 24h)

**Treinamento**:
- [ ] Criar documentação de usuário (passo a passo)
- [ ] Sessão de treinamento com superusers (30min)
- [ ] FAQ de dúvidas comuns
- [ ] Canal de suporte para feedback

**Critério de Conclusão**: Feature em produção, usuários treinados, monitoramento ativo.

---

### 8.7 Cronograma Resumido

| Fase | Duração | Entregável |
|------|---------|------------|
| Fase 1 | 5 dias | Estrutura base + endpoint mock |
| Fase 2 | 7 dias | Formulário completo com validações |
| Fase 3 | 10 dias | Geração de PDF programática |
| Fase 4 | 5 dias | Integração frontend-backend |
| Fase 5 | 5 dias | Testes e refinamento |
| Fase 6 | 3 dias | Deploy e treinamento |
| **TOTAL** | **35 dias** (~7 semanas) | Feature production-ready |

---

## 9. Riscos Técnicos e Mitigações

### 9.1 Risco: Complexidade da Geração de PDF

**Descrição**: Dificuldade em replicar formatação exata do contrato_padrao.pdf.

**Impacto**: Alto
**Probabilidade**: Média

**Mitigações**:
- Escolher WeasyPrint (HTML/CSS mais controlável que ReportLab)
- Criar template HTML iterativamente (comparação visual constante)
- Usar CSS print-specific (`@page`, margens, page-break)
- Testes visuais de snapshot (comparação de imagens)

---

### 9.2 Risco: Performance de Geração < 5s

**Descrição**: WeasyPrint pode ser lento para PDFs complexos.

**Impacto**: Médio
**Probabilidade**: Baixa

**Mitigações**:
- Otimizar template HTML (evitar imagens pesadas)
- Cachear configurações de PDF (fontes, CSS)
- Considerar geração assíncrona (Celery) se necessário
- Monitorar tempo médio em produção (p95 < 5s)

---

### 9.3 Risco: Validação de CPF/RG Incompleta

**Descrição**: Algoritmos de validação não cobrem todos os casos extremos.

**Impacto**: Baixo
**Probabilidade**: Baixa

**Mitigações**:
- Reutilizar validadores já testados em `aptos/validators.py`
- Testes abrangentes com casos válidos e inválidos
- Adicionar testes com CPFs conhecidos (válidos e inválidos)

---

### 9.4 Risco: Mudanças Legais no Contrato

**Descrição**: Lei de locações ou regimento interno mudarem após deploy.

**Impacto**: Alto
**Probabilidade**: Baixa

**Mitigações**:
- Template de PDF versionado em Git (rastreabilidade)
- Documentar fonte legal de cada cláusula (comentários no HTML)
- Revisão jurídica semestral
- Processo de atualização rápida (apenas editar HTML/CSS)

---

### 9.5 Risco: Adoção Baixa por Superusers

**Descrição**: Usuários continuarem gerando contratos manualmente.

**Impacto**: Alto
**Probabilidade**: Média

**Mitigações**:
- UX intuitiva e rápida (< 3 minutos de ponta a ponta)
- Treinamento presencial com demonstração
- Coletar feedback nas primeiras semanas
- Destacar economia de tempo (30min manual → 3min automatizado)

---

### 9.6 Risco: Formulário Muito Extenso

**Descrição**: Usuários abandonarem preenchimento (fadiga).

**Impacto**: Médio
**Probabilidade**: Média

**Mitigações**:
- Agrupar campos em seções visuais claras
- Progress bar visual (opcional)
- Salvar progresso em localStorage (v2)
- Placeholders com exemplos de formato

---

### 9.7 Risco: Mensagens de Erro Confusas

**Descrição**: Usuários não entenderem como corrigir erros.

**Impacto**: Médio
**Probabilidade**: Baixa

**Mitigações**:
- Mensagens de erro específicas e acionáveis
- Exemplos de formato correto em placeholders
- Validação em tempo real (on blur)
- Testes de usabilidade com superusers

---

### 9.8 Risco: LGPD - Vazamento de Dados Sensíveis

**Descrição**: CPF/RG/email expostos em logs ou erros.

**Impacto**: Alto
**Probabilidade**: Baixa

**Mitigações**:
- Sanitizar logs (hash SHA-256 de CPF)
- HTTPS obrigatório em produção
- Não persistir PDFs no BD
- Auditoria de segurança pré-deploy

---

## 10. Checklist de Aprovação

### 10.1 Requisitos Funcionais

- [ ] Super admin consegue gerar contrato completo em < 3 minutos
- [ ] PDF gerado possui exatamente 4 páginas
- [ ] Todos os campos variáveis preenchidos corretamente no PDF
- [ ] Regimento interno aparece idêntico ao contrato_padrao.pdf
- [ ] Valores monetários formatados como R$ X.XXX,XX
- [ ] Datas formatadas como "DD de mês_extenso de YYYY"
- [ ] Botão "Gerar Contrato" visível apenas para superusers
- [ ] Modal abre ao clicar no botão
- [ ] Formulário valida todos os campos obrigatórios
- [ ] Download automático do PDF após geração
- [ ] Opção de impressão disponível

---

### 10.2 Requisitos Não-Funcionais

- [ ] Tempo de geração de PDF < 5 segundos (p95)
- [ ] Tamanho do PDF < 200KB
- [ ] Modal responsivo (desktop/tablet/mobile)
- [ ] Acessibilidade WCAG AA (contraste, labels, navegação)
- [ ] HTTPS em produção
- [ ] Logs de auditoria com CPF hasheado

---

### 10.3 Segurança

- [ ] Endpoint valida `is_superuser` em todas as requisições
- [ ] Usuários não-superusers recebem 403 Forbidden
- [ ] Dados sensíveis não aparecem em logs públicos
- [ ] CSRF protection ativado
- [ ] Sanitização de inputs (XSS, SQL Injection)

---

### 10.4 Validação

- [ ] Sistema impede geração com campos obrigatórios vazios
- [ ] CPF validado com algoritmo de dígito verificador
- [ ] Email validado com regex padrão
- [ ] Telefone validado no formato brasileiro
- [ ] Mensagens de erro claras e específicas
- [ ] Validação frontend e backend consistentes

---

### 10.5 Qualidade de Código

- [ ] Cobertura de testes >= 85% (backend e frontend)
- [ ] Testes unitários passando (pytest + vitest)
- [ ] Linting sem erros (`ruff check .`)
- [ ] Type checking sem erros (`mypy .`)
- [ ] Code review aprovado
- [ ] Documentação inline (comentários claros)
- [ ] Seguir code-standards.md (camelCase, PascalCase, imports no topo)

---

### 10.6 Testes

- [ ] Testes de views (permissões, validações, geração)
- [ ] Testes de serializers (todos os campos)
- [ ] Testes de validadores (CPF, RG, telefone, CEP)
- [ ] Testes de PDF (4 páginas, conteúdo correto)
- [ ] Testes de componentes (formulário, modal, botão)
- [ ] Testes de hooks (useGerarContrato)
- [ ] Testes de integração (API mock)

---

### 10.7 Documentação

- [ ] Tech Spec completa e aprovada
- [ ] README atualizado com instruções de uso
- [ ] Documentação de usuário (passo a passo)
- [ ] Comentários no código explicando lógica complexa
- [ ] FAQ de dúvidas comuns

---

## 11. Decisões Técnicas Finais

### 11.1 Biblioteca de PDF

**Decisão**: **WeasyPrint**

**Justificativa**:
- Permite usar HTML/CSS (mais familiar para desenvolvedores frontend)
- Facilita manutenção e ajustes visuais
- Suporta CSS print-specific (`@page`, margens, page-break`)
- Boa documentação e comunidade ativa

**Alternativa considerada**: ReportLab (descartada por curva de aprendizado maior).

---

### 11.2 Estrutura de Endpoint

**Decisão**: `POST /api/v1/contratos/gerar/`

**Justificativa**:
- Mais flexível (não depende de inquilino existente no BD)
- Alinhado com funcionalidade de geração sob demanda
- Permite geração para inquilinos não cadastrados

**Alternativa considerada**: `/api/v1/inquilinos/{id}/gerar-contrato/` (descartada por limitação).

---

### 11.3 Formato de Resposta

**Decisão**: Binary response (PDF stream)

**Justificativa**:
- Download imediato (sem etapa extra de fetch)
- Não requer armazenamento temporário
- Mais seguro (PDF não fica acessível via URL pública)

**Alternativa considerada**: URL temporária (descartada por complexidade adicional).

---

### 11.4 Validação de CEP

**Decisão**: Apenas validação de formato (XXXXX-XXX)

**Justificativa**:
- Evita dependência de API externa (Correios)
- API dos Correios pode estar indisponível
- Formato suficiente para gerar contrato válido

**Alternativa considerada**: Integração com ViaCEP (adiada para v2).

---

### 11.5 Persistência de Contratos

**Decisão**: **NÃO** persistir PDFs no banco de dados

**Justificativa**:
- PRD explicitamente exclui persistência (seção 4, Nao-Objetivos)
- Geração sob demanda suficiente para v1
- Reduz complexidade e requisitos de storage

**Alternativa considerada**: Model `Contrato` (adiada para Fase 2 - roadmap).

---

### 11.6 Logs de Auditoria

**Decisão**: Logger do Django + hash SHA-256 de CPF

**Justificativa**:
- Rastreabilidade sem expor dados sensíveis
- Conformidade com LGPD
- Integração nativa com infraestrutura existente

**Formato do log**:
```python
logger.info(
    f"Contrato gerado por {user.username} para CPF hash {cpf_hash}",
    extra={'user_id': user.id, 'cpf_hash': cpf_hash}
)
```

---

## 12. Dependências e Bibliotecas

### 12.1 Backend (Python)

**Adicionar a `requirements.txt`**:
```
WeasyPrint==63.1
num2words==0.5.13
pdfplumber==0.11.4  # Para testes
```

**Dependências do sistema (Dockerfile)**:
```dockerfile
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*
```

---

### 12.2 Frontend (React/TypeScript)

**Já instaladas** (package.json):
- `react-hook-form@^7.63.0`
- `yup@^1.7.1`
- `axios@1.7.0`

**Não requer novas dependências** (reutilizar existentes).

---

## 13. Observabilidade e Monitoramento

### 13.1 Métricas de Aplicação

**Coletar via logs**:
- Tempo médio de geração de PDF (p50, p95, p99)
- Taxa de sucesso/erro de geração
- Quantidade de contratos gerados por dia/semana

**Implementação**:
```python
import time

inicio = time.time()
pdf_bytes = gerarContratoPdf(dados)
tempo_geracao = time.time() - inicio

logger.info(
    f"PDF gerado em {tempo_geracao:.2f}s",
    extra={'tempo_geracao': tempo_geracao}
)
```

---

### 13.2 Alertas

**Configurar alertas** (Prometheus/Grafana se disponível):
- Tempo de geração > 10s (alerta crítico)
- Taxa de erro > 5% (alerta warning)
- Pico de requisições (> 10 simultâneas)

---

### 13.3 Logs de Erro

**Capturar exceções**:
```python
try:
    pdf_bytes = gerarContratoPdf(dados)
except Exception as e:
    logger.error(
        f"Erro ao gerar PDF: {str(e)}",
        exc_info=True,
        extra={'user_id': request.user.id}
    )
    raise
```

---

## 14. Considerações Futuras (Roadmap)

### 14.1 Fase 2: Persistência de Contratos (Q1 2026)

- Model `Contrato` com campos: `id`, `inquilino_fk`, `pdf_file`, `data_geracao`, `usuario_gerador_fk`
- Histórico de contratos por inquilino
- Listagem de contratos gerados

---

### 14.2 Fase 3: Assinatura Eletrônica (Q2 2026)

- Integração com DocuSign ou ClickSign
- Fluxo de assinatura digital
- Status de assinatura (pendente/assinado)

---

### 14.3 Fase 4: Templates Múltiplos (Q3 2026)

- Template de contrato comercial
- Template de contrato temporada
- Seleção de template no formulário

---

### 14.4 Fase 5: Geração de Aditivos (Q4 2026)

- Aditivo de reajuste de aluguel
- Aditivo de renovação
- Aditivo de alteração de cláusula

---

## 15. Aprovações Necessárias

**Stakeholders**:
- [ ] Product Owner (aprovação do PRD)
- [ ] Tech Lead (aprovação da Tech Spec)
- [ ] Jurídico (revisão do template de contrato)
- [ ] Segurança (auditoria de LGPD e logs)

**Próximos Passos**:
1. Revisão e aprovação desta Tech Spec
2. Priorização no backlog
3. Alocação de recursos (1 desenvolvedor full-stack)
4. Início da Fase 1 (Setup e Estrutura Base)

---

**Documento criado em**: 2025-10-04
**Última atualização**: 2025-10-04
**Versão**: 1.0
**Status**: Draft - Aguardando Aprovação
