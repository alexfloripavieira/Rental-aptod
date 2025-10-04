# PRD - Gerador de Contratos de Locacao Residencial

## Visao Geral

Esta funcionalidade permite que super administradores gerem contratos de locacao residencial personalizados em formato PDF diretamente da interface de listagem de inquilinos. O sistema automatiza a criacao de contratos padronizados, preenchendo campos variaveis de acordo com dados fornecidos pelo usuario, eliminando a necessidade de edicao manual de documentos.

O gerador de contratos resolve o problema de criacao manual e propensa a erros de documentos juridicos, garantindo consistencia, rastreabilidade e agilidade no processo de formalizacao de locacoes.

## Objetivos

### Objetivos de Negocio

1. **Eficiencia Operacional**: Reduzir o tempo de geracao de contratos de 30 minutos (manual) para menos de 3 minutos (automatizado)
2. **Consistencia Juridica**: Garantir que 100% dos contratos gerados sigam o template padronizado e regulamento interno aprovado
3. **Reducao de Erros**: Eliminar erros de digitacao e formatacao presentes em contratos manuais
4. **Rastreabilidade**: Permitir auditoria de quais contratos foram gerados, por quem e quando

### Metricas de Sucesso

- **Tempo medio de geracao**: Menor que 3 minutos do inicio ao download
- **Taxa de erro**: 0% de contratos com campos obrigatorios vazios
- **Adocao**: 80% dos novos contratos gerados pelo sistema nos primeiros 30 dias
- **Satisfacao do usuario**: NPS maior que 8 entre super admins

### Objetivos Tecnico-Funcionais

- Gerar PDFs de 4 paginas seguindo estrutura juridica padronizada
- Validar todos os campos obrigatorios antes da geracao
- Disponibilizar download imediato apos geracao bem-sucedida
- Integrar-se perfeitamente com a listagem de inquilinos existente

## Historias de Usuario

### US-01: Super Admin Gera Contrato para Novo Inquilino
**Como** super administrador do sistema
**Eu quero** gerar um contrato de locacao personalizado para um inquilino
**Para que** eu possa formalizar a locacao de forma rapida e padronizada

**Criterios de Aceitacao**:
- Botao "Gerar Contrato" visivel apenas para super admins na listagem de inquilinos
- Modal abre com formulario contendo todos os campos variaveis
- Campos obrigatorios claramente marcados com asterisco
- Sistema valida preenchimento antes de gerar PDF
- PDF gerado em menos de 5 segundos
- Arquivo baixado automaticamente ou disponibilizado para download

---

### US-02: Preenchimento de Dados do Locador
**Como** super administrador
**Eu quero** configurar dados do locador para cada contrato
**Para que** eu possa gerar contratos para diferentes propriedades e locadores

**Criterios de Aceitacao**:
- Campos: Nome completo, nacionalidade, estado civil, profissao, CPF, endereco completo do locador
- Todos os campos sao obrigatorios
- CPF validado no formato XXX.XXX.XXX-XX
- Campos salvos temporariamente durante a sessao (opcional: auto-complete com ultimos valores usados)

---

### US-03: Preenchimento de Dados do Locatario
**Como** super administrador
**Eu quero** preencher dados do locatario no formulario
**Para que** o contrato reflita corretamente as informacoes do inquilino

**Criterios de Aceitacao**:
- Campos: Nome completo, nacionalidade, profissao, CPF, RG, endereco completo, telefone, email
- Todos os campos sao obrigatorios
- CPF e RG validados conforme formatos brasileiros
- Email validado com regex padrao
- Telefone validado no formato brasileiro (XX) XXXXX-XXXX

---

### US-04: Definicao de Detalhes do Contrato
**Como** super administrador
**Eu quero** definir data de inicio, valor de caucao e clausula personalizada
**Para que** o contrato reflita as condicoes especificas acordadas

**Criterios de Aceitacao**:
- Campo de data de inicio (date picker) - obrigatorio
- Campo de valor de caucao (numerico, formato BRL) - obrigatorio
- Campo de texto livre para segunda clausula (acordo de pagamento) - obrigatorio, minimo 50 caracteres
- Valores monetarios formatados automaticamente (R$ X.XXX,XX)

---

### US-05: Adicao de Inventario de Moveis
**Como** super administrador
**Eu quero** descrever manualmente os moveis inclusos no imovel
**Para que** fique registrado no contrato o que foi entregue ao locatario

**Criterios de Aceitacao**:
- Campo de texto livre (textarea) com minimo 20 caracteres
- Placeholder sugerindo formato: "armario de pia com tampo em granito, guarda-roupa, fogao eletrico..."
- Campo obrigatorio
- Caractere counter exibindo quantidade atual/minimo

---

