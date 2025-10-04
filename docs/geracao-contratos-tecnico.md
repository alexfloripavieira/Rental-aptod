# Geração de Contratos - Documentação Técnica

## Arquitetura

- **Backend**: Django REST Framework (endpoint `/api/v1/contratos/gerar/`)
- **Frontend**: React + TypeScript + Yup + React Hook Form
- **PDF**: WeasyPrint (HTML → PDF)
- **Validação**: Yup schemas + Django serializers

## Módulos

### Backend
- `aptos/contratos/` - Módulo completo de geração de contratos
  - `views.py` - APIView para geração de PDF
  - `serializers.py` - Validação de dados (Locador, Locatário, Contrato)
  - `validators.py` - Validadores customizados (CPF, RG, telefone, email, CEP)
  - `pdf_generator.py` - Geração de PDF com WeasyPrint
  - `permissions.py` - Permissão de super admin
  - `utils.py` - Utilitários (hash de CPF para auditoria)
  - `templates/contrato_locacao.html` - Template HTML do contrato

### Frontend
- `frontend/src/components/contratos/` - Componentes React
  - `GerarContratoButton.tsx` - Botão para abrir modal
  - `GerarContratoModal.tsx` - Modal principal
  - `FormularioContrato.tsx` - Formulário com validação
  - `ContratoSucessoModal.tsx` - Modal de sucesso com download/impressão
- `frontend/src/hooks/useGerarContrato.ts` - Hook de API
- `frontend/src/schemas/contratoValidation.ts` - Validação Yup
- `frontend/src/types/contrato.ts` - Tipos TypeScript
- `frontend/src/utils/formatters.ts` - Formatadores de CPF, telefone, CNPJ
- `frontend/src/components/common/FormattedInput.tsx` - Input com formatação automática

## API Endpoint

**POST** `/api/v1/contratos/gerar/`

### Permissão
`IsSuperAdminUser` - Apenas super administradores

### Request Body (JSON)
```json
{
  "locador": {
    "nomeCompleto": "string",
    "nacionalidade": "string",
    "estadoCivil": "string",
    "profissao": "string",
    "cpf": "string",
    "endereco": {
      "rua": "string",
      "numero": "string",
      "bairro": "string",
      "cidade": "string",
      "estado": "string",
      "cep": "string"
    }
  },
  "locatario": {
    "nomeCompleto": "string",
    "nacionalidade": "string",
    "profissao": "string",
    "cpf": "string",
    "rg": "string",
    "rgOrgao": "string",
    "enderecoCompleto": "string",
    "telefone": "string",
    "email": "string"
  },
  "contrato": {
    "dataInicio": "YYYY-MM-DD",
    "valorCaucao": number,
    "clausulaSegunda": "string"
  },
  "inventarioMoveis": "string"
}
```

### Response
- **Content-Type**: `application/pdf`
- **Headers**: `Content-Disposition: attachment; filename="contrato_locacao_{CPF}_{DATA}.pdf"`

### Validações

**Backend (Django Serializers)**:
- CPF: Validação com dígitos verificadores
- RG: Mínimo 5 caracteres, máximo 20
- Telefone: Formato brasileiro (XX) XXXXX-XXXX
- Email: Regex padrão
- CEP: Formato XXXXX-XXX
- Data início: Deve ser futura
- Valor caução: Positivo
- Cláusula segunda: Mínimo 50 caracteres
- Inventário móveis: Mínimo 20 caracteres

**Frontend (Yup)**:
- Mesmas validações do backend
- Formatação automática de CPF e telefone
- Validação em tempo real

## Testes

### Backend
```bash
# Executar testes
docker compose exec backend python -m pytest aptos/contratos/tests/ -v

# Com cobertura
docker compose exec backend python -m pytest aptos/contratos/tests/ --cov=aptos.contratos --cov-report=term-missing
```

**Cobertura Atual**: 96% ✓
- `pdf_generator.py`: 96%
- `permissions.py`: 100%
- `serializers.py`: 95%
- `validators.py`: 100%
- `views.py`: 91%

### Frontend
```bash
# Executar testes
cd frontend && npm run test

# Com cobertura
npm run test:coverage
```

**Componentes Testados**:
- `GerarContratoButton.tsx`: 100%
- `FormularioContrato.tsx`: 85%+
- `GerarContratoModal.tsx`: 85%+
- `ContratoSucessoModal.tsx`: 100%
- `useGerarContrato.ts`: 100%

## Logs de Auditoria

Logs em `logs/contratos.log` (ambiente development) com:
- Timestamp
- Usuário que gerou (username)
- CPF locatário (hasheado SHA-256 para segurança)
- Status (sucesso/falha)

Exemplo:
```
[INFO] Contrato gerado por admin - CPF Locatario (hash): a3f8b9c2d4e5f6...
```

## Segurança

- **Autenticação**: Apenas usuários autenticados
- **Autorização**: Apenas super administradores (`is_superuser=True`)
- **Validação**: Dupla camada (frontend + backend)
- **Logs**: CPF hasheado (nunca em texto plano)
- **CSRF**: Proteção via Django CSRF middleware

## Performance

- **Tempo de geração de PDF**: ~2-5 segundos
- **Tempo total de resposta**: < 6 segundos (p95)
- **Tamanho do PDF**: ~150-200 KB (4 páginas)

## Formatação Automática

O sistema possui formatação automática em tempo real para:
- **CPF**: `12345678900` → `123.456.789-00`
- **Telefone**: `11987654321` → `(11) 98765-4321`

Implementado em:
- `frontend/src/utils/formatters.ts` - Funções de formatação
- `frontend/src/components/common/FormattedInput.tsx` - Componente reutilizável

## Troubleshooting

### PDF não é gerado
- Verificar se WeasyPrint está instalado: `docker compose exec backend pip show weasyprint`
- Verificar logs: `docker compose logs backend | grep contratos`

### Erro de validação
- Verificar formato dos campos (CPF, telefone, email)
- Verificar campos obrigatórios
- Verificar console do browser para erros de validação Yup

### Permissão negada
- Verificar se usuário tem `is_superuser=True`
- Verificar autenticação (`is_authenticated=True`)

## Deploy

### Build do Frontend
```bash
make build-frontend
```

### Migrations (se necessário)
```bash
docker compose exec backend python manage.py migrate
```

### Health Check
```bash
curl http://localhost:8000/health/
```

## Próximas Melhorias (Backlog)

1. **Persistência de contratos** (Fase 2)
   - Salvar PDFs no banco de dados
   - Listagem de contratos gerados
   - Busca e filtros

2. **Assinatura eletrônica** (Fase 3)
   - Integração com plataformas de assinatura
   - Workflow de aprovação

3. **Templates múltiplos** (Fase 4)
   - Diferentes tipos de contrato
   - Personalização por cliente

4. **Relatórios e analytics**
   - Dashboard de contratos gerados
   - Métricas de uso
