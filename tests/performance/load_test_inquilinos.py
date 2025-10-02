"""
Testes de Carga e Performance - Sistema de Gestão de Inquilinos

Este script executa testes de carga para validar performance do sistema
sob diferentes volumes de dados e requisições concorrentes.
"""

import time
import requests
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import random


class PerformanceMetrics:
    """Classe para coletar e reportar métricas de performance"""

    def __init__(self):
        self.response_times = []
        self.successful_requests = 0
        self.failed_requests = 0
        self.errors = []

    def add_result(self, response_time, success=True, error=None):
        self.response_times.append(response_time)
        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
            if error:
                self.errors.append(error)

    def get_report(self):
        if not self.response_times:
            return "Nenhum dado coletado"

        return {
            'total_requests': len(self.response_times),
            'successful': self.successful_requests,
            'failed': self.failed_requests,
            'avg_response_time': statistics.mean(self.response_times),
            'median_response_time': statistics.median(self.response_times),
            'min_response_time': min(self.response_times),
            'max_response_time': max(self.response_times),
            'p95_response_time': self._percentile(95),
            'p99_response_time': self._percentile(99),
            'errors': self.errors[:10]  # Primeiros 10 erros
        }

    def _percentile(self, percent):
        sorted_times = sorted(self.response_times)
        index = int(len(sorted_times) * (percent / 100))
        return sorted_times[index] if index < len(sorted_times) else sorted_times[-1]

    def print_report(self):
        report = self.get_report()
        print("\n" + "=" * 70)
        print("RELATÓRIO DE PERFORMANCE")
        print("=" * 70)
        print(f"Total de Requisições: {report['total_requests']}")
        print(f"Sucesso: {report['successful']} | Falhas: {report['failed']}")
        print("-" * 70)
        print(f"Tempo Médio de Resposta: {report['avg_response_time']:.3f}s")
        print(f"Tempo Mediano: {report['median_response_time']:.3f}s")
        print(f"Tempo Mínimo: {report['min_response_time']:.3f}s")
        print(f"Tempo Máximo: {report['max_response_time']:.3f}s")
        print(f"P95: {report['p95_response_time']:.3f}s")
        print(f"P99: {report['p99_response_time']:.3f}s")

        if report['errors']:
            print("\n⚠️  Erros encontrados:")
            for error in report['errors']:
                print(f"  - {error}")

        print("=" * 70 + "\n")


