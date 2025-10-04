# Implementação - Gerador de Contratos de Locação

## Visão Geral

Este documento apresenta a lista simplificada de tarefas para implementação da funcionalidade de geração automatizada de contratos de locação em PDF. A implementação foi dividida em **3 grandes tarefas macro** que agrupam todo o trabalho necessário.

## Cronograma Resumido

- **CONT-001**: Backend Completo - ~15 dias
- **CONT-002**: Frontend Completo - ~12 dias
- **CONT-003**: Qualidade e Deploy - ~5 dias
- **Total Estimado**: ~32 dias (dentro dos 35 dias planejados)

## Lista de Tarefas

### ✅ Fase 1: Backend
- [ ] **CONT-001** - Backend Completo (API + PDF + Validações)
  - Setup de módulos backend
  - Validadores (CPF, RG, telefone, CEP)
  - Serializers com validações completas
  - Template HTML/CSS (4 páginas)
  - Geração de PDF com WeasyPrint
  - Endpoint POST /api/v1/contratos/gerar/
  - Permissões (IsSuperAdminUser)
  - Testes backend (validação, PDF, API)

### ✅ Fase 2: Frontend
- [ ] **CONT-002** - Frontend Completo (Modal + Formulário + Integração)
  - Componentes (Button, Modal, Form, Success)
  - Validações Yup (client-side)
  - Hook useGerarContrato
  - Integração em InquilinosListPage
  - Download e impressão de PDF
  - Testes frontend (componentes + integração)

### ✅ Fase 3: Qualidade e Entrega
- [ ] **CONT-003** - Qualidade e Deploy
  - Code review completo
  - Validação de cobertura ≥85%
  - Testes E2E (opcional)
  - Deploy staging → produção
  - Documentação mínima de uso

## Dependências

```
CONT-001 (Backend)
    ↓
CONT-002 (Frontend - depende de API pronta)
    ↓
CONT-003 (QA/Deploy - depende de ambos)
```

## Critérios de Sucesso Global

- [ ] Super admin gera contrato completo em < 3 minutos
- [ ] PDF possui exatamente 4 páginas conforme template
- [ ] Todos os campos variáveis preenchidos corretamente
- [ ] Validações impedem campos inválidos ou vazios
- [ ] Cobertura de testes ≥ 85%
- [ ] Apenas super admins têm acesso (403 para outros)
- [ ] PDF gerado em < 5 segundos
- [ ] Zero erros em produção nos primeiros 7 dias

## Arquivos de Detalhamento

Cada tarefa possui um arquivo detalhado na pasta `tarefas/`:

- `tarefas/CONT-001.md` - Backend Completo
- `tarefas/CONT-002.md` - Frontend Completo
- `tarefas/CONT-003.md` - Qualidade e Deploy

## Próximos Passos

1. Revisar e aprovar CONT-001 (Backend)
2. Alocar desenvolvedor backend para CONT-001
3. Após conclusão de CONT-001, iniciar CONT-002 (pode ser dev diferente)
4. Ao concluir CONT-002, realizar CONT-003 com equipe QA

---

**Última Atualização**: 2025-10-04
**Responsável**: Equipe de Desenvolvimento
**PRD**: `prd-geracao-contratos-locacao.md`
**Tech Spec**: `techspec-geracao-contratos-locacao.md`
