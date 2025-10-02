"""
Testes de Aceitação End-to-End - Sistema de Gestão de Inquilinos

Este módulo contém testes automatizados E2E que simulam o comportamento de usuários
reais no sistema, validando todos os fluxos principais do PRD.
"""

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException
import time
from datetime import datetime


@pytest.fixture(scope="module")
def driver():
    """Setup do driver Selenium com configurações para testes E2E"""
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')

    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    yield driver
    driver.quit()


@pytest.fixture(scope="module")
def authenticated_driver(driver):
    """Driver autenticado como administrador"""
    # Login como admin
    driver.get('http://localhost:8000/admin/')

    try:
        username_field = driver.find_element(By.NAME, 'username')
        password_field = driver.find_element(By.NAME, 'password')

        username_field.send_keys('admin')
        password_field.send_keys('admin')

        login_button = driver.find_element(By.CSS_SELECTOR, 'input[type="submit"]')
        login_button.click()

        # Aguardar login
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'content'))
        )

    except Exception as e:
        pytest.skip(f"Não foi possível autenticar: {e}")

    return driver


class TestCadastroInquilinosPF:
    """Cenário 1: Cadastro de Inquilino Pessoa Física"""

    def test_cadastro_pf_completo(self, authenticated_driver):
        """
        Teste completo de cadastro de inquilino PF via API

        Valida:
        - Criação de inquilino PF com todos os campos obrigatórios
        - Validação de CPF
        - Formatação automática
        - Resposta da API
        """
        import requests

        # Preparar dados do inquilino PF
        inquilino_data = {
            'tipo': 'PF',
            'nome_completo': 'João Silva Santos',
            'cpf': '52998224725',  # CPF válido para teste
            'email': f'joao.teste.{int(time.time())}@email.com',
            'telefone': '11999999999',
            'data_nascimento': '1990-01-15',
            'estado_civil': 'SOLTEIRO',
            'profissao': 'Engenheiro',
            'renda_mensal': '5000.00',
            'status': 'ATIVO'
        }

        # Fazer requisição para API
        response = requests.post(
            'http://localhost:8000/api/v1/inquilinos/',
            json=inquilino_data,
            cookies=authenticated_driver.get_cookies()
        )

        # Validar resposta
        assert response.status_code == 201, f"Erro ao criar inquilino: {response.text}"

        data = response.json()
        assert data['tipo'] == 'PF'
        assert data['nome_completo'] == 'João Silva Santos'
        assert data['cpf'] == '52998224725'
        assert data['status'] == 'ATIVO'

        print(f"✅ Inquilino PF criado com sucesso: ID {data['id']}")

        return data['id']

    def test_validacao_cpf_invalido(self, authenticated_driver):
        """Teste de validação de CPF inválido"""
        import requests

        inquilino_data = {
            'tipo': 'PF',
            'nome_completo': 'Maria Santos',
            'cpf': '11111111111',  # CPF inválido
            'email': f'maria.{int(time.time())}@email.com',
            'telefone': '11888888888'
        }

        response = requests.post(
            'http://localhost:8000/api/v1/inquilinos/',
            json=inquilino_data,
            cookies=authenticated_driver.get_cookies()
        )

        assert response.status_code == 400
        assert 'cpf' in response.json()

        print("✅ Validação de CPF inválido funcionando")

    def test_validacao_email_duplicado(self, authenticated_driver):
        """Teste de validação de email duplicado"""
        import requests

        email_unico = f'teste.duplicado.{int(time.time())}@email.com'

        # Criar primeiro inquilino
        inquilino1 = {
            'tipo': 'PF',
            'nome_completo': 'Primeiro Teste',
            'cpf': '52998224725',
            'email': email_unico,
            'telefone': '11999999999'
        }

        response1 = requests.post(
            'http://localhost:8000/api/v1/inquilinos/',
            json=inquilino1,
            cookies=authenticated_driver.get_cookies()
        )
        assert response1.status_code == 201

        # Tentar criar segundo com mesmo email
        inquilino2 = {
            'tipo': 'PF',
            'nome_completo': 'Segundo Teste',
            'cpf': '41521979037',  # CPF diferente
            'email': email_unico,  # Email duplicado
            'telefone': '11888888888'
        }

        response2 = requests.post(
            'http://localhost:8000/api/v1/inquilinos/',
            json=inquilino2,
            cookies=authenticated_driver.get_cookies()
        )

        assert response2.status_code == 400
        assert 'email' in response2.json()

        print("✅ Validação de email duplicado funcionando")


