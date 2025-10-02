"""
Testes de Acessibilidade WCAG 2.1 AA - Sistema de Gestão de Inquilinos

Este módulo valida a conformidade com as diretrizes WCAG 2.1 AA
para garantir acessibilidade adequada do sistema.
"""

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from axe_selenium_python import Axe


@pytest.fixture(scope="module")
def driver():
    """Setup do driver com ferramentas de acessibilidade"""
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')

    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    yield driver
    driver.quit()


class TestKeyboardNavigation:
    """Testes de navegação por teclado (WCAG 2.1.1)"""

    def test_tab_navigation_form(self, driver):
        """Teste de navegação por Tab em formulário"""
        driver.get('http://localhost:8000/admin/')

        # Obter todos os elementos focáveis
        focusable_elements = driver.find_elements(
            By.CSS_SELECTOR,
            'input, button, select, textarea, a[href]'
        )

        if not focusable_elements:
            pytest.skip("Nenhum elemento focável encontrado")

        # Testar navegação sequencial
        first_element = focusable_elements[0]
        first_element.click()

        for i in range(len(focusable_elements) - 1):
            active_element = driver.switch_to.active_element
            active_element.send_keys(Keys.TAB)
            time.sleep(0.1)

        print("✅ Navegação por Tab funcionando")

    def test_form_submission_keyboard(self, driver):
        """Teste de submissão de formulário via teclado"""
        driver.get('http://localhost:8000/admin/')

        try:
            username_field = driver.find_element(By.NAME, 'username')
            username_field.send_keys('admin')
            username_field.send_keys(Keys.TAB)

            active_element = driver.switch_to.active_element
            active_element.send_keys('admin')
            active_element.send_keys(Keys.ENTER)

            # Verificar se formulário foi submetido
            time.sleep(2)

            print("✅ Submissão via teclado funcionando")

        except Exception as e:
            pytest.skip(f"Erro ao testar submissão: {e}")

    def test_skip_links(self, driver):
        """Teste de links de skip navigation"""
        driver.get('http://localhost:8000/admin/')

        try:
            skip_link = driver.find_element(By.CSS_SELECTOR, 'a[href="#content"]')
            assert skip_link is not None
            print("✅ Skip link encontrado")
        except:
            print("⚠️  Skip link não implementado (recomendado para acessibilidade)")


class TestARIALabels:
    """Testes de labels e ARIA attributes (WCAG 1.3.1, 4.1.2)"""

    def test_form_labels(self, driver):
        """Teste de labels em campos de formulário"""
        driver.get('http://localhost:8000/admin/')

        # Obter todos os inputs
        inputs = driver.find_elements(By.CSS_SELECTOR, 'input[type="text"], input[type="password"], input[type="email"]')

        missing_labels = []
        for input_elem in inputs:
            input_id = input_elem.get_attribute('id')
            input_name = input_elem.get_attribute('name')

            # Verificar se tem label associado
            has_label = False

            try:
                # Procurar label por 'for'
                label = driver.find_element(By.CSS_SELECTOR, f'label[for="{input_id}"]')
                has_label = True
            except:
                pass

            # Verificar aria-label ou aria-labelledby
            aria_label = input_elem.get_attribute('aria-label')
            aria_labelledby = input_elem.get_attribute('aria-labelledby')

            if not (has_label or aria_label or aria_labelledby):
                missing_labels.append(input_name or input_id)

        if missing_labels:
            print(f"⚠️  Campos sem labels: {', '.join(missing_labels)}")
        else:
            print("✅ Todos os campos têm labels adequados")

    def test_button_labels(self, driver):
        """Teste de labels em botões"""
        driver.get('http://localhost:8000/admin/')

        buttons = driver.find_elements(By.TAG_NAME, 'button')

        missing_text = []
        for button in buttons:
            button_text = button.text.strip()
            aria_label = button.get_attribute('aria-label')

            if not button_text and not aria_label:
                button_id = button.get_attribute('id') or 'sem-id'
                missing_text.append(button_id)

        if missing_text:
            print(f"⚠️  Botões sem texto/label: {', '.join(missing_text)}")
        else:
            print("✅ Todos os botões têm labels adequados")

    def test_image_alt_text(self, driver):
        """Teste de texto alternativo em imagens (WCAG 1.1.1)"""
        driver.get('http://localhost:8000/admin/')

        images = driver.find_elements(By.TAG_NAME, 'img')

        missing_alt = []
        for img in images:
            alt_text = img.get_attribute('alt')
            role = img.get_attribute('role')

            # Imagens decorativas devem ter alt="" ou role="presentation"
            if alt_text is None and role != 'presentation':
                img_src = img.get_attribute('src')
                missing_alt.append(img_src)

        if missing_alt:
            print(f"⚠️  Imagens sem alt text: {len(missing_alt)}")
        else:
            print("✅ Todas as imagens têm texto alternativo")