### US-06: Visualizacao e Download do Contrato
**Como** super administrador
**Eu quero** baixar o contrato gerado imediatamente apos a criacao
**Para que** eu possa imprimir e coletar assinaturas

**Criterios de Aceitacao**:
- Apos geracao bem-sucedida, modal exibe mensagem de sucesso
- Botao "Baixar PDF" claramente visivel
- Botao "Imprimir" abre dialogo de impressao do navegador
- Nome do arquivo: `contrato_locacao_[CPF_LOCATARIO]_[DATA].pdf`
- Arquivo gerado com 4 paginas conforme template

---

### US-07: Validacao de Campos Obrigatorios
**Como** super administrador
**Eu quero** ser notificado de campos faltantes antes da geracao
**Para que** eu nao gere contratos incompletos

**Criterios de Aceitacao**:
- Botao "Gerar Contrato" desabilitado enquanto houver campos invalidos
- Mensagens de erro especificas exibidas abaixo de cada campo invalido
- Sumario de erros no topo do formulario (quantidade de campos pendentes)
- Validacao em tempo real (on blur) e ao clicar em "Gerar"

---

### US-08: Restricao de Acesso por Permissao
**Como** desenvolvedor do sistema
**Eu quero** garantir que apenas super admins vejam a funcionalidade
**Para que** contratos nao sejam gerados por usuarios nao autorizados

**Criterios de Aceitacao**:
- Botao "Gerar Contrato" invisivel para usuarios sem permissao `is_superuser`
- Endpoint de API retorna 403 Forbidden se usuario nao for super admin
- Frontend valida permissoes antes de exibir modal
- Backend valida permissoes antes de gerar PDF

## Funcionalidades Principais

### 1. Botao de Acao na Listagem de Inquilinos

**O que faz**: Adiciona um botao "Gerar Contrato" na linha de cada inquilino (tabela de listagem) ou como acao em massa.

**Por que e importante**: Oferece acesso contextual e rapido a funcionalidade sem navegar para outras telas.

**Como funciona**:
- Renderizado condicionalmente apenas para usuarios com `is_superuser === true`
- Ao clicar, abre modal com formulario de geracao de contrato
- Icone representativo (ex: documento/file-text)

**Requisitos Funcionais**:
- **RF-01**: Botao visivel apenas para super admins
- **RF-02**: Botao posicionado na mesma linha do inquilino (coluna de acoes)
- **RF-03**: Ao clicar, abre modal sem redirecionar pagina
- **RF-04**: Tooltip exibe "Gerar Contrato de Locacao" ao passar mouse

---

### 2. Formulario Modal de Configuracao do Contrato

**O que faz**: Exibe formulario completo com todos os campos variaveis necessarios para gerar o contrato.

**Por que e importante**: Centraliza a entrada de dados em uma interface unica, evitando multiplas telas e melhorando a experiencia do usuario.

**Como funciona**:
- Modal responsivo com scroll interno para campos extensos
- Campos agrupados logicamente: Locador, Locatario, Detalhes do Contrato, Inventario
- Validacao em tempo real (on blur) e ao submeter formulario
- Botoes de acao: "Cancelar" e "Gerar Contrato"

**Requisitos Funcionais**:
- **RF-05**: Modal centralizado, overlay escurece fundo
- **RF-06**: Campos agrupados em secoes visiveis (acordeao ou tabs)
- **RF-07**: Botao "X" no canto superior direito fecha modal sem salvar
- **RF-08**: Formulario limpo ao fechar modal
- **RF-09**: Modal nao fecha ao clicar fora dele (previne perda de dados)

---

### 3. Validacao de Dados de Entrada

**O que faz**: Valida formatos, preenchimento obrigatorio e consistencia dos dados antes de enviar ao backend.

**Por que e importante**: Previne geracao de contratos invalidos, economiza requisicoes ao servidor e melhora UX com feedback imediato.

**Como funciona**:
- Validacao frontend (React Hook Form ou Formik)
- Validacao backend (Django Serializers)
- Mensagens de erro especificas e claras

**Requisitos Funcionais**:
- **RF-10**: CPF validado com algoritmo de digito verificador
- **RF-11**: RG aceita apenas numeros e SSP/UF
- **RF-12**: Email validado com regex padrao
- **RF-13**: Telefone validado no formato brasileiro
- **RF-14**: Valores monetarios aceitos apenas no formato numerico (conversao automatica)
- **RF-15**: Data de inicio deve ser maior ou igual a data atual
- **RF-16**: Texto da segunda clausula: minimo 50 caracteres
- **RF-17**: Inventario de moveis: minimo 20 caracteres

---

### 4. Geracao de PDF Programatica