class LoadTester:
    """Classe principal para executar testes de carga"""

    def __init__(self, base_url="http://localhost:8000", auth_token=None):
        self.base_url = base_url
        self.session = requests.Session()
        if auth_token:
            self.session.headers.update({'Authorization': f'Token {auth_token}'})

    def test_list_inquilinos(self, num_requests=100, concurrent=10):
        """
        Teste de carga para listagem de inquilinos

        Args:
            num_requests: Número total de requisições
            concurrent: Número de requisições concorrentes
        """
        print(f"\n🔄 Teste: Listagem de Inquilinos")
        print(f"   Requisições: {num_requests} | Concorrência: {concurrent}")

        metrics = PerformanceMetrics()

        def make_request():
            start_time = time.time()
            try:
                response = self.session.get(f'{self.base_url}/api/v1/inquilinos/')
                response_time = time.time() - start_time

                if response.status_code == 200:
                    metrics.add_result(response_time, success=True)
                else:
                    metrics.add_result(
                        response_time,
                        success=False,
                        error=f"Status {response.status_code}"
                    )
            except Exception as e:
                response_time = time.time() - start_time
                metrics.add_result(response_time, success=False, error=str(e))

        with ThreadPoolExecutor(max_workers=concurrent) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            for future in as_completed(futures):
                future.result()

        metrics.print_report()
        return metrics

    def test_search_inquilinos(self, num_requests=100, concurrent=10):
        """
        Teste de carga para busca de inquilinos

        Args:
            num_requests: Número total de requisições
            concurrent: Número de requisições concorrentes
        """
        print(f"\n🔍 Teste: Busca de Inquilinos")
        print(f"   Requisições: {num_requests} | Concorrência: {concurrent}")

        metrics = PerformanceMetrics()
        search_terms = ['João', 'Maria', 'Silva', 'Santos', 'Empresa', 'Teste']

        def make_request():
            search_term = random.choice(search_terms)
            start_time = time.time()

            try:
                response = self.session.get(
                    f'{self.base_url}/api/v1/inquilinos/',
                    params={'search': search_term}
                )
                response_time = time.time() - start_time

                if response.status_code == 200:
                    metrics.add_result(response_time, success=True)
                else:
                    metrics.add_result(
                        response_time,
                        success=False,
                        error=f"Status {response.status_code}"
                    )
            except Exception as e:
                response_time = time.time() - start_time
                metrics.add_result(response_time, success=False, error=str(e))

        with ThreadPoolExecutor(max_workers=concurrent) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            for future in as_completed(futures):
                future.result()

        metrics.print_report()
        return metrics

    def test_create_inquilino(self, num_requests=50, concurrent=5):
        """
        Teste de carga para criação de inquilinos

        Args:
            num_requests: Número total de requisições
            concurrent: Número de requisições concorrentes
        """
        print(f"\n✏️  Teste: Criação de Inquilinos")
        print(f"   Requisições: {num_requests} | Concorrência: {concurrent}")

        metrics = PerformanceMetrics()

        def make_request(index):
            timestamp = int(time.time() * 1000) + index

            inquilino_data = {
                'tipo': random.choice(['PF', 'PJ']),
                'nome_completo': f'Teste Load {timestamp}' if random.random() > 0.5 else None,
                'razao_social': f'Empresa Load {timestamp}' if random.random() > 0.5 else None,
                'cpf': '52998224725',  # CPF válido
                'cnpj': '11222333000181',  # CNPJ válido
                'email': f'load.{timestamp}@test.com',
                'telefone': f'119{timestamp % 100000000:08d}',
                'status': 'ATIVO'
            }

            # Ajustar campos baseado no tipo
            if inquilino_data['tipo'] == 'PF':
                del inquilino_data['razao_social']
                del inquilino_data['cnpj']
            else:
                del inquilino_data['nome_completo']
                del inquilino_data['cpf']

            start_time = time.time()

            try:
                response = self.session.post(
                    f'{self.base_url}/api/v1/inquilinos/',
                    json=inquilino_data
                )
                response_time = time.time() - start_time

                if response.status_code == 201:
                    metrics.add_result(response_time, success=True)
                else:
                    metrics.add_result(
                        response_time,
                        success=False,
                        error=f"Status {response.status_code}: {response.text[:100]}"
                    )
            except Exception as e:
                response_time = time.time() - start_time
                metrics.add_result(response_time, success=False, error=str(e))

        with ThreadPoolExecutor(max_workers=concurrent) as executor:
            futures = [executor.submit(make_request, i) for i in range(num_requests)]
            for future in as_completed(futures):
                future.result()

        metrics.print_report()
        return metrics

    def test_get_inquilino_detail(self, num_requests=100, concurrent=10):
        """
        Teste de carga para detalhes de inquilino

        Args:
            num_requests: Número total de requisições
            concurrent: Número de requisições concorrentes
        """
        print(f"\n📄 Teste: Detalhes de Inquilino")
        print(f"   Requisições: {num_requests} | Concorrência: {concurrent}")

        # Obter lista de IDs de inquilinos
        try:
            response = self.session.get(f'{self.base_url}/api/v1/inquilinos/')
            inquilinos = response.json()['results']
            inquilino_ids = [inq['id'] for inq in inquilinos]

            if not inquilino_ids:
                print("⚠️  Nenhum inquilino disponível para teste")
                return None

        except Exception as e:
            print(f"❌ Erro ao obter lista de inquilinos: {e}")
            return None

        metrics = PerformanceMetrics()

        def make_request():
            inquilino_id = random.choice(inquilino_ids)
            start_time = time.time()

            try:
                response = self.session.get(
                    f'{self.base_url}/api/v1/inquilinos/{inquilino_id}/'
                )
                response_time = time.time() - start_time

                if response.status_code == 200:
                    metrics.add_result(response_time, success=True)
                else:
                    metrics.add_result(
                        response_time,
                        success=False,
                        error=f"Status {response.status_code}"
                    )
            except Exception as e:
                response_time = time.time() - start_time
                metrics.add_result(response_time, success=False, error=str(e))

        with ThreadPoolExecutor(max_workers=concurrent) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            for future in as_completed(futures):
                future.result()

        metrics.print_report()
        return metrics

    def run_full_suite(self):
        """Executa suite completa de testes de performance"""
        print("\n" + "=" * 70)
        print("INICIANDO SUITE COMPLETA DE TESTES DE CARGA")
        print("=" * 70)

        start_time = time.time()

        results = {
            'list': self.test_list_inquilinos(num_requests=100, concurrent=10),
            'search': self.test_search_inquilinos(num_requests=100, concurrent=10),
            'detail': self.test_get_inquilino_detail(num_requests=100, concurrent=10),
            'create': self.test_create_inquilino(num_requests=20, concurrent=5)
        }

        total_time = time.time() - start_time

        print("\n" + "=" * 70)
        print("RESUMO GERAL")
        print("=" * 70)
        print(f"Tempo Total: {total_time:.2f}s")

        for test_name, metrics in results.items():
            if metrics:
                report = metrics.get_report()
                print(f"\n{test_name.upper()}:")
                print(f"  Sucesso: {report['successful']}/{report['total_requests']}")
                print(f"  Tempo Médio: {report['avg_response_time']:.3f}s")
                print(f"  P95: {report['p95_response_time']:.3f}s")

        print("=" * 70 + "\n")


def main():
    """Função principal para executar testes de carga"""
    import argparse

    parser = argparse.ArgumentParser(description='Testes de Carga - Gestão de Inquilinos')
    parser.add_argument('--url', default='http://localhost:8000', help='URL base do sistema')
    parser.add_argument('--test', choices=['list', 'search', 'create', 'detail', 'full'],
                        default='full', help='Tipo de teste a executar')
    parser.add_argument('--requests', type=int, default=100,
                        help='Número de requisições')
    parser.add_argument('--concurrent', type=int, default=10,
                        help='Requisições concorrentes')

    args = parser.parse_args()

    tester = LoadTester(base_url=args.url)

    if args.test == 'full':
        tester.run_full_suite()
    elif args.test == 'list':
        tester.test_list_inquilinos(args.requests, args.concurrent)
    elif args.test == 'search':
        tester.test_search_inquilinos(args.requests, args.concurrent)
    elif args.test == 'create':
        tester.test_create_inquilino(args.requests, args.concurrent)
    elif args.test == 'detail':
        tester.test_get_inquilino_detail(args.requests, args.concurrent)


if __name__ == '__main__':
    main()