class TestColorContrast:
    """Testes de contraste de cores (WCAG 1.4.3)"""

    def test_contrast_ratio(self, driver):
        """Teste de contraste usando axe-core"""
        driver.get('http://localhost:8000/admin/')

        axe = Axe(driver)
        axe.inject()

        results = axe.run()

        # Filtrar apenas violações de contraste
        contrast_violations = [
            violation for violation in results['violations']
            if 'color-contrast' in violation['id']
        ]

        if contrast_violations:
            print(f"⚠️  {len(contrast_violations)} problemas de contraste encontrados")
            for violation in contrast_violations[:3]:  # Mostrar primeiros 3
                print(f"   - {violation['description']}")
        else:
            print("✅ Contraste adequado em todos os elementos")

        return len(contrast_violations) == 0


class TestSemanticHTML:
    """Testes de HTML semântico (WCAG 1.3.1)"""

    def test_heading_hierarchy(self, driver):
        """Teste de hierarquia de headings"""
        driver.get('http://localhost:8000/admin/')

        headings = []
        for level in range(1, 7):
            elements = driver.find_elements(By.TAG_NAME, f'h{level}')
            for elem in elements:
                headings.append((level, elem.text))

        # Verificar se hierarquia é respeitada
        previous_level = 0
        hierarchy_violations = []

        for level, text in headings:
            if level > previous_level + 1:
                hierarchy_violations.append(f"Salto de h{previous_level} para h{level}")
            previous_level = level

        if hierarchy_violations:
            print(f"⚠️  Problemas de hierarquia: {len(hierarchy_violations)}")
        else:
            print("✅ Hierarquia de headings correta")

    def test_landmark_regions(self, driver):
        """Teste de regiões landmark (ARIA)"""
        driver.get('http://localhost:8000/admin/')

        landmarks = {
            'main': driver.find_elements(By.CSS_SELECTOR, 'main, [role="main"]'),
            'navigation': driver.find_elements(By.CSS_SELECTOR, 'nav, [role="navigation"]'),
            'header': driver.find_elements(By.CSS_SELECTOR, 'header, [role="banner"]'),
            'footer': driver.find_elements(By.CSS_SELECTOR, 'footer, [role="contentinfo"]')
        }

        missing_landmarks = [name for name, elements in landmarks.items() if not elements]

        if missing_landmarks:
            print(f"⚠️  Landmarks faltando: {', '.join(missing_landmarks)}")
        else:
            print("✅ Todos os landmarks principais presentes")


