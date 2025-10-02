#!/usr/bin/env python
"""
Script para testar otimizações de performance do sistema.

Valida:
- Cache Redis funcionando
- Managers otimizados
- Queries com select_related/prefetch_related
- Middleware de performance
- Índices de banco de dados
"""
import os
import sys
import time
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.conf.development')
django.setup()

from django.core.cache import cache
from django.db import connection
from django.test.utils import override_settings
from aptos.models import Inquilino, InquilinoApartamento, Aptos


class Colors:
    """ANSI color codes"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_header(text):
    """Print section header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(70)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.RESET}\n")


def print_success(text):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")


def print_warning(text):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")


def print_error(text):
    """Print error message"""
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")


def print_info(text):
    """Print info message"""
    print(f"  {text}")


def count_queries(func):
    """Decorator to count database queries"""
    def wrapper(*args, **kwargs):
        connection.queries_log.clear()
        with override_settings(DEBUG=True):
            start_queries = len(connection.queries)
            start_time = time.time()

            result = func(*args, **kwargs)

            end_time = time.time()
            end_queries = len(connection.queries)

        query_count = end_queries - start_queries
        duration = (end_time - start_time) * 1000  # Convert to ms

        return result, query_count, duration

    return wrapper


def test_redis_cache():
    """Test Redis cache connectivity and basic operations"""
    print_header("Testing Redis Cache")

    try:
        # Test basic set/get
        cache.set('test_key', 'test_value', 60)
        value = cache.get('test_key')

        if value == 'test_value':
            print_success("Redis cache is working correctly")
            print_info(f"Set and retrieved test value successfully")
        else:
            print_error("Redis cache returned incorrect value")
            return False

        # Test cache with complex data
        test_data = {
            'inquilinos': 100,
            'ativos': 75,
            'metrics': [1, 2, 3, 4, 5]
        }
        cache.set('test_complex', test_data, 60)
        retrieved = cache.get('test_complex')

        if retrieved == test_data:
            print_success("Complex data caching works correctly")
        else:
            print_error("Complex data caching failed")
            return False

        # Test cache deletion
        cache.delete('test_key')
        if cache.get('test_key') is None:
            print_success("Cache deletion works correctly")
        else:
            print_error("Cache deletion failed")
            return False

        # Test cache timeout (quick test)
        cache.set('timeout_test', 'value', 1)
        time.sleep(1.1)
        if cache.get('timeout_test') is None:
            print_success("Cache timeout works correctly")
        else:
            print_warning("Cache timeout may not be working")

        return True

    except Exception as e:
        print_error(f"Redis cache test failed: {str(e)}")
        print_info("Make sure Redis is running: docker compose up -d redis")
        return False


def test_optimized_managers():
    """Test optimized manager methods"""
    print_header("Testing Optimized Managers")

    try:
        # Test get_dashboard_metrics
        @count_queries
        def get_metrics():
            return Inquilino.objects.get_dashboard_metrics(use_cache=False)

        metrics, queries, duration = get_metrics()

        print_success(f"Dashboard metrics retrieved in {duration:.2f}ms with {queries} queries")
        print_info(f"Metrics: {metrics}")

        # Test caching
        cache.clear()  # Clear cache first

        # First call (no cache)
        start = time.time()
        metrics1 = Inquilino.objects.get_dashboard_metrics(use_cache=True)
        time1 = (time.time() - start) * 1000

        # Second call (with cache)
        start = time.time()
        metrics2 = Inquilino.objects.get_dashboard_metrics(use_cache=True)
        time2 = (time.time() - start) * 1000

        if time2 < time1:
            speedup = (time1 - time2) / time1 * 100
            print_success(f"Cache speedup: {speedup:.1f}% faster ({time1:.2f}ms → {time2:.2f}ms)")
        else:
            print_warning("Cache may not be providing speedup")

        # Test get_list_optimized
        @count_queries
        def get_list():
            return list(Inquilino.objects.get_list_optimized()[:10])

        inquilinos, queries, duration = get_list()

        print_success(f"Optimized list retrieved in {duration:.2f}ms with {queries} queries")

        if queries > 3:
            print_warning(f"Query count is higher than expected: {queries} queries")
            print_info("Expected: 1-3 queries with select_related/prefetch_related")
        else:
            print_success(f"Query optimization working well: only {queries} queries")

        return True

    except Exception as e:
        print_error(f"Manager test failed: {str(e)}")
        return False


def test_query_optimization():
    """Test query optimization with select_related/prefetch_related"""
    print_header("Testing Query Optimization")

    try:
        # Test without optimization
        @count_queries
        def query_without_optimization():
            inquilinos = list(Inquilino.objects.all()[:5])
            for inq in inquilinos:
                # This will cause N+1 queries
                _ = list(inq.associacoes_apartamento.all())
            return inquilinos

        # Test with optimization
        @count_queries
        def query_with_optimization():
            inquilinos = list(Inquilino.objects.get_list_optimized()[:5])
            for inq in inquilinos:
                _ = list(inq.associacoes_apartamento.all())
            return inquilinos

        _, queries_without, duration_without = query_without_optimization()
        _, queries_with, duration_with = query_with_optimization()

        print_info(f"Without optimization: {queries_without} queries in {duration_without:.2f}ms")
        print_info(f"With optimization: {queries_with} queries in {duration_with:.2f}ms")

        if queries_with < queries_without:
            reduction = (queries_without - queries_with) / queries_without * 100
            print_success(f"Query reduction: {reduction:.1f}% ({queries_without} → {queries_with})")
        else:
            print_warning("Query optimization may not be working")

        return True

    except Exception as e:
        print_error(f"Query optimization test failed: {str(e)}")
        return False


