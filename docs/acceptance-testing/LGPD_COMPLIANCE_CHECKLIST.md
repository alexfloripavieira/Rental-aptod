# Checklist de Conformidade LGPD - Sistema de Gestão de Inquilinos

## Princípios Fundamentais da LGPD

### 1. Finalidade (Art. 6º, I)
- [ ] Propósito específico e legítimo definido para coleta de dados
- [ ] Documentação clara do uso de dados de inquilinos
- [ ] Limitação de uso aos fins declarados

**Evidências**:
- Termo de uso e política de privacidade
- Documentação técnica do sistema
- PRD definindo finalidades

---

### 2. Adequação (Art. 6º, II)
- [ ] Tratamento de dados compatível com finalidades
- [ ] Apenas dados necessários são coletados
- [ ] Contexto de tratamento adequado às necessidades

**Dados Coletados**:
- **Pessoa Física**: Nome, CPF, RG, email, telefone, endereço, profissão, renda
- **Pessoa Jurídica**: Razão social, CNPJ, email, telefone, responsável legal
- **Justificativa**: Gestão de locação de imóveis

---

### 3. Necessidade (Art. 6º, III)
- [ ] Minimização de dados ao estritamente necessário
- [ ] Campos opcionais claramente identificados
- [ ] Ausência de coleta excessiva

**Campos Obrigatórios vs Opcionais**:
- ✅ Obrigatórios: Nome/Razão Social, CPF/CNPJ, Email, Telefone
- ✅ Opcionais: Endereço completo, profissão, renda, observações

---

### 4. Transparência (Art. 6º, VI)
- [ ] Informações claras sobre tratamento de dados
- [ ] Titular informado sobre uso dos dados
- [ ] Acesso facilitado às políticas de privacidade

**Implementações**:
- [ ] Termo de consentimento exibido no cadastro
- [ ] Link para política de privacidade
- [ ] Aviso de cookies/rastreamento

---

## Bases Legais (Art. 7º)

### Consentimento do Titular (Art. 7º, I)
- [ ] Consentimento explícito coletado
- [ ] Registro de consentimento armazenado
- [ ] Opção de revogar consentimento

**Implementação**:
```python
# Model: Inquilino
consentimento_lgpd = models.BooleanField(default=False)
data_consentimento = models.DateTimeField(null=True, blank=True)
```

### Execução de Contrato (Art. 7º, V)
- [ ] Dados necessários para contrato de locação
- [ ] Relacionamento direto com obrigações contratuais
- [ ] Documentação de necessidade contratual

---

## Direitos dos Titulares (Art. 18)

### 1. Confirmação e Acesso (Art. 18, I e II)
- [ ] Endpoint para confirmar existência de dados
- [ ] Funcionalidade de acesso aos próprios dados
- [ ] Resposta em até 15 dias

**Implementação**:
```
GET /api/v1/inquilinos/{id}/dados-pessoais/
```

### 2. Correção de Dados (Art. 18, III)
- [ ] Funcionalidade de edição de dados
- [ ] Atualização em tempo real
- [ ] Histórico de alterações

**Implementação**:
```
PATCH /api/v1/inquilinos/{id}/
```

### 3. Anonimização, Bloqueio ou Eliminação (Art. 18, IV)
- [ ] Funcionalidade de anonimização de dados
- [ ] Opção de bloqueio de tratamento
- [ ] Exclusão lógica implementada

**Implementação**:
```python
def anonimizar_inquilino(inquilino_id):
    inquilino = Inquilino.objects.get(id=inquilino_id)
    inquilino.nome_completo = "ANONIMIZADO"
    inquilino.cpf = None
    inquilino.email = f"anonimo{inquilino.id}@anonimizado.com"
    inquilino.telefone = None
    inquilino.save()
```

### 4. Portabilidade (Art. 18, V)
- [ ] Exportação de dados em formato estruturado
- [ ] Formato legível por máquina (JSON, CSV)
- [ ] Inclusão de todos os dados do titular

**Implementação**:
```
GET /api/v1/inquilinos/{id}/exportar/?format=json
```

### 5. Eliminação após Término (Art. 18, VI)
- [ ] Política de retenção definida
- [ ] Exclusão automática após período
- [ ] Exceções para obrigações legais documentadas

**Política de Retenção**:
- **Dados ativos**: Durante vigência do contrato
- **Dados inativos**: 5 anos após término (obrigação fiscal)
- **Após período**: Anonimização automática

### 6. Informação sobre Compartilhamento (Art. 18, VII)
- [ ] Documentação de compartilhamento com terceiros
- [ ] Notificação ao titular sobre compartilhamento
- [ ] Lista de entidades com acesso

**Compartilhamento Atual**:
- ❌ Nenhum compartilhamento com terceiros
- ✅ Acesso restrito a administradores e proprietários
- ✅ Logs de acesso mantidos

### 7. Informação sobre Não Consentimento (Art. 18, VIII)
- [ ] Aviso sobre consequências de não fornecer dados
- [ ] Opções claras de consentimento parcial
- [ ] Explicação de impactos funcionais

### 8. Revogação de Consentimento (Art. 18, IX)
- [ ] Funcionalidade de revogação
- [ ] Processo simplificado
- [ ] Mesma facilidade que concessão

**Implementação**:
```
POST /api/v1/inquilinos/{id}/revogar-consentimento/
```

---

## Segurança da Informação (Art. 46)

### Medidas Técnicas

#### Criptografia
- [ ] Dados sensíveis criptografados em repouso
- [ ] Conexões HTTPS obrigatórias
- [ ] Senhas com hash bcrypt/argon2