class TestCadastroInquilinosPJ:
    """Cenário 2: Cadastro de Inquilino Pessoa Jurídica"""

    def test_cadastro_pj_completo(self, authenticated_driver):
        """Teste completo de cadastro de inquilino PJ"""
        import requests

        inquilino_data = {
            'tipo': 'PJ',
            'razao_social': 'Empresa Teste Ltda',
            'nome_fantasia': 'Teste Corp',
            'cnpj': '11222333000181',  # CNPJ válido para teste
            'email': f'contato.{int(time.time())}@empresateste.com',
            'telefone': '11888888888',
            'inscricao_estadual': '123456789',
            'responsavel_legal': 'Carlos Responsável',
            'status': 'ATIVO'
        }

        response = requests.post(
            'http://localhost:8000/api/v1/inquilinos/',
            json=inquilino_data,
            cookies=authenticated_driver.get_cookies()
        )

        assert response.status_code == 201, f"Erro ao criar inquilino PJ: {response.text}"

        data = response.json()
        assert data['tipo'] == 'PJ'
        assert data['razao_social'] == 'Empresa Teste Ltda'
        assert data['cnpj'] == '11222333000181'

        print(f"✅ Inquilino PJ criado com sucesso: ID {data['id']}")

        return data['id']

    def test_validacao_cnpj_invalido(self, authenticated_driver):
        """Teste de validação de CNPJ inválido"""
        import requests

        inquilino_data = {
            'tipo': 'PJ',
            'razao_social': 'Empresa Teste 2',
            'cnpj': '11111111111111',  # CNPJ inválido
            'email': f'empresa.{int(time.time())}@teste.com',
            'telefone': '11777777777'
        }

        response = requests.post(
            'http://localhost:8000/api/v1/inquilinos/',
            json=inquilino_data,
            cookies=authenticated_driver.get_cookies()
        )

        assert response.status_code == 400
        assert 'cnpj' in response.json()

        print("✅ Validação de CNPJ inválido funcionando")


class TestBuscaEFiltros:
    """Cenário 3: Sistema de Busca e Filtros"""

    def test_busca_por_nome(self, authenticated_driver):
        """Teste de busca textual por nome"""
        import requests

        # Criar inquilino de teste
        inquilino_data = {
            'tipo': 'PF',
            'nome_completo': 'Roberto Busca Teste',
            'cpf': '52998224725',
            'email': f'roberto.busca.{int(time.time())}@test.com',
            'telefone': '11999999999'
        }

        create_response = requests.post(
            'http://localhost:8000/api/v1/inquilinos/',
            json=inquilino_data,
            cookies=authenticated_driver.get_cookies()
        )
        assert create_response.status_code == 201

        # Buscar por nome
        search_response = requests.get(
            'http://localhost:8000/api/v1/inquilinos/',
            params={'search': 'Roberto'},
            cookies=authenticated_driver.get_cookies()
        )

        assert search_response.status_code == 200
        results = search_response.json()['results']
        assert len(results) > 0
        assert any('Roberto' in r['nome_exibicao'] for r in results)

        print("✅ Busca por nome funcionando")

    def test_filtro_por_status(self, authenticated_driver):
        """Teste de filtro por status"""
        import requests

        response = requests.get(
            'http://localhost:8000/api/v1/inquilinos/',
            params={'status': 'ATIVO'},
            cookies=authenticated_driver.get_cookies()
        )

        assert response.status_code == 200
        results = response.json()['results']

        # Verificar que todos os resultados têm status ATIVO
        assert all(r['status'] == 'ATIVO' for r in results)

        print("✅ Filtro por status funcionando")

    def test_filtro_por_tipo(self, authenticated_driver):
        """Teste de filtro por tipo (PF/PJ)"""
        import requests

        response = requests.get(
            'http://localhost:8000/api/v1/inquilinos/',
            params={'tipo': 'PF'},
            cookies=authenticated_driver.get_cookies()
        )

        assert response.status_code == 200
        results = response.json()['results']

        # Verificar que todos os resultados são PF
        assert all(r['tipo'] == 'PF' for r in results)

        print("✅ Filtro por tipo funcionando")

    def test_paginacao(self, authenticated_driver):
        """Teste de paginação"""
        import requests

        response = requests.get(
            'http://localhost:8000/api/v1/inquilinos/',
            params={'page_size': 5},
            cookies=authenticated_driver.get_cookies()
        )

        assert response.status_code == 200
        data = response.json()

        assert 'results' in data
        assert 'count' in data
        assert 'next' in data
        assert 'previous' in data

        print("✅ Paginação funcionando")