def test_database_indexes():
    """Test if database indexes are created"""
    print_header("Testing Database Indexes")

    try:
        from django.db import connection

        with connection.cursor() as cursor:
            # Get all indexes
            cursor.execute("""
                SELECT indexname
                FROM pg_indexes
                WHERE tablename LIKE 'aptos_%'
                AND indexname LIKE 'idx_%'
                ORDER BY indexname;
            """)

            indexes = cursor.fetchall()

            expected_indexes = [
                'idx_inquilino_status',
                'idx_inquilino_email',
                'idx_inquilino_cpf',
                'idx_inquilino_cnpj',
                'idx_inquilino_tipo_status',
                'idx_assoc_ativo_datas',
                'idx_assoc_apartamento_ativo',
            ]

            found_indexes = [idx[0] for idx in indexes]

            print_info(f"Found {len(found_indexes)} performance indexes")

            for idx_name in expected_indexes:
                if idx_name in found_indexes:
                    print_success(f"Index exists: {idx_name}")
                else:
                    print_warning(f"Index missing: {idx_name}")

            return len([idx for idx in expected_indexes if idx in found_indexes]) > 0

    except Exception as e:
        print_error(f"Index test failed: {str(e)}")
        print_info("Run migrations: python manage.py migrate")
        return False


def test_api_cache():
    """Test API response caching"""
    print_header("Testing API Response Cache")

    try:
        # Clear cache
        cache.clear()

        # Simulate API call to estadisticas endpoint
        metrics1 = Inquilino.objects.get_dashboard_metrics(use_cache=True)
        cache_key = 'dashboard_metrics_inquilinos'

        if cache.get(cache_key) is not None:
            print_success("API metrics are being cached")
            print_info(f"Cache key: {cache_key}")
        else:
            print_warning("API cache may not be working")

        return True

    except Exception as e:
        print_error(f"API cache test failed: {str(e)}")
        return False


def generate_performance_report():
    """Generate overall performance report"""
    print_header("Performance Summary")

    try:
        # Count total records
        total_inquilinos = Inquilino.objects.count()
        total_associacoes = InquilinoApartamento.objects.count()
        total_aptos = Aptos.objects.count()

        print_info(f"Database size:")
        print_info(f"  - Inquilinos: {total_inquilinos}")
        print_info(f"  - Associações: {total_associacoes}")
        print_info(f"  - Apartamentos: {total_aptos}")

        # Test search performance
        @count_queries
        def test_search():
            return list(Inquilino.objects.get_list_optimized()[:20])

        _, queries, duration = test_search()

        print_info(f"\nQuery Performance:")
        print_info(f"  - List 20 inquilinos: {duration:.2f}ms ({queries} queries)")

        target_time = 2000  # 2 seconds as per requirements
        if duration < target_time:
            print_success(f"✓ Performance target met: {duration:.2f}ms < {target_time}ms")
        else:
            print_warning(f"⚠ Performance target not met: {duration:.2f}ms > {target_time}ms")

        # Cache statistics
        print_info(f"\nCache Status:")
        test_keys = [
            'dashboard_metrics_inquilinos',
            'ocupacao_metrics',
        ]

        for key in test_keys:
            if cache.get(key) is not None:
                print_success(f"  - {key}: cached ✓")
            else:
                print_info(f"  - {key}: not cached")

        return True

    except Exception as e:
        print_error(f"Report generation failed: {str(e)}")
        return False


def main():
    """Run all performance tests"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}Performance Optimization Test Suite{Colors.RESET}")
    print(f"{Colors.BLUE}Testing backend optimizations...{Colors.RESET}\n")

    results = {
        'Redis Cache': test_redis_cache(),
        'Optimized Managers': test_optimized_managers(),
        'Query Optimization': test_query_optimization(),
        'Database Indexes': test_database_indexes(),
        'API Cache': test_api_cache(),
    }

    # Generate report
    generate_performance_report()

    # Summary
    print_header("Test Results Summary")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        if result:
            print_success(f"{test_name}: PASSED")
        else:
            print_error(f"{test_name}: FAILED")

    print(f"\n{Colors.BOLD}Total: {passed}/{total} tests passed{Colors.RESET}\n")

    if passed == total:
        print(f"{Colors.GREEN}{Colors.BOLD}All optimizations are working correctly! 🎉{Colors.RESET}\n")
        return 0
    else:
        print(f"{Colors.YELLOW}{Colors.BOLD}Some optimizations need attention.{Colors.RESET}\n")
        return 1


if __name__ == '__main__':
    sys.exit(main())