**O que faz**: Gera PDF de 4 paginas seguindo estrutura exata do contrato padrao, preenchendo campos variaveis dinamicamente.

**Por que e importante**: Elimina dependencia de arquivos externos, permite total controle sobre conteudo e formatacao.

**Como funciona**:
- Biblioteca Python para geracao de PDF (ReportLab ou WeasyPrint)
- Template HTML/CSS convertido para PDF (se usar WeasyPrint)
- Estrutura de 4 paginas programada seguindo contrato_padrao.pdf

**Requisitos Funcionais**:
- **RF-18**: PDF gerado com dimensoes A4 (210mm x 297mm)
- **RF-19**: Fonte padrao: Times New Roman ou similar
- **RF-20**: Margens: 2cm superior/inferior, 2.5cm esquerda/direita
- **RF-21**: Pagina 1: Titulo, dados locador, locatario, objeto, clausulas PRIMEIRA, SEGUNDA, TERCEIRA, QUARTA
- **RF-22**: Pagina 2: Clausulas QUINTA, SEXTA, SETIMA, OITAVA, NONA
- **RF-23**: Pagina 3: Clausulas DECIMA ate DECIMA OITAVA, assinaturas
- **RF-24**: Pagina 4: Regimento interno fixo (texto identico ao contrato_padrao.pdf)
- **RF-25**: Campos variaveis substituidos corretamente em todas as clausulas
- **RF-26**: Formatacao de datas: DD de mes_extenso de YYYY
- **RF-27**: Formatacao de valores: R$ X.XXX,XX (por extenso onde aplicavel)

---

### 5. Download e Impressao do Contrato

**O que faz**: Disponibiliza o PDF gerado para download imediato e opcao de impressao.

**Por que e importante**: Permite uso imediato do contrato sem passos adicionais.

**Como funciona**:
- Backend retorna PDF como response binaria
- Frontend recebe e cria blob URL para download
- Botao de impressao abre dialogo nativo do navegador

**Requisitos Funcionais**:
- **RF-28**: Apos geracao, modal exibe mensagem de sucesso com icone
- **RF-29**: Botao "Baixar PDF" inicia download automatico
- **RF-30**: Botao "Imprimir" abre dialogo de impressao
- **RF-31**: Nome do arquivo: `contrato_locacao_[CPF]_[DATA].pdf`
- **RF-32**: Opcao "Fechar" retorna a listagem de inquilinos

---

### 6. Controle de Acesso e Permissoes

**O que faz**: Garante que apenas super administradores possam acessar e executar a funcionalidade.

**Por que e importante**: Protege a integridade dos contratos e evita uso indevido.

**Como funciona**:
- Frontend verifica `user.is_superuser` antes de renderizar botao
- Backend valida permissoes em decorator de view/endpoint
- Retorna 403 Forbidden para usuarios nao autorizados

**Requisitos Funcionais**:
- **RF-33**: Botao "Gerar Contrato" invisivel para usuarios sem `is_superuser`
- **RF-34**: Endpoint `/api/v1/contratos/gerar/` valida `is_superuser`
- **RF-35**: Retorna HTTP 403 com mensagem clara se usuario nao autorizado
- **RF-36**: Logs de auditoria registram usuario, timestamp e inquilino do contrato gerado

## Experiencia do Usuario

### Personas de Usuario

**Persona Primaria: Super Administrador (Alex)**
- **Perfil**: Gerente de propriedades, 35 anos, gerencia 15 unidades residenciais
- **Necessidades**: Gerar contratos rapidamente, garantir conformidade juridica, manter registros organizados
- **Frustracao atual**: Edicao manual de contratos em Word, erros de digitacao, tempo excessivo gasto
- **Objetivo**: Formalizar locacoes em menos de 5 minutos

### Fluxo de Usuario Principal

**Cenario**: Super admin precisa gerar contrato para novo inquilino aprovado

1. **Acessa listagem de inquilinos** (InquilinosListPage)
2. **Identifica inquilino** na tabela
3. **Clica em "Gerar Contrato"** (botao na linha do inquilino)
4. **Modal abre** com formulario de configuracao
5. **Preenche dados do locador**:
   - Nome completo
   - Nacionalidade, estado civil, profissao
   - CPF
   - Endereco completo
6. **Preenche dados do locatario**:
   - Nome completo
   - Nacionalidade, profissao
   - CPF, RG
   - Endereco, telefone, email
7. **Define detalhes do contrato**:
   - Data de inicio (date picker)
   - Valor de caucao (input numerico)
   - Segunda clausula (textarea - acordo de pagamento personalizado)