**Campos Criptografados**:
- ✅ CPF
- ✅ RG
- ✅ CNPJ
- ✅ Dados bancários (se houver)

#### Controle de Acesso
- [ ] Autenticação obrigatória
- [ ] Autorização baseada em roles
- [ ] Princípio do menor privilégio

**Roles e Permissões**:
| Role | Visualizar | Criar | Editar | Excluir |
|------|-----------|-------|--------|---------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Proprietário | ✅ (seus) | ❌ | ✅ (seus) | ❌ |
| Visualizador | ✅ | ❌ | ❌ | ❌ |

#### Logs de Auditoria
- [ ] Registro de todos os acessos
- [ ] Identificação de usuário e timestamp
- [ ] Retenção de logs por 6 meses mínimo

**Eventos Registrados**:
- Login/Logout
- Visualização de dados
- Criação/Edição/Exclusão
- Alteração de status
- Exportação de dados

### Medidas Organizacionais

#### Treinamento
- [ ] Equipe treinada em LGPD
- [ ] Políticas de segurança documentadas
- [ ] Conscientização sobre privacidade

#### Resposta a Incidentes
- [ ] Plano de resposta a incidentes
- [ ] Notificação à ANPD em até 2 dias úteis
- [ ] Comunicação aos titulares afetados

---

## Transferência Internacional (Art. 33)

### Verificação
- [ ] ❌ Nenhuma transferência internacional de dados
- [ ] Dados armazenados apenas no Brasil
- [ ] Servidores em território nacional

---

## Encarregado de Dados (DPO) (Art. 41)

### Requisitos
- [ ] DPO nomeado e identificado
- [ ] Canal de comunicação publicado
- [ ] Contato da ANPD disponível

**Informações do DPO**:
- Nome: ___________________________
- Email: dpo@empresa.com
- Telefone: ___________________________

---

## Registro de Tratamento (Art. 37)

### Documentação Obrigatória
- [ ] Finalidade do tratamento
- [ ] Base legal
- [ ] Categoria de dados
- [ ] Compartilhamento de dados
- [ ] Medidas de segurança
- [ ] Prazo de conservação

**Template Implementado**:
```markdown
# Registro de Atividade de Tratamento

- **Operação**: Cadastro de Inquilinos
- **Finalidade**: Gestão de locação de imóveis
- **Base Legal**: Execução de contrato (Art. 7º, V)
- **Categorias**: Dados cadastrais, financeiros, documentos
- **Compartilhamento**: Nenhum
- **Segurança**: Criptografia, controle de acesso, logs
- **Retenção**: 5 anos após término do contrato
```

---

## Conformidade por Funcionalidade

### Cadastro de Inquilinos
- [x] Termo de consentimento
- [x] Campos opcionais identificados
- [x] Validação de dados
- [x] Criptografia de dados sensíveis

### Busca e Filtros
- [x] Controle de acesso por permissão
- [x] Logs de consulta
- [x] Limitação de resultados

### Gestão de Documentos
- [x] Upload seguro
- [x] Controle de acesso
- [x] Criptografia de arquivos
- [x] Logs de download

### Relatórios
- [x] Dados agregados quando possível
- [x] Anonimização em relatórios gerenciais
- [x] Controle de acesso a relatórios nominais

---

## Testes de Conformidade

### Teste 1: Verificar Criptografia
```python
def test_cpf_criptografado():
    inquilino = Inquilino.objects.create(
        tipo='PF',
        nome_completo='Teste',
        cpf='12345678901',
        email='teste@test.com',
        telefone='11999999999'
    )

    # Verificar que CPF não está em texto plano no banco
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT cpf FROM aptos_inquilino WHERE id = %s",
            [inquilino.id]
        )
        cpf_db = cursor.fetchone()[0]

    assert cpf_db != '12345678901'
    assert len(cpf_db) > 11  # Criptografado é maior
```

### Teste 2: Verificar Logs de Auditoria
```python
def test_log_auditoria_criado():
    inquilino = Inquilino.objects.create(...)

    logs = AuditoriaLog.objects.filter(
        inquilino_id=inquilino.id,
        acao='CREATE'
    )

    assert logs.exists()
    assert logs.first().usuario is not None
```

### Teste 3: Verificar Controle de Acesso
```python
def test_acesso_restrito_por_permissao():
    client = APIClient()
    user = User.objects.create_user('test', password='test')
    client.force_authenticate(user=user)

    response = client.get('/api/v1/inquilinos/')

    assert response.status_code == 403  # Sem permissão
```

---

## Checklist Final de Conformidade

### Obrigatório para Produção
- [ ] Política de Privacidade publicada
- [ ] Termo de Consentimento implementado
- [ ] Criptografia de dados sensíveis ativa
- [ ] Logs de auditoria funcionando
- [ ] Controle de acesso configurado
- [ ] DPO nomeado e publicado
- [ ] Plano de resposta a incidentes documentado
- [ ] Registro de tratamento completo
- [ ] Política de retenção configurada
- [ ] Backup seguro implementado

### Recomendado
- [ ] Avaliação de impacto (DPIA) realizada
- [ ] Contratos com processadores de dados
- [ ] Seguro de responsabilidade civil
- [ ] Certificações de segurança (ISO 27001)
- [ ] Testes de penetração realizados

---

**Data da Avaliação**: _____________
**Responsável pela Avaliação**: ___________________
**DPO**: ___________________
**Conformidade Verificada**: [ ] Sim [ ] Não

## Observações e Ações Corretivas

_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