class TestAssociacaoApartamento:
    """Cenário 4: Associação Inquilino-Apartamento"""

    def test_criar_associacao(self, authenticated_driver):
        """Teste de criação de associação inquilino-apartamento"""
        import requests

        # Criar inquilino de teste
        inquilino_data = {
            'tipo': 'PF',
            'nome_completo': 'Inquilino Associação',
            'cpf': '52998224725',
            'email': f'assoc.{int(time.time())}@test.com',
            'telefone': '11999999999'
        }

        inquilino_response = requests.post(
            'http://localhost:8000/api/v1/inquilinos/',
            json=inquilino_data,
            cookies=authenticated_driver.get_cookies()
        )
        inquilino_id = inquilino_response.json()['id']

        # Obter primeiro apartamento disponível
        aptos_response = requests.get(
            'http://localhost:8000/api/v1/aptos/',
            cookies=authenticated_driver.get_cookies()
        )
        apartamentos = aptos_response.json()['results']

        if not apartamentos:
            pytest.skip("Nenhum apartamento disponível para teste")

        apartamento_id = apartamentos[0]['id']

        # Criar associação
        associacao_data = {
            'inquilino': inquilino_id,
            'apartamento': apartamento_id,
            'data_inicio': datetime.now().strftime('%Y-%m-%d'),
            'valor_aluguel': '1500.00'
        }

        response = requests.post(
            'http://localhost:8000/api/v1/inquilino-apartamentos/',
            json=associacao_data,
            cookies=authenticated_driver.get_cookies()
        )

        assert response.status_code == 201, f"Erro ao criar associação: {response.text}"

        data = response.json()
        assert data['inquilino'] == inquilino_id
        assert data['apartamento'] == apartamento_id
        assert data['ativo'] is True

        print("✅ Associação criada com sucesso")


class TestGestaoStatus:
    """Cenário 5: Gestão de Status de Inquilinos"""

    def test_alterar_status(self, authenticated_driver):
        """Teste de alteração de status"""
        import requests

        # Criar inquilino
        inquilino_data = {
            'tipo': 'PF',
            'nome_completo': 'Status Test',
            'cpf': '52998224725',
            'email': f'status.{int(time.time())}@test.com',
            'telefone': '11999999999'
        }

        create_response = requests.post(
            'http://localhost:8000/api/v1/inquilinos/',
            json=inquilino_data,
            cookies=authenticated_driver.get_cookies()
        )
        inquilino_id = create_response.json()['id']

        # Alterar status
        status_response = requests.post(
            f'http://localhost:8000/api/v1/inquilinos/{inquilino_id}/alterar_status/',
            json={
                'status': 'INADIMPLENTE',
                'motivo': 'Teste de alteração de status'
            },
            cookies=authenticated_driver.get_cookies()
        )

        assert status_response.status_code == 200

        # Verificar status alterado
        get_response = requests.get(
            f'http://localhost:8000/api/v1/inquilinos/{inquilino_id}/',
            cookies=authenticated_driver.get_cookies()
        )

        assert get_response.json()['status'] == 'INADIMPLENTE'

        print("✅ Alteração de status funcionando")

    def test_historico_status(self, authenticated_driver):
        """Teste de histórico de mudanças de status"""
        import requests

        # Criar inquilino
        inquilino_data = {
            'tipo': 'PF',
            'nome_completo': 'Historico Test',
            'cpf': '52998224725',
            'email': f'historico.{int(time.time())}@test.com',
            'telefone': '11999999999'
        }

        create_response = requests.post(
            'http://localhost:8000/api/v1/inquilinos/',
            json=inquilino_data,
            cookies=authenticated_driver.get_cookies()
        )
        inquilino_id = create_response.json()['id']

        # Obter histórico
        historico_response = requests.get(
            f'http://localhost:8000/api/v1/inquilinos/{inquilino_id}/historico_status/',
            cookies=authenticated_driver.get_cookies()
        )

        assert historico_response.status_code == 200
        historico = historico_response.json()

        assert len(historico) > 0
        assert historico[0]['status'] == 'ATIVO'  # Status inicial

        print("✅ Histórico de status funcionando")


class TestPerformance:
    """Testes de Performance e Tempo de Resposta"""

    def test_performance_lista_inquilinos(self, authenticated_driver):
        """Teste de performance da listagem"""
        import requests
        import time

        start_time = time.time()

        response = requests.get(
            'http://localhost:8000/api/v1/inquilinos/',
            cookies=authenticated_driver.get_cookies()
        )

        end_time = time.time()
        response_time = end_time - start_time

        assert response.status_code == 200
        assert response_time < 2.0, f"Tempo de resposta muito lento: {response_time:.2f}s"

        print(f"✅ Performance lista: {response_time:.2f}s (< 2s)")

    def test_performance_busca(self, authenticated_driver):
        """Teste de performance da busca"""
        import requests
        import time

        start_time = time.time()

        response = requests.get(
            'http://localhost:8000/api/v1/inquilinos/',
            params={'search': 'teste'},
            cookies=authenticated_driver.get_cookies()
        )

        end_time = time.time()
        response_time = end_time - start_time

        assert response.status_code == 200
        assert response_time < 0.5, f"Busca muito lenta: {response_time:.2f}s"

        print(f"✅ Performance busca: {response_time:.2f}s (< 0.5s)")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