8. **Descreve inventario de moveis** (textarea)
9. **Revisa campos** - sistema valida em tempo real
10. **Clica em "Gerar Contrato"**
11. **Sistema valida** todos os campos obrigatorios
12. **Loading spinner** exibido durante geracao (2-5s)
13. **Modal de sucesso** exibe confirmacao
14. **Clica em "Baixar PDF"** - arquivo baixado automaticamente
15. **Clica em "Imprimir"** (opcional) - dialogo de impressao abre
16. **Fecha modal** e retorna a listagem

**Tempo estimado**: 2-4 minutos

### Consideracoes de UI/UX

**Design do Modal**:
- Largura maxima: 800px
- Altura maxima: 90vh com scroll interno
- Cabecalho fixo com titulo "Gerar Contrato de Locacao"
- Rodape fixo com botoes de acao
- Secoes visiveis com bordas sutis

**Campos de Formulario**:
- Labels claras e descritivas
- Placeholders com exemplos de formato
- Asteriscos vermelhos para campos obrigatorios
- Mensagens de erro em vermelho abaixo do campo
- Campos de texto: altura confortavel (min 2 linhas para textareas)

**Feedback Visual**:
- Campos invalidos: borda vermelha
- Campos validos: borda verde (opcional)
- Botao "Gerar Contrato" desabilitado se formulario invalido
- Loading spinner durante geracao
- Icone de sucesso (checkmark verde) ao concluir

**Responsividade**:
- Desktop: modal 800px centralizado
- Tablet: modal 90% largura da tela
- Mobile: modal tela cheia com scroll

### Requisitos de Acessibilidade

- **ARIA labels**: Todos os campos com labels semanticos
- **Navegacao por teclado**: Tab order logico, Enter para submeter
- **Screen readers**: Mensagens de erro anunciadas
- **Contraste**: WCAG AA compliance (minimo 4.5:1)
- **Focus visible**: Outline claro em campos focados
- **Validacao acessivel**: Mensagens associadas a campos via `aria-describedby`

## Restricoes Tecnicas de Alto Nivel

### Integracao com Sistemas Existentes

- **Frontend**: React + TypeScript + Vite (ja existente)
- **Backend**: Django REST Framework (ja existente)
- **Autenticacao**: Sistema de usuarios Django com campo `is_superuser`
- **Pagina alvo**: `InquilinosListPage` (frontend/src/pages/InquilinosListPage.tsx)

### Conformidade e Seguranca

- **Validacao de permissoes**: Backend deve validar `is_superuser` em todas as requisicoes
- **Protecao de dados**: CPF, RG, email e telefone sao dados sensiveis (LGPD)
- **HTTPS**: Todas as requisicoes devem usar protocolo seguro em producao
- **Sanitizacao de inputs**: Prevenir XSS e SQL Injection

### Performance e Escalabilidade

- **Tempo de geracao de PDF**: Maximo 5 segundos
- **Tamanho do PDF**: Aproximadamente 150-200KB
- **Timeout de requisicao**: 30 segundos
- **Concorrencia**: Suportar geracao simultanea por multiplos super admins (ate 5 requisicoes simultâneas)

### Tecnologia e Bibliotecas

**Backend (Python/Django)**:
- **Geracao de PDF**: WeasyPrint (HTML/CSS para PDF) OU ReportLab (programatico)
- **Validacao de CPF**: Biblioteca `validate-docbr` ou logica customizada
- **Serializer**: Django REST Framework Serializer para validacao de inputs

**Frontend (React/TypeScript)**:
- **Validacao de formularios**: React Hook Form ou Formik
- **Date picker**: react-datepicker ou biblioteca similar
- **Modal**: Headless UI ou componente customizado
- **Formatacao de valores**: biblioteca `react-number-format` ou similar

### Requisitos de Dados e Privacidade

- **Armazenamento**: PDFs NAO serao persistidos no banco (apenas gerados sob demanda)
- **Logs de auditoria**: Registrar usuario, timestamp, CPF do locatario em logs do Django
- **Dados sensiveis**: CPF/RG/Email nao devem aparecer em logs publicos

## Nao-Objetivos (Fora de Escopo)

### Funcionalidades Excluidas da v1

1. **Persistencia de contratos no banco de dados**: Contratos serao gerados sob demanda, nao armazenados
2. **Modelo `Contrato` no Django**: Nao criaremos tabela para armazenar contratos
3. **Assinatura digital/eletronica**: Assinaturas serao coletadas manualmente (impressao)
4. **Versionamento de contratos**: Nao rastrearemos versoes ou alteracoes pos-geracao
5. **Templates multiplos**: Apenas um template de contrato (residencial) sera suportado
6. **Geracao de contratos para outros tipos de locacao**: Apenas locacao residencial
7. **Edicao de regimento interno**: Regimento fixo (nao editavel pelo usuario)
8. **Historico de contratos gerados por inquilino**: Nao manteremos registro de quantos contratos foram gerados
9. **Notificacao automatica ao inquilino**: Nao enviaremos email/SMS apos geracao
10. **Integracao com sistemas de assinatura (DocuSign, ClickSign)**: Fora de escopo
11. **Geracao em outros formatos (Word, ODT)**: Apenas PDF
12. **Campos dinamicos/customizaveis de clausulas**: Apenas segunda clausula editavel
13. **Pre-preenchimento de dados do inquilino**: Usuario deve digitar todos os dados manualmente

