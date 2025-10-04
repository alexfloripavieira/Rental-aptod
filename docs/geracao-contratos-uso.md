# Geração de Contratos de Locação - Guia de Uso

## Requisitos
- Permissão de super administrador (`is_superuser`)

## Como Gerar um Contrato

1. Acesse a página de **Inquilinos** (`/inquilinos`)
2. Clique no botão **"Gerar Contrato"** (visível apenas para super admins)
3. Preencha todos os campos obrigatórios (marcados com asterisco vermelho):

### Dados do Locador
- Nome completo
- Nacionalidade (ex: brasileiro)
- Estado civil (ex: casado, solteiro)
- Profissão
- CPF (digite apenas números - a formatação é automática)
- Endereço completo (rua, número, bairro, cidade, UF, CEP)

### Dados do Locatário
- Nome completo
- Nacionalidade
- Profissão
- CPF (digite apenas números - a formatação é automática)
- RG e órgão emissor (ex: 6.505.0271 SSP/SC)
- Endereço completo
- Telefone (digite apenas números - a formatação é automática)
- Email

### Detalhes do Contrato
- Data de início (deve ser futura)
- Valor da caução (em R$)
- Cláusula segunda (acordo de pagamento) - mínimo 50 caracteres

### Inventário de Móveis
- Descrição detalhada dos móveis inclusos (mínimo 20 caracteres)

4. Clique em **"Gerar Contrato"**
5. Aguarde a geração (2-5 segundos)
6. No modal de sucesso, escolha:
   - **Baixar PDF**: Download do arquivo
   - **Imprimir**: Abrir diálogo de impressão
   - **Fechar**: Retornar à listagem

## Formatação Automática

Os seguintes campos possuem formatação automática enquanto você digita:
- **CPF**: Digite apenas números (ex: `12345678900`) → Exibe `123.456.789-00`
- **Telefone**: Digite apenas números (ex: `11987654321`) → Exibe `(11) 98765-4321`

## Nome do Arquivo Gerado
`contrato_locacao_{CPF_LOCATARIO}_{DATA_INICIO}.pdf`

Exemplo: `contrato_locacao_06385740994_2025-08-05.pdf`

## Dúvidas e Suporte
- Erros de validação: Verifique os campos destacados em vermelho
- CPF inválido: Certifique-se de digitar um CPF válido com dígitos verificadores corretos
- Suporte técnico: contato@aptos.com.br
