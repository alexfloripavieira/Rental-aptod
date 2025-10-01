---
status: pending
parallelizable: false
blocked_by: []
---

<task_context>
<domain>backend/models</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database</dependencies>
<unblocks>2.0,4.0,7.0,8.0,13.0</unblocks>
</task_context>

# Tarefa 1.0: Criar modelo Inquilino e relacionamentos Django

## Visão Geral
Implementar o modelo Django `Inquilino` com todos os campos necessários para pessoas físicas e jurídicas, incluindo relacionamentos many-to-many com apartamentos e sistema de histórico de status. Esta é a tarefa fundamental que desbloqueia todo o desenvolvimento posterior.

## Requisitos
- Modelo Inquilino com campos para PF e PJ conforme PRD
- Relacionamento many-to-many com modelo Aptos existente
- Modelo de histórico de associações com controle de períodos
- Modelo de histórico de status
- Migrations Django compatíveis com sistema existente
- Validações a nível de modelo
- Métodos auxiliares para business logic

## Subtarefas
- [ ] 1.1 Criar modelo base Inquilino com campos comuns
- [ ] 1.2 Implementar campos específicos para PF (CPF, RG, etc.)
- [ ] 1.3 Implementar campos específicos para PJ (CNPJ, inscrição estadual, etc.)
- [ ] 1.4 Criar modelo InquilinoApartamento para relacionamento many-to-many
- [ ] 1.5 Criar modelo HistoricoStatus para auditoria de mudanças
- [ ] 1.6 Implementar métodos de classe e propriedades auxiliares
- [ ] 1.7 Criar e aplicar migrations Django
- [ ] 1.8 Configurar Django admin para modelos criados

## Sequenciamento
- Bloqueado por: Nenhuma (tarefa inicial)
- Desbloqueia: 2.0 (Validações), 4.0 (API), 7.0 (Frontend), 8.0 (Formulários), 13.0 (LGPD)
- Paralelizável: Não (base para todas as outras tarefas)

## Detalhes de Implementação

### Modelo Inquilino
```python
class Inquilino(models.Model):
    TIPO_CHOICES = [
        ('PF', 'Pessoa Física'),
        ('PJ', 'Pessoa Jurídica'),
    ]

    STATUS_CHOICES = [
        ('ATIVO', 'Ativo'),
        ('INATIVO', 'Inativo'),
        ('INADIMPLENTE', 'Inadimplente'),
        ('BLOQUEADO', 'Bloqueado'),
    ]

    # Campos comuns
    id = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=2, choices=TIPO_CHOICES)
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=20)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ATIVO')
    observacoes = models.TextField(blank=True, null=True)

    # Campos PF
    nome_completo = models.CharField(max_length=200, blank=True, null=True)
    cpf = models.CharField(max_length=14, blank=True, null=True, unique=True)
    rg = models.CharField(max_length=20, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)
    estado_civil = models.CharField(max_length=50, blank=True, null=True)
    profissao = models.CharField(max_length=100, blank=True, null=True)
    renda = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    # Campos PJ
    razao_social = models.CharField(max_length=200, blank=True, null=True)
    nome_fantasia = models.CharField(max_length=200, blank=True, null=True)
    cnpj = models.CharField(max_length=18, blank=True, null=True, unique=True)
    inscricao_estadual = models.CharField(max_length=30, blank=True, null=True)
    responsavel_legal = models.CharField(max_length=200, blank=True, null=True)

    # Endereço (opcional)
    endereco_completo = models.TextField(blank=True, null=True)

    # Relacionamentos
    apartamentos = models.ManyToManyField(
        'Aptos',
        through='InquilinoApartamento',
        related_name='inquilinos'
    )

    # Auditoria
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### Modelo de Relacionamento
```python
class InquilinoApartamento(models.Model):
    inquilino = models.ForeignKey(Inquilino, on_delete=models.CASCADE)
    apartamento = models.ForeignKey('Aptos', on_delete=models.CASCADE)
    data_inicio = models.DateField()
    data_fim = models.DateField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Modelo de Histórico
```python
class HistoricoStatus(models.Model):
    inquilino = models.ForeignKey(Inquilino, on_delete=models.CASCADE, related_name='historico_status')
    status_anterior = models.CharField(max_length=15)
    status_novo = models.CharField(max_length=15)
    motivo = models.TextField(blank=True, null=True)
    usuario = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
```

## Critérios de Sucesso
- [ ] Modelo Inquilino criado com todos os campos especificados no PRD
- [ ] Relacionamento many-to-many funcionando corretamente
- [ ] Migrations aplicadas sem erros
- [ ] Django admin configurado e funcional
- [ ] Validações básicas implementadas (tipo PF/PJ)
- [ ] Métodos auxiliares implementados (duração de locação, status ativo, etc.)
- [ ] Testes unitários para modelos passando
- [ ] Documentação dos modelos atualizada