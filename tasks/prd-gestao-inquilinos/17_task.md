---
status: pending
parallelizable: false
blocked_by: ["14.0", "16.0"]
---

<task_context>
<domain>testing/acceptance</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database,http_server</dependencies>
<unblocks>18.0</unblocks>
</task_context>

# Tarefa 17.0: Testes de aceitação e ajustes finais

## Visão Geral
Executar testes de aceitação completos com usuários finais, validar todos os cenários de uso do PRD, corrigir bugs encontrados, e realizar ajustes finais baseados no feedback dos stakeholders.

## Requisitos
- Testes com usuários reais (administradores prediais)
- Validação de todos os cenários do PRD
- Testes de usabilidade e acessibilidade
- Testes de performance com carga real
- Correção de bugs críticos e médios
- Refinamentos de UX baseados em feedback
- Validação de compliance LGPD
- Aprovação dos stakeholders

## Subtarefas
- [ ] 17.1 Preparar ambiente de testes de aceitação
- [ ] 17.2 Executar testes com usuários finais
- [ ] 17.3 Realizar testes de performance e carga
- [ ] 17.4 Validar compliance e segurança
- [ ] 17.5 Corrigir bugs críticos e médios
- [ ] 17.6 Implementar melhorias de UX
- [ ] 17.7 Validar acessibilidade e responsividade
- [ ] 17.8 Obter aprovação final dos stakeholders

## Sequenciamento
- Bloqueado por: 14.0 (Testes), 16.0 (Integração)
- Desbloqueia: 18.0 (Documentação e deploy)
- Paralelizável: Não (validação final)

## Detalhes de Implementação

### Plano de Testes de Aceitação
```markdown
# PLANO_TESTES_ACEITACAO.md

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
```

### Scripts de Teste Automatizado
```python
# tests/acceptance/test_user_flows.py
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class TestUserAcceptance:
    @pytest.fixture
    def driver(self):
        """Setup do driver Selenium"""
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')  # Executar sem interface gráfica
        driver = webdriver.Chrome(options=options)
        driver.implicitly_wait(10)
        yield driver
        driver.quit()

    @pytest.fixture
    def login(self, driver):
        """Login automático antes dos testes"""
        driver.get('http://localhost:8000/login')
        driver.find_element(By.NAME, 'username').send_keys('admin')
        driver.find_element(By.NAME, 'password').send_keys('password')
        driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

        # Aguardar redirecionamento
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="dashboard"]'))
        )

    def test_cadastro_inquilino_pf_completo(self, driver, login):
        """Teste completo de cadastro de inquilino PF"""
        # Navegar para novo inquilino
        driver.get('http://localhost:8000/inquilinos/novo')

        # Verificar se formulário carregou
        assert driver.find_element(By.CSS_SELECTOR, '[data-testid="inquilino-form"]')

        # Selecionar Pessoa Física
        driver.find_element(By.CSS_SELECTOR, 'input[value="PF"]').click()

        # Preencher campos obrigatórios
        driver.find_element(By.NAME, 'nome_completo').send_keys('João Silva Santos')
        driver.find_element(By.NAME, 'cpf').send_keys('12345678901')
        driver.find_element(By.NAME, 'email').send_keys('joao.teste@email.com')
        driver.find_element(By.NAME, 'telefone').send_keys('11999999999')

        # Aguardar validação de CPF
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '.cpf-valid'))
        )

        # Submeter formulário
        driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

        # Verificar sucesso
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '.notification-success'))
        )

        # Verificar redirecionamento para lista
        assert '/inquilinos' in driver.current_url

        # Verificar se inquilino aparece na lista
        assert 'João Silva Santos' in driver.page_source

    def test_busca_e_filtros(self, driver, login):
        """Teste do sistema de busca e filtros"""
        driver.get('http://localhost:8000/inquilinos')

        # Buscar por nome
        search_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="search-input"]')
        search_input.send_keys('João')

        # Aguardar resultados
        time.sleep(1)  # Aguardar debounce

        # Verificar se resultados foram filtrados
        results = driver.find_elements(By.CSS_SELECTOR, '[data-testid="inquilino-card"]')
        assert len(results) > 0

        # Aplicar filtro de status
        driver.find_element(By.CSS_SELECTOR, '[data-testid="filter-toggle"]').click()
        driver.find_element(By.CSS_SELECTOR, 'input[value="ATIVO"]').click()

        # Verificar se filtros foram aplicados
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="active-filter"]'))
        )

    def test_associacao_apartamento(self, driver, login):
        """Teste de associação com apartamento"""
        # Primeiro, acessar detalhes de um inquilino
        driver.get('http://localhost:8000/inquilinos/1')

        # Clicar em associar apartamento
        driver.find_element(By.CSS_SELECTOR, '[data-testid="associar-apartamento"]').click()

        # Selecionar apartamento
        apartment_select = driver.find_element(By.NAME, 'apartamento')
        apartment_select.click()
        driver.find_element(By.CSS_SELECTOR, 'option[value="1"]').click()

        # Definir data de início
        driver.find_element(By.NAME, 'data_inicio').send_keys('2024-01-01')

        # Informar valor
        driver.find_element(By.NAME, 'valor_aluguel').send_keys('1500.00')

        # Salvar
        driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

        # Verificar sucesso
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '.notification-success'))
        )

    def test_responsividade_mobile(self, driver, login):
        """Teste de responsividade mobile"""
        # Simular viewport mobile
        driver.set_window_size(375, 667)  # iPhone 6/7/8

        driver.get('http://localhost:8000/inquilinos')

        # Verificar se menu mobile existe
        assert driver.find_element(By.CSS_SELECTOR, '[data-testid="mobile-menu-toggle"]')

        # Verificar se cards se adaptaram
        cards = driver.find_elements(By.CSS_SELECTOR, '[data-testid="inquilino-card"]')
        if cards:
            # Verificar se largura do card se adaptou
            card_width = cards[0].size['width']
            viewport_width = driver.get_window_size()['width']
            assert card_width <= viewport_width

        # Testar formulário mobile
        driver.get('http://localhost:8000/inquilinos/novo')
        assert driver.find_element(By.CSS_SELECTOR, '[data-testid="mobile-form"]')

    def test_performance_basico(self, driver, login):
        """Teste básico de performance"""
        start_time = time.time()

        driver.get('http://localhost:8000/inquilinos')

        # Aguardar carregamento completo
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="inquilinos-list"]'))
        )

        load_time = time.time() - start_time

        # Verificar se carregou em menos de 3 segundos
        assert load_time < 3.0, f"Página levou {load_time:.2f}s para carregar"
```