### Consideracoes Futuras (Roadmap)

- **Fase 2**: Persistencia de contratos e historico
- **Fase 3**: Assinatura eletronica integrada
- **Fase 4**: Templates multiplos (comercial, temporada, etc.)
- **Fase 5**: Geracao de aditivos contratuais

### Limites e Limitacoes

- **Complexidade juridica**: Clausulas nao podem ser editadas individualmente (exceto segunda)
- **Idioma**: Apenas portugues brasileiro
- **Tamanho de campos**: Segunda clausula limitada a 5000 caracteres, inventario a 2000 caracteres
- **Formato de CPF**: Apenas CPF brasileiro valido
- **Compatibilidade de navegadores**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Questoes em Aberto

### Requisitos Tecnicos

1. **Biblioteca de PDF**: Qual biblioteca usar - WeasyPrint (HTML/CSS) ou ReportLab (programatico)?
   - **Recomendacao**: WeasyPrint para facilitar manutencao e ajustes visuais
   - **Decisao pendente**: Validar performance em ambiente de producao

2. **Endpoint RESTful**: Estrutura ideal para endpoint de geracao?
   - **Proposta**: `POST /api/v1/contratos/gerar/` com payload JSON dos campos
   - **Alternativa**: `POST /api/v1/inquilinos/{id}/gerar-contrato/` (resource-based)

3. **Formato de resposta**: Retornar PDF como binary response ou URL temporaria?
   - **Recomendacao**: Binary response (Content-Type: application/pdf) para download imediato
   - **Decisao pendente**: Avaliar se URLs temporarias seriam necessarias

### Validacoes e Regras de Negocio

4. **Validacao de endereco**: Devemos validar CEP contra API dos Correios?
   - **Decisao pendente**: Definir se validacao de CEP e obrigatoria ou apenas formato

5. **Calculo automatico de valores**: Devemos calcular valores proporcionais automaticamente (como no exemplo do contrato)?
   - **Decisao pendente**: Definir se segunda clausula deve ter campos estruturados ou apenas texto livre

6. **Valores minimos/maximos**: Existe caucao minima/maxima permitida?
   - **Decisao pendente**: Definir regras de validacao de valores monetarios

### UX e Interface

7. **Auto-preenchimento**: Devemos salvar dados do locador em localStorage para proximas geracoes?
   - **Proposta**: Salvar ultimos valores de locador em localStorage (opcional)
   - **Decisao pendente**: Validar com stakeholders se e desejavel

8. **Preview do contrato**: Devemos exibir preview antes de gerar PDF?
   - **Proposta**: Adicionar em v2 se usuarios solicitarem
   - **Decisao pendente**: Validar necessidade com super admins

9. **Edicao pos-geracao**: Se usuario identificar erro, pode re-gerar sem fechar modal?
   - **Proposta**: Permitir voltar ao formulario apos geracao
   - **Decisao pendente**: Definir fluxo de correcao de erros

### Auditoria e Logs

10. **Nivel de detalhe dos logs**: Quais informacoes devem ser registradas?
    - **Proposta**: Usuario, timestamp, CPF locatario (hash), acao (geracao bem-sucedida/falha)
    - **Decisao pendente**: Definir se logs devem ser exportaveis para auditoria externa

11. **Retencao de logs**: Por quanto tempo manter registros de auditoria?
    - **Decisao pendente**: Definir politica de retencao conforme LGPD

### Testes e Qualidade

12. **Cobertura de testes**: Qual nivel de cobertura esperado?
    - **Recomendacao**: Minimo 85% (conforme rules/review.md)
    - **Decisao pendente**: Definir casos de teste prioritarios

13. **Testes de PDF**: Como validar estrutura e conteudo do PDF gerado?
    - **Proposta**: Testes de snapshot para estrutura HTML (se WeasyPrint) ou validacao de texto extraido
    - **Decisao pendente**: Escolher estrategia de teste

---

## Detalhamento Tecnico (Orientacao para Tech Spec)

### Estrutura de Campos Variaveis

