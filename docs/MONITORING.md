# Monitoramento em Produção

## Componentes
- Prometheus/Grafana/Alertmanager (base): `monitoring/`
- HAProxy stats: `http://<host>:8404/stats`
- Health API: `GET /api/v1/health/`

## Passos (básico)
1. Ajustar `monitoring/prometheus.yml` com targets válidos.
2. Subir stack de monitoring (compose próprio, se desejado).
3. Importar dashboard `monitoring/grafana-dashboard.json`.

## KPIs sugeridos
- Latência P95/P99 de API
- Taxa de erro (4xx/5xx)
- Throughput (req/s)
- Uso de CPU/RAM por serviço
- Tamanho de bundle do frontend (builds)

## Alertas (exemplos)
- `5xx_rate > 1%` por 5min
- `latency_p95 > 800ms` por 10min
- `healthcheck_failure_count > 0`
