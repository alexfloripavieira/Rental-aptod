---
status: pending
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>backend/validation</domain>
<type>implementation</type>
<scope>middleware</scope>
<complexity>medium</complexity>
<dependencies>external_apis</dependencies>
<unblocks>4.0,8.0</unblocks>
</task_context>

# Tarefa 2.0: Implementar sistema de validações CPF/CNPJ

## Visão Geral
Desenvolver sistema robusto de validação de CPF e CNPJ com algoritmos padrão brasileiros, incluindo validação em tempo real, verificação de unicidade e integração com APIs externas quando necessário. Sistema deve ser reutilizável em diferentes contextos (formulários, API, admin).

## Requisitos
- Validação algorítmica de CPF seguindo padrão da Receita Federal
- Validação algorítmica de CNPJ seguindo padrão da Receita Federal
- Formatação automática de CPF/CNPJ
- Validação de unicidade na base de dados
- Integração opcional com APIs de validação externas
- Validadores Django customizados
- Middleware para validação em tempo real via API

## Subtarefas
- [ ] 2.1 Implementar algoritmo de validação de CPF
- [ ] 2.2 Implementar algoritmo de validação de CNPJ
- [ ] 2.3 Criar validadores Django customizados
- [ ] 2.4 Implementar formatação automática de documentos
- [ ] 2.5 Criar middleware de validação em tempo real
- [ ] 2.6 Implementar validação de unicidade
- [ ] 2.7 Integrar com API externa de validação (opcional)
- [ ] 2.8 Criar testes unitários para todas as validações

## Sequenciamento
- Bloqueado por: 1.0 (Modelo Inquilino criado)
- Desbloqueia: 4.0 (API endpoints), 8.0 (Formulários frontend)
- Paralelizável: Sim (pode ser desenvolvido em paralelo com 3.0)

## Detalhes de Implementação

### Validador de CPF
```python
# aptos/validators.py
import re
from django.core.exceptions import ValidationError

def validar_cpf(cpf):
    """Valida CPF usando algoritmo da Receita Federal"""
    # Remove formatação
    cpf = re.sub(r'[^0-9]', '', cpf)

    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        raise ValidationError('CPF deve ter 11 dígitos.')

    # Verifica se não é sequência igual
    if cpf == cpf[0] * 11:
        raise ValidationError('CPF inválido.')

    # Calcula primeiro dígito verificador
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    resto = soma % 11
    dv1 = 0 if resto < 2 else 11 - resto

    # Calcula segundo dígito verificador
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    resto = soma % 11
    dv2 = 0 if resto < 2 else 11 - resto

    # Verifica dígitos verificadores
    if cpf[-2:] != f"{dv1}{dv2}":
        raise ValidationError('CPF inválido.')

    return cpf

def validar_cnpj(cnpj):
    """Valida CNPJ usando algoritmo da Receita Federal"""
    # Similar ao CPF mas com algoritmo específico do CNPJ
    cnpj = re.sub(r'[^0-9]', '', cnpj)

    if len(cnpj) != 14:
        raise ValidationError('CNPJ deve ter 14 dígitos.')

    # Algoritmo de validação do CNPJ
    # Implementação completa...
```

### Formatadores
```python
# aptos/utils.py
def formatar_cpf(cpf):
    """Formata CPF para XXX.XXX.XXX-XX"""
    cpf = re.sub(r'[^0-9]', '', cpf)
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"

def formatar_cnpj(cnpj):
    """Formata CNPJ para XX.XXX.XXX/XXXX-XX"""
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"
```

### Validadores Django
```python
# aptos/models.py (adicionar ao modelo Inquilino)
from django.core.validators import RegexValidator
from .validators import validar_cpf, validar_cnpj

class Inquilino(models.Model):
    cpf = models.CharField(
        max_length=14,
        blank=True,
        null=True,
        unique=True,
        validators=[validar_cpf],
        help_text="Formato: XXX.XXX.XXX-XX"
    )

    cnpj = models.CharField(
        max_length=18,
        blank=True,
        null=True,
        unique=True,
        validators=[validar_cnpj],
        help_text="Formato: XX.XXX.XXX/XXXX-XX"
    )
```

### API de Validação em Tempo Real
```python
# aptos/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def validar_documento(request):
    """Endpoint para validação em tempo real de CPF/CNPJ"""
    if request.method == 'POST':
        data = json.loads(request.body)
        documento = data.get('documento')
        tipo = data.get('tipo')

        try:
            if tipo == 'CPF':
                documento_limpo = validar_cpf(documento)
                formatado = formatar_cpf(documento_limpo)
            elif tipo == 'CNPJ':
                documento_limpo = validar_cnpj(documento)
                formatado = formatar_cnpj(documento_limpo)
            else:
                return JsonResponse({'valid': False, 'error': 'Tipo inválido'})

            # Verificar unicidade
            exists = Inquilino.objects.filter(
                **{tipo.lower(): documento_limpo}
            ).exists()

            return JsonResponse({
                'valid': True,
                'formatted': formatado,
                'exists': exists
            })

        except ValidationError as e:
            return JsonResponse({'valid': False, 'error': str(e)})
```

## Critérios de Sucesso
- [ ] Validação de CPF funciona corretamente para todos os casos de teste
- [ ] Validação de CNPJ funciona corretamente para todos os casos de teste
- [ ] Formatação automática aplicada nos formulários
- [ ] Validação de unicidade impede duplicatas
- [ ] API de validação em tempo real respondendo corretamente
- [ ] Validadores integrados ao modelo Django
- [ ] Testes unitários com cobertura > 95%
- [ ] Performance adequada (< 100ms por validação)
- [ ] Tratamento de erros robusto