**Dados do Locador**:
- `locador_nome_completo` (string, max 200 chars)
- `locador_nacionalidade` (string, max 50 chars)
- `locador_estado_civil` (string, max 30 chars)
- `locador_profissao` (string, max 100 chars)
- `locador_cpf` (string, formato XXX.XXX.XXX-XX)
- `locador_endereco_rua` (string, max 200 chars)
- `locador_endereco_numero` (string, max 20 chars)
- `locador_endereco_bairro` (string, max 100 chars)
- `locador_endereco_cidade` (string, max 100 chars)
- `locador_endereco_estado` (string, 2 chars - UF)
- `locador_endereco_cep` (string, formato XXXXX-XXX)

**Dados do Locatario**:
- `locatario_nome_completo` (string, max 200 chars)
- `locatario_nacionalidade` (string, max 50 chars)
- `locatario_profissao` (string, max 100 chars)
- `locatario_cpf` (string, formato XXX.XXX.XXX-XX)
- `locatario_rg` (string, max 20 chars)
- `locatario_rg_orgao` (string, max 20 chars - ex: SSP/SC)
- `locatario_endereco_completo` (string, max 300 chars)
- `locatario_telefone` (string, formato (XX) XXXXX-XXXX)
- `locatario_email` (string, email valido)

**Detalhes do Contrato**:
- `data_inicio` (date, formato YYYY-MM-DD)
- `valor_caucao` (decimal, 2 casas decimais)
- `clausula_segunda_customizada` (text, min 50 chars, max 5000 chars)

**Inventario e Outros**:
- `inventario_moveis` (text, min 20 chars, max 2000 chars)

**Campos Fixos (nao editaveis)**:
- Prazo: 12 meses
- Renovacao: Automatica
- Reajuste: IGPM anual
- Multa por atraso: 1% ao dia ate 20% + juros 1% ao mes
- Regimento interno: Texto fixo da pagina 4 do contrato_padrao.pdf

### Endpoints de API Propostos

**POST** `/api/v1/contratos/gerar/`

**Request Body**:
```json
{
  "locador": {
    "nome_completo": "ALEXSANDER VIEIRA",
    "nacionalidade": "brasileiro",
    "estado_civil": "casado",
    "profissao": "analista de sistemas",
    "cpf": "908.833.149-91",
    "endereco": {
      "rua": "Rua Bento Goncalves",
      "numero": "183",
      "bairro": "Centro",
      "cidade": "Florianopolis",
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
    "endereco_completo": "Avenida Max Schramm, 2700, CEP 88095-000, Florianopolis - SC",
    "telefone": "(48) 99811-3393",
    "email": "f.n.t.freitas@gmail.com"
  },
  "contrato": {
    "data_inicio": "2025-08-05",
    "valor_caucao": 1700.00,
    "clausula_segunda": "O aluguel convencionado e de R$ 1.700,00 mensais, devendo ser pago ate o dia dez do mes vincendo..."
  },
  "inventario_moveis": "armario de pia com tampo em granito, guarda-roupa, fogao eletrico Fischer duas bocas..."
}
```

**Response (Success)**:
- **Status**: 200 OK
- **Content-Type**: application/pdf
- **Headers**: `Content-Disposition: attachment; filename="contrato_locacao_063857409-94_2025-08-05.pdf"`
- **Body**: Binary PDF content

**Response (Validation Error)**:
- **Status**: 400 Bad Request
- **Content-Type**: application/json
```json
{
  "errors": {
    "locador.cpf": ["CPF invalido"],
    "contrato.clausula_segunda": ["Campo obrigatorio, minimo 50 caracteres"]
  }
}
```

**Response (Permission Denied)**:
- **Status**: 403 Forbidden
- **Content-Type**: application/json
```json
{
  "detail": "Apenas super administradores podem gerar contratos."
}
```

### Estrutura de Componentes Frontend

**Novos Componentes**:
1. `GerarContratoButton.tsx` - Botao na listagem de inquilinos
2. `GerarContratoModal.tsx` - Modal principal
3. `FormularioContrato.tsx` - Formulario completo
4. `SucessoContratoModal.tsx` - Modal de sucesso com download

**Hooks Customizados**:
- `useGerarContrato.ts` - Logica de submissao e geracao
- `useValidacaoContrato.ts` - Validacoes customizadas (CPF, RG, etc.)

### Estrutura Backend

**Novo Modulo**: `aptos/contratos/`

**Arquivos**:
- `views.py` - View para endpoint de geracao
- `serializers.py` - Serializers de validacao
- `pdf_generator.py` - Logica de geracao de PDF
- `validators.py` - Validacoes customizadas (CPF, RG, etc.)
- `permissions.py` - Permissao `IsSuperAdminUser`

**Testes**:
- `tests/test_geracao_contrato.py` - Testes de geracao
- `tests/test_validacoes.py` - Testes de validacao
- `tests/test_permissions.py` - Testes de permissoes

