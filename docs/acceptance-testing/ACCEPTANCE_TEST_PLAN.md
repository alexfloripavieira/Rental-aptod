# Plano de Testes de Aceitação - Sistema de Gestão de Inquilinos

## Objetivos

- Validar funcionalidades conforme PRD
- Verificar usabilidade com usuários reais
- Identificar problemas não detectados em testes anteriores
- Validar performance em cenários reais

## Participantes

- **Administradores Prediais**: 3 usuários
- **Proprietários**: 2 usuários
- **Gerente de TI**: 1 usuário
- **Product Owner**: 1 facilitador

---

## Cenários de Teste

### 1. Cadastro de Inquilino PF

**Objetivo**: Validar processo completo de cadastro pessoa física

**Passos**:
1. Acessar sistema com credenciais de administrador
2. Navegar para "Novo Inquilino"
3. Selecionar "Pessoa Física"
4. Preencher dados obrigatórios:
   - Nome: "João Silva Santos"
   - CPF: "123.456.789-01" (teste)
   - Email: "joao.teste@email.com"
   - Telefone: "(11) 99999-9999"
5. Preencher dados opcionais (endereço, profissão)
6. Anexar documento RG (arquivo teste)
7. Salvar inquilino

**Critérios de Aceitação**:
- ✅ Validação de CPF em tempo real
- ✅ Formatação automática de campos
- ✅ Upload de documento concluído
- ✅ Inquilino criado com status "Ativo"
- ✅ Notificação de sucesso exibida
- ✅ Redirecionamento para lista

**Tempo Esperado**: < 3 minutos

---

### 2. Cadastro de Inquilino PJ

**Objetivo**: Validar processo para pessoa jurídica

**Passos**:
1. Acessar "Novo Inquilino"
2. Selecionar "Pessoa Jurídica"
3. Preencher dados obrigatórios:
   - Razão Social: "Empresa Teste Ltda"
   - CNPJ: "12.345.678/0001-90" (teste)
   - Email: "contato@empresateste.com"
   - Telefone: "(11) 88888-8888"
4. Preencher responsável legal
5. Anexar documentos
6. Salvar

**Critérios de Aceitação**:
- ✅ Campos PJ exibidos corretamente
- ✅ Validação de CNPJ funcionando
- ✅ Todos os campos salvos corretamente

**Tempo Esperado**: < 3 minutos

---

### 3. Busca e Filtros

**Objetivo**: Validar sistema de busca

**Passos**:
1. Acessar lista de inquilinos
2. Buscar por "João" na barra de busca
3. Aplicar filtro "Status: Ativo"
4. Aplicar filtro "Tipo: Pessoa Física"
5. Ordenar por "Data de Cadastro"
6. Navegar pelas páginas

**Critérios de Aceitação**:
- ✅ Busca retorna resultados corretos
- ✅ Filtros funcionam individualmente
- ✅ Filtros combinados funcionam
- ✅ Ordenação funciona
- ✅ Paginação funciona

**Tempo Esperado**: < 2 minutos

---

### 4. Associação com Apartamento

**Objetivo**: Validar criação de associação

**Passos**:
1. Selecionar inquilino ativo
2. Clicar em "Associar Apartamento"
3. Selecionar apartamento disponível
4. Definir data de início (hoje)
5. Informar valor do aluguel
6. Salvar associação

**Critérios de Aceitação**:
- ✅ Apenas apartamentos disponíveis listados
- ✅ Validação de conflitos de período
- ✅ Associação criada corretamente
- ✅ Status do apartamento atualizado

**Tempo Esperado**: < 2 minutos

---

### 5. Gestão de Status

**Objetivo**: Validar mudanças de status

**Passos**:
1. Selecionar inquilino ativo
2. Alterar status para "Inadimplente"
3. Informar motivo
4. Confirmar alteração
5. Verificar histórico

**Critérios de Aceitação**:
- ✅ Status alterado corretamente
- ✅ Histórico registrado
- ✅ Regras de negócio aplicadas

**Tempo Esperado**: < 1 minuto

---

### 6. Upload de Documentos

**Objetivo**: Validar sistema de documentos

**Passos**:
1. Acessar detalhes do inquilino
2. Fazer upload de documento PDF (2MB)
3. Fazer upload de imagem JPG (1MB)
4. Tentar upload de arquivo muito grande (>5MB)
5. Visualizar documentos anexados

**Critérios de Aceitação**:
- ✅ Upload de PDF funcionando
- ✅ Upload de imagem funcionando
- ✅ Validação de tamanho funcionando
- ✅ Lista de documentos atualizada

**Tempo Esperado**: < 2 minutos

---

### 7. Relatórios

**Objetivo**: Validar geração de relatórios

**Passos**:
1. Acessar seção de relatórios
2. Gerar relatório de inquilinos ativos
3. Gerar relatório de ocupação
4. Exportar relatório em PDF

**Critérios de Aceitação**:
- ✅ Relatórios gerados corretamente
- ✅ Dados precisos
- ✅ Exportação funcionando