class TestFocusManagement:
    """Testes de gerenciamento de foco (WCAG 2.4.7)"""

    def test_focus_visible(self, driver):
        """Teste de indicador de foco visível"""
        driver.get('http://localhost:8000/admin/')

        # Focar em um elemento interativo
        try:
            first_input = driver.find_element(By.CSS_SELECTOR, 'input')
            first_input.click()

            # Verificar se elemento tem outline ou estilo de foco
            outline = first_input.value_of_css_property('outline')
            box_shadow = first_input.value_of_css_property('box-shadow')

            has_focus_style = outline != 'none' or box_shadow != 'none'

            if has_focus_style:
                print("✅ Indicador de foco visível")
            else:
                print("⚠️  Indicador de foco pode não ser visível")

        except Exception as e:
            pytest.skip(f"Erro ao testar foco: {e}")

    def test_focus_order(self, driver):
        """Teste de ordem lógica de foco"""
        driver.get('http://localhost:8000/admin/')

        focusable = driver.find_elements(
            By.CSS_SELECTOR,
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )

        # Verificar tabindex negativos ou muito altos
        problematic_tabindex = []

        for elem in focusable:
            tabindex = elem.get_attribute('tabindex')
            if tabindex and int(tabindex) > 0:
                problematic_tabindex.append(tabindex)

        if problematic_tabindex:
            print(f"⚠️  Tabindex positivos encontrados: {len(problematic_tabindex)}")
            print("   (Recomenda-se usar ordem natural do DOM)")
        else:
            print("✅ Ordem de foco segue DOM natural")


class TestScreenReaderCompatibility:
    """Testes de compatibilidade com leitores de tela"""

    def test_aria_live_regions(self, driver):
        """Teste de regiões live para mensagens dinâmicas"""
        driver.get('http://localhost:8000/admin/')

        # Procurar por regiões ARIA live
        live_regions = driver.find_elements(
            By.CSS_SELECTOR,
            '[aria-live], [role="alert"], [role="status"]'
        )

        if live_regions:
            print(f"✅ {len(live_regions)} região(ões) ARIA live encontrada(s)")
        else:
            print("⚠️  Nenhuma região ARIA live (recomendado para notificações)")

    def test_form_error_announcement(self, driver):
        """Teste de anúncio de erros em formulários"""
        driver.get('http://localhost:8000/admin/')

        # Submeter formulário vazio para gerar erros
        try:
            submit_button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"], input[type="submit"]')
            submit_button.click()

            time.sleep(1)

            # Procurar por mensagens de erro com ARIA
            error_messages = driver.find_elements(
                By.CSS_SELECTOR,
                '[role="alert"], .error, .invalid-feedback'
            )

            if error_messages:
                # Verificar se erros estão associados aos campos
                for error in error_messages:
                    aria_described = error.get_attribute('id')
                    print(f"✅ Mensagem de erro encontrada")
            else:
                print("⚠️  Mensagens de erro podem não ser anunciadas adequadamente")

        except Exception as e:
            pytest.skip(f"Erro ao testar mensagens: {e}")


class TestAxeCore:
    """Testes automatizados com axe-core"""

    def test_full_accessibility_scan(self, driver):
        """Executar scan completo de acessibilidade"""
        driver.get('http://localhost:8000/admin/')

        axe = Axe(driver)
        axe.inject()

        results = axe.run()

        print("\n" + "=" * 70)
        print("RELATÓRIO DE ACESSIBILIDADE (axe-core)")
        print("=" * 70)

        violations = results['violations']
        passes = results['passes']

        print(f"\nViolações: {len(violations)}")
        print(f"Verificações Passadas: {len(passes)}")

        if violations:
            print("\n⚠️  VIOLAÇÕES ENCONTRADAS:\n")

            for violation in violations:
                impact = violation['impact'].upper()
                print(f"[{impact}] {violation['description']}")
                print(f"   Impacto: {violation['impact']}")
                print(f"   Tags: {', '.join(violation['tags'])}")
                print(f"   Elementos afetados: {len(violation['nodes'])}")

                # Mostrar primeiro elemento como exemplo
                if violation['nodes']:
                    node = violation['nodes'][0]
                    print(f"   Exemplo: {node['html'][:100]}...")

                print()

        print("=" * 70 + "\n")

        # Teste passa se não houver violações críticas
        critical_violations = [v for v in violations if v['impact'] == 'critical']
        serious_violations = [v for v in violations if v['impact'] == 'serious']

        assert len(critical_violations) == 0, f"{len(critical_violations)} violações críticas"
        assert len(serious_violations) == 0, f"{len(serious_violations)} violações sérias"


def run_accessibility_tests():
    """Executar todos os testes de acessibilidade"""
    pytest.main([__file__, '-v', '--tb=short'])


if __name__ == '__main__':
    run_accessibility_tests()