### Criterios de Aceitacao Globais

**Funcionalidade**:
- [ ] Super admin consegue gerar contrato completo em menos de 3 minutos
- [ ] PDF gerado possui exatamente 4 paginas
- [ ] Todos os campos variaveis sao preenchidos corretamente no PDF
- [ ] Regimento interno aparece identico ao contrato_padrao.pdf
- [ ] Valores monetarios formatados como R$ X.XXX,XX
- [ ] Datas formatadas como DD de mes_extenso de YYYY

**Validacao**:
- [ ] Sistema impede geracao com campos obrigatorios vazios
- [ ] CPF validado com algoritmo de digito verificador
- [ ] Email validado com regex padrao
- [ ] Mensagens de erro claras e especificas

**Seguranca**:
- [ ] Usuarios nao super admin nao veem botao "Gerar Contrato"
- [ ] Endpoint retorna 403 para usuarios sem permissao
- [ ] Dados sensiveis nao aparecem em logs publicos

**Performance**:
- [ ] PDF gerado em menos de 5 segundos
- [ ] Modal abre em menos de 500ms
- [ ] Formulario responsivo em todas as telas

**Testes**:
- [ ] Cobertura de testes >= 85%
- [ ] Testes de integracao para endpoint de geracao
- [ ] Testes de validacao para todos os campos
- [ ] Testes de permissao para super admin

**Documentacao**:
- [ ] README atualizado com instrucoes de uso
- [ ] Tech Spec completa com detalhes de implementacao
- [ ] Comentarios no codigo explicando logica de geracao de PDF

---

## Riscos e Mitigacoes

### Riscos Tecnicos

**R1: Complexidade da Geracao de PDF**
- **Risco**: Dificuldade em replicar formatacao exata do contrato_padrao.pdf
- **Impacto**: Alto
- **Mitigacao**:
  - Escolher WeasyPrint para maior controle via HTML/CSS
  - Criar template HTML iterativamente comparando com PDF original
  - Testes visuais de snapshot

**R2: Performance de Geracao**
- **Risco**: Geracao de PDF demore mais de 5 segundos
- **Impacto**: Medio
- **Mitigacao**:
  - Otimizar template HTML (evitar imagens pesadas)
  - Cachear configuracoes de PDF
  - Considerar geracao assincrona se necessario (Celery)

**R3: Validacao de CPF/RG**
- **Risco**: Algoritmos de validacao nao cobrem todos os casos
- **Impacto**: Baixo
- **Mitigacao**:
  - Usar biblioteca consolidada (`validate-docbr`)
  - Testes abrangentes com casos extremos

### Riscos de Negocio

**R4: Mudancas Legais no Contrato**
- **Risco**: Lei de locacoes ou regulamento interno mudarem
- **Impacto**: Alto
- **Mitigacao**:
  - Template de PDF versionado em codigo (facil rastrear mudancas via Git)
  - Documentar fonte legal de cada clausula
  - Revisao juridica periodica

**R5: Adocao Baixa por Super Admins**
- **Risco**: Usuarios continuarem gerando contratos manualmente
- **Impacto**: Alto
- **Mitigacao**:
  - Treinamento de super admins
  - UX intuitiva e rapida
  - Demonstracao de economia de tempo

### Riscos de Experiencia do Usuario

**R6: Formulario Muito Extenso**
- **Risco**: Usuarios abandonarem preenchimento
- **Impacto**: Medio
- **Mitigacao**:
  - Agrupar campos em secoes logicas
  - Salvar progresso em localStorage (opcional)
  - Progress bar visual

**R7: Mensagens de Erro Confusas**
- **Risco**: Usuarios nao entenderem como corrigir erros
- **Impacto**: Medio
- **Mitigacao**:
  - Mensagens de erro especificas e acionaveis
  - Exemplos de formato correto em placeholders
  - Testes de usabilidade com super admins

### Riscos de Conformidade

**R8: LGPD - Vazamento de Dados Sensiveis**
- **Risco**: CPF/RG/email expostos em logs ou erros
- **Impacto**: Alto
- **Mitigacao**:
  - Sanitizar logs (hash de CPF)
  - HTTPS obrigatorio em producao
  - Auditoria de seguranca

---

## Fases de Implementacao

### Fase 1: Setup e Estrutura Base (Sprint 1 - 1 semana)
**Objetivo**: Criar estrutura basica de backend e frontend

**Backend**:
- Criar modulo `aptos/contratos/`
- Configurar endpoint `/api/v1/contratos/gerar/`
- Implementar serializers de validacao
- Configurar permissao `IsSuperAdminUser`
- Testes unitarios de validacao