### Checklist de Validação Final
```markdown
# CHECKLIST_VALIDACAO_FINAL.md

## Funcionalidades Principais ✅

### Cadastro de Inquilinos
- [ ] PF - todos os campos funcionando
- [ ] PJ - todos os campos funcionando
- [ ] Validação CPF em tempo real
- [ ] Validação CNPJ em tempo real
- [ ] Upload de documentos funcionando
- [ ] Formatação automática de campos

### Busca e Filtros
- [ ] Busca textual funcionando
- [ ] Filtro por status
- [ ] Filtro por tipo (PF/PJ)
- [ ] Filtro por apartamento
- [ ] Ordenação funcionando
- [ ] Paginação funcionando

### Gestão de Status
- [ ] Alteração manual de status
- [ ] Histórico de mudanças
- [ ] Regras de transição respeitadas
- [ ] Notificações funcionando

### Associações
- [ ] Associar inquilino a apartamento
- [ ] Validação de conflitos
- [ ] Histórico de associações
- [ ] Finalização de associações

### Relatórios
- [ ] Relatório de inquilinos ativos
- [ ] Relatório de ocupação
- [ ] Exportação em PDF
- [ ] Dados precisos

## Qualidade e Performance ✅

### Usabilidade
- [ ] Interface intuitiva
- [ ] Fluxos claros
- [ ] Mensagens de erro claras
- [ ] Feedback adequado ao usuário

### Performance
- [ ] Carregamento inicial < 3s
- [ ] Busca responsiva < 500ms
- [ ] Upload de arquivos eficiente
- [ ] Navegação fluida

### Responsividade
- [ ] Mobile (320px - 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1024px+)
- [ ] Orientação landscape/portrait

### Acessibilidade
- [ ] Navegação por teclado
- [ ] Contraste adequado
- [ ] Alt text em imagens
- [ ] ARIA labels
- [ ] Leitor de tela compatível

## Segurança e Compliance ✅

### LGPD
- [ ] Dados sensíveis criptografados
- [ ] Log de auditoria funcionando
- [ ] Controle de retenção
- [ ] Exercício de direitos implementado

### Segurança
- [ ] Autenticação funcionando
- [ ] Autorização por perfil
- [ ] Validação de inputs
- [ ] Sanitização de dados

### Backup e Recovery
- [ ] Backup automático configurado
- [ ] Restore testado
- [ ] Dados de documentos incluídos
- [ ] Procedimento documentado

## Aprovações Finais ✅

### Stakeholders
- [ ] Product Owner - aprovado
- [ ] Administrador Predial - aprovado
- [ ] Proprietário - aprovado
- [ ] TI/Segurança - aprovado
- [ ] Jurídico/LGPD - aprovado

### Documentação
- [ ] Manual do usuário completo
- [ ] Documentação técnica atualizada
- [ ] Procedures de deploy documentados
- [ ] Troubleshooting guide criado

---

**Data da Validação**: _____________
**Responsável**: ___________________
**Aprovado para Produção**: [ ] Sim [ ] Não
```

## Critérios de Sucesso
- [ ] Todos os cenários de teste executados com sucesso
- [ ] Feedback de usuários reais incorporado
- [ ] Performance validada em cenários reais
- [ ] Acessibilidade WCAG 2.1 AA validada
- [ ] Compliance LGPD verificado
- [ ] Bugs críticos e médios corrigidos
- [ ] Aprovação de todos os stakeholders
- [ ] Checklist de validação 100% completo
- [ ] Sistema pronto para produção
- [ ] Documentação final aprovada