**Tempo Esperado**: < 2 minutos

---

### 8. Responsividade Mobile

**Objetivo**: Validar funcionalidade em dispositivos móveis

**Passos**:
1. Acessar sistema em tablet/smartphone
2. Realizar cadastro de inquilino
3. Fazer busca e aplicar filtros
4. Visualizar detalhes

**Critérios de Aceitação**:
- ✅ Interface adaptada para mobile
- ✅ Todas as funcionalidades acessíveis
- ✅ Performance adequada

**Tempo Esperado**: < 5 minutos

---

## Testes de Performance

### Teste de Carga - Lista de Inquilinos
- **Objetivo**: 100 inquilinos cadastrados
- **Tempo de resposta esperado**: < 2s
- **Paginação**: 20 itens por página

### Teste de Busca
- **Objetivo**: Busca em base de 500 inquilinos
- **Tempo de resposta esperado**: < 500ms
- **Debounce**: 300ms

### Teste de Upload
- **Arquivo**: 5MB PDF
- **Tempo de upload esperado**: < 10s
- **Validação**: Imediata

---

## Testes de Acessibilidade

### WCAG 2.1 AA Compliance
- [ ] Navegação completa por teclado
- [ ] Tab order lógico
- [ ] Labels ARIA em todos os elementos interativos
- [ ] Contraste adequado (mínimo 4.5:1)
- [ ] Suporte a leitor de tela (NVDA/JAWS)
- [ ] Foco visível em todos os elementos
- [ ] Mensagens de erro acessíveis
- [ ] Formulários com labels adequados

---

## Testes de Segurança e LGPD

### Proteção de Dados
- [ ] CPF/CNPJ criptografados no banco
- [ ] Campos sensíveis mascarados na UI
- [ ] Logs de auditoria funcionando
- [ ] Controle de acesso por permissões

### Compliance LGPD
- [ ] Termo de consentimento exibido
- [ ] Exercício de direitos implementado
- [ ] Período de retenção configurado
- [ ] Políticas de backup seguras

---

## Checklist de Validação Final

### Funcionalidades Principais ✅

#### Cadastro de Inquilinos
- [ ] PF - todos os campos funcionando
- [ ] PJ - todos os campos funcionando
- [ ] Validação CPF em tempo real
- [ ] Validação CNPJ em tempo real
- [ ] Upload de documentos funcionando
- [ ] Formatação automática de campos

#### Busca e Filtros
- [ ] Busca textual funcionando
- [ ] Filtro por status
- [ ] Filtro por tipo (PF/PJ)
- [ ] Filtro por apartamento
- [ ] Ordenação funcionando
- [ ] Paginação funcionando

#### Gestão de Status
- [ ] Alteração manual de status
- [ ] Histórico de mudanças
- [ ] Regras de transição respeitadas
- [ ] Notificações funcionando

#### Associações
- [ ] Associar inquilino a apartamento
- [ ] Validação de conflitos
- [ ] Histórico de associações
- [ ] Finalização de associações

#### Relatórios
- [ ] Relatório de inquilinos ativos
- [ ] Relatório de ocupação
- [ ] Exportação em PDF
- [ ] Dados precisos

### Qualidade e Performance ✅

#### Usabilidade
- [ ] Interface intuitiva
- [ ] Fluxos claros
- [ ] Mensagens de erro claras
- [ ] Feedback adequado ao usuário

#### Performance
- [ ] Carregamento inicial < 3s
- [ ] Busca responsiva < 500ms
- [ ] Upload de arquivos eficiente
- [ ] Navegação fluida

#### Responsividade
- [ ] Mobile (320px - 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1024px+)
- [ ] Orientação landscape/portrait

#### Acessibilidade
- [ ] Navegação por teclado
- [ ] Contraste adequado
- [ ] Alt text em imagens
- [ ] ARIA labels
- [ ] Leitor de tela compatível

### Segurança e Compliance ✅

#### LGPD
- [ ] Dados sensíveis criptografados
- [ ] Log de auditoria funcionando
- [ ] Controle de retenção
- [ ] Exercício de direitos implementado

#### Segurança
- [ ] Autenticação funcionando
- [ ] Autorização por perfil
- [ ] Validação de inputs
- [ ] Sanitização de dados

#### Backup e Recovery
- [ ] Backup automático configurado
- [ ] Restore testado
- [ ] Dados de documentos incluídos
- [ ] Procedimento documentado

### Aprovações Finais ✅

#### Stakeholders
- [ ] Product Owner - aprovado
- [ ] Administrador Predial - aprovado
- [ ] Proprietário - aprovado
- [ ] TI/Segurança - aprovado
- [ ] Jurídico/LGPD - aprovado

#### Documentação
- [ ] Manual do usuário completo
- [ ] Documentação técnica atualizada
- [ ] Procedures de deploy documentados
- [ ] Troubleshooting guide criado

---

**Data da Validação**: _____________
**Responsável**: ___________________
**Aprovado para Produção**: [ ] Sim [ ] Não