**Frontend**:
- Criar componente `GerarContratoButton`
- Criar componente `GerarContratoModal` (estrutura vazia)
- Integrar botao na `InquilinosListPage`
- Configurar roteamento e permissoes

**Entregavel**: Botao funcional que abre modal vazio

---

### Fase 2: Formulario e Validacoes (Sprint 2 - 1 semana)
**Objetivo**: Implementar formulario completo com validacoes

**Backend**:
- Implementar validadores customizados (CPF, RG, email, telefone)
- Configurar serializers completos
- Testes de validacao abrangentes

**Frontend**:
- Implementar `FormularioContrato` completo
- Integrar React Hook Form
- Validacao em tempo real (on blur)
- Mensagens de erro especificas
- Testes de componentes

**Entregavel**: Formulario funcional com validacoes completas

---

### Fase 3: Geracao de PDF (Sprint 3 - 2 semanas)
**Objetivo**: Implementar logica de geracao de PDF programatica

**Backend**:
- Instalar e configurar WeasyPrint
- Criar template HTML/CSS do contrato (4 paginas)
- Implementar `pdf_generator.py`
- Testes de geracao com dados mockados
- Testes de conteudo (validar texto no PDF gerado)

**Validacoes**:
- PDF gerado com 4 paginas
- Formatacao identica ao contrato_padrao.pdf
- Todos os campos variaveis preenchidos

**Entregavel**: Endpoint gerando PDF completo

---

### Fase 4: Integracao Frontend-Backend (Sprint 4 - 1 semana)
**Objetivo**: Conectar formulario a endpoint de geracao

**Frontend**:
- Implementar `useGerarContrato` hook
- Conectar formulario ao endpoint
- Loading states durante geracao
- Tratamento de erros
- Implementar `SucessoContratoModal`
- Funcionalidade de download e impressao

**Backend**:
- Ajustes de performance
- Logs de auditoria

**Entregavel**: Fluxo completo end-to-end funcional

---

### Fase 5: Testes e Refinamento (Sprint 5 - 1 semana)
**Objetivo**: Atingir cobertura de testes >= 85% e refinar UX

**Backend**:
- Testes de integracao
- Testes de permissoes
- Testes de performance (tempo de geracao)
- Code review

**Frontend**:
- Testes de componentes (Vitest)
- Testes de integracao (opcional: Playwright)
- Acessibilidade (WCAG AA)
- Responsividade (mobile/tablet/desktop)

**Refinamentos**:
- Ajustes de UX baseados em feedback
- Otimizacoes de performance
- Documentacao

**Entregavel**: Feature production-ready com 85%+ de cobertura

---

### Fase 6: Deploy e Treinamento (Sprint 6 - 3 dias)
**Objetivo**: Deploy em producao e capacitacao de usuarios

**Deploy**:
- Deploy em ambiente de staging
- Testes de aceitacao com super admins
- Deploy em producao
- Monitoramento de logs

**Treinamento**:
- Documentacao de usuario (passo a passo)
- Sessao de treinamento com super admins
- FAQ de duvidas comuns

**Entregavel**: Feature em producao e usuarios treinados

---

## Metricas de Acompanhamento Pos-Lancamento

### Metricas de Uso
- **Contratos gerados por semana**: Meta >= 5 contratos/semana
- **Taxa de adocao**: Meta >= 80% dos contratos gerados pelo sistema
- **Tempo medio de geracao**: Meta < 3 minutos

### Metricas de Qualidade
- **Taxa de erro na geracao**: Meta < 1%
- **Contratos com campos invalidos**: Meta = 0%
- **Tempo de resposta do endpoint**: Meta < 5 segundos (p95)

### Metricas de Satisfacao
- **NPS de super admins**: Meta >= 8
- **Tickets de suporte relacionados**: Meta < 2/mes
- **Solicitacoes de melhoria**: Rastrear e priorizar

---

## Conclusao

Este PRD define de forma completa e acionavel a funcionalidade de geracao automatizada de contratos de locacao residencial. A implementacao seguira o template padronizado existente, garantindo consistencia juridica, eficiencia operacional e seguranca de dados.

A funcionalidade sera desenvolvida em 6 fases ao longo de 6-7 semanas, com entregas incrementais e validacoes continuas. O sucesso sera medido por metricas de uso, qualidade e satisfacao do usuario.

Proximos passos:
1. Validacao e aprovacao deste PRD pelos stakeholders
2. Criacao da Tech Spec detalhada pelo time de engenharia
3. Priorizacao no backlog e alocacao de recursos
4. Inicio da Fase 1 (Setup e Estrutura Base)

---

**Documento criado em**: 2025-10-04
**Versao**: 1.0
**Autor**: Claude Code Agent
**Aprovadores**: [Pendente]
**Proxima revisao**: [A definir apos aprovacao]
