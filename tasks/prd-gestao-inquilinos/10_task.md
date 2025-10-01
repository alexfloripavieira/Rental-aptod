---
status: pending
parallelizable: true
blocked_by: ["4.0", "6.0"]
---

<task_context>
<domain>backend/reporting</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
<unblocks>11.0</unblocks>
</task_context>

# Tarefa 10.0: Implementar sistema de relatórios e analytics

## Visão Geral
Desenvolver sistema completo de relatórios e analytics para inquilinos, incluindo relatórios predefinidos, métricas de ocupação, exportação em múltiplos formatos, e dashboard com indicadores chave de performance.

## Requisitos
- Relatórios predefinidos conforme PRD
- Métricas de ocupação e rotatividade
- Exportação em PDF e Excel
- Filtros por período e critérios
- Gráficos e visualizações
- API endpoints para dados
- Cache de relatórios pesados
- Agendamento de relatórios

## Subtarefas
- [ ] 10.1 Criar modelos de dados para relatórios
- [ ] 10.2 Implementar relatório de inquilinos ativos
- [ ] 10.3 Desenvolver relatório de ocupação
- [ ] 10.4 Criar relatório de inadimplentes
- [ ] 10.5 Implementar exportação PDF/Excel
- [ ] 10.6 Desenvolver API endpoints
- [ ] 10.7 Criar sistema de cache
- [ ] 10.8 Implementar agendamento automático

## Sequenciamento
- Bloqueado por: 4.0 (API base), 6.0 (Associações)
- Desbloqueia: 11.0 (Dashboard frontend)
- Paralelizável: Sim (pode ser paralelo com frontend)

## Detalhes de Implementação

### Modelos para Relatórios
```python
# aptos/models.py (extensão)
from django.db import models
from django.contrib.auth.models import User
import uuid

class RelatorioTemplate(models.Model):
    """Templates de relatórios predefinidos"""
    TIPO_CHOICES = [
        ('INQUILINOS_ATIVOS', 'Inquilinos Ativos'),
        ('OCUPACAO', 'Taxa de Ocupação'),
        ('INADIMPLENTES', 'Inadimplentes'),
        ('ROTATIVIDADE', 'Rotatividade'),
        ('HISTORICO_LOCACOES', 'Histórico de Locações'),
    ]

    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    descricao = models.TextField()
    query_sql = models.TextField()  # Query SQL personalizada
    parametros_padrao = models.JSONField(default=dict)
    ativo = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome

class RelatorioExecucao(models.Model):
    """Registro de execuções de relatórios"""
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('PROCESSANDO', 'Processando'),
        ('CONCLUIDO', 'Concluído'),
        ('ERRO', 'Erro'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(RelatorioTemplate, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)

    parametros = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')

    # Resultados
    total_registros = models.IntegerField(null=True, blank=True)
    arquivo_gerado = models.FileField(upload_to='relatorios/', null=True, blank=True)
    formato = models.CharField(max_length=10, default='PDF')  # PDF, EXCEL, JSON

    # Tempos
    iniciado_em = models.DateTimeField(auto_now_add=True)
    concluido_em = models.DateTimeField(null=True, blank=True)

    # Erro
    erro_detalhes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-iniciado_em']

    def duracao_segundos(self):
        if self.concluido_em:
            return (self.concluido_em - self.iniciado_em).total_seconds()
        return None

class MetricaOcupacao(models.Model):
    """Métricas de ocupação calculadas periodicamente"""
    data_referencia = models.DateField()
    total_apartamentos = models.IntegerField()
    apartamentos_ocupados = models.IntegerField()
    taxa_ocupacao = models.DecimalField(max_digits=5, decimal_places=2)

    # Detalhes por tipo
    pf_ocupados = models.IntegerField(default=0)
    pj_ocupados = models.IntegerField(default=0)

    # Médias
    tempo_medio_locacao_dias = models.IntegerField(null=True)
    valor_medio_aluguel = models.DecimalField(max_digits=10, decimal_places=2, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['data_referencia']
        ordering = ['-data_referencia']
```

### Serviços de Relatórios
```python
# aptos/services/relatorio_service.py
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import date, timedelta
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import pandas as pd
import io

class RelatorioService:
    """Serviço para geração de relatórios"""

    def gerar_relatorio_inquilinos_ativos(self, data_inicio=None, data_fim=None,
                                         incluir_documentos=False):
        """Gera relatório de inquilinos ativos"""
        query = Inquilino.objects.filter(status='ATIVO')

        if data_inicio:
            query = query.filter(created_at__gte=data_inicio)
        if data_fim:
            query = query.filter(created_at__lte=data_fim)

        inquilinos = query.select_related().prefetch_related(
            'associacoes_apartamento__apartamento__building_name'
        )

        dados = []
        for inquilino in inquilinos:
            associacoes_ativas = inquilino.associacoes_apartamento.filter(ativo=True)

            apartamentos = ', '.join([
                f"{assoc.apartamento.unit_number} ({assoc.apartamento.building_name.name})"
                for assoc in associacoes_ativas
            ])

            dados.append({
                'id': inquilino.id,
                'tipo': inquilino.get_tipo_display(),
                'nome': inquilino.nome_completo or inquilino.razao_social,
                'documento': inquilino.cpf or inquilino.cnpj,
                'email': inquilino.email,
                'telefone': inquilino.telefone,
                'apartamentos': apartamentos,
                'data_cadastro': inquilino.created_at.strftime('%d/%m/%Y'),
            })

        return {
            'dados': dados,
            'total': len(dados),
            'periodo': {
                'inicio': data_inicio.strftime('%d/%m/%Y') if data_inicio else 'Início',
                'fim': data_fim.strftime('%d/%m/%Y') if data_fim else 'Atual'
            }
        }

    def gerar_relatorio_ocupacao(self, data_inicio=None, data_fim=None):
        """Gera relatório de ocupação de apartamentos"""
        if not data_inicio:
            data_inicio = date.today() - timedelta(days=365)
        if not data_fim:
            data_fim = date.today()

        # Calcular métricas por mês
        dados_mensais = []
        current_date = data_inicio.replace(day=1)

        while current_date <= data_fim:
            # Próximo mês
            if current_date.month == 12:
                next_month = current_date.replace(year=current_date.year + 1, month=1)
            else:
                next_month = current_date.replace(month=current_date.month + 1)

            # Calcular ocupação no período
            total_apartamentos = Aptos.objects.count()

            ocupados = InquilinoApartamento.objects.filter(
                data_inicio__lte=next_month - timedelta(days=1),
                Q(data_fim__isnull=True) | Q(data_fim__gte=current_date),
                ativo=True
            ).values('apartamento').distinct().count()

            taxa = (ocupados / total_apartamentos * 100) if total_apartamentos > 0 else 0

            dados_mensais.append({
                'mes': current_date.strftime('%m/%Y'),
                'total_apartamentos': total_apartamentos,
                'ocupados': ocupados,
                'vagos': total_apartamentos - ocupados,
                'taxa_ocupacao': round(taxa, 2)
            })

            current_date = next_month

        # Métricas gerais
        taxa_atual = dados_mensais[-1]['taxa_ocupacao'] if dados_mensais else 0
        media_ocupacao = sum(d['taxa_ocupacao'] for d in dados_mensais) / len(dados_mensais) if dados_mensais else 0

        return {
            'dados_mensais': dados_mensais,
            'resumo': {
                'taxa_atual': taxa_atual,
                'media_periodo': round(media_ocupacao, 2),
                'melhor_mes': max(dados_mensais, key=lambda x: x['taxa_ocupacao']) if dados_mensais else None,
                'pior_mes': min(dados_mensais, key=lambda x: x['taxa_ocupacao']) if dados_mensais else None,
            }
        }

    def gerar_relatorio_inadimplentes(self, incluir_historico=True):
        """Gera relatório de inquilinos inadimplentes"""
        inadimplentes = Inquilino.objects.filter(
            status='INADIMPLENTE'
        ).select_related().prefetch_related(
            'historico_status',
            'associacoes_apartamento__apartamento__building_name'
        )

        dados = []
        for inquilino in inadimplentes:
            # Encontrar quando ficou inadimplente
            historico_inadimplencia = inquilino.historico_status.filter(
                status_novo='INADIMPLENTE'
            ).first()

            dias_inadimplente = 0
            if historico_inadimplencia:
                dias_inadimplente = (timezone.now().date() - historico_inadimplencia.timestamp.date()).days

            # Apartamentos atuais
            associacoes_ativas = inquilino.associacoes_apartamento.filter(ativo=True)
            apartamentos_info = []

            for assoc in associacoes_ativas:
                apartamentos_info.append({
                    'numero': assoc.apartamento.unit_number,
                    'edificio': assoc.apartamento.building_name.name,
                    'valor_aluguel': float(assoc.valor_aluguel) if assoc.valor_aluguel else 0,
                    'inicio_locacao': assoc.data_inicio.strftime('%d/%m/%Y')
                })

            dados.append({
                'id': inquilino.id,
                'nome': inquilino.nome_completo or inquilino.razao_social,
                'documento': inquilino.cpf or inquilino.cnpj,
                'email': inquilino.email,
                'telefone': inquilino.telefone,
                'dias_inadimplente': dias_inadimplente,
                'data_inadimplencia': historico_inadimplencia.timestamp.strftime('%d/%m/%Y') if historico_inadimplencia else 'N/A',
                'apartamentos': apartamentos_info,
                'valor_total': sum(apt['valor_aluguel'] for apt in apartamentos_info)
            })

        # Resumos
        total_inadimplentes = len(dados)
        valor_total_risco = sum(d['valor_total'] for d in dados)

        return {
            'dados': dados,
            'resumo': {
                'total_inadimplentes': total_inadimplentes,
                'valor_total_risco': valor_total_risco,
                'media_dias_inadimplencia': sum(d['dias_inadimplente'] for d in dados) / total_inadimplentes if total_inadimplentes > 0 else 0
            }
        }

    def exportar_para_pdf(self, dados_relatorio, tipo_relatorio, filename=None):
        """Exporta relatório para PDF usando ReportLab"""
        if not filename:
            filename = f"relatorio_{tipo_relatorio}_{date.today().strftime('%Y%m%d')}.pdf"

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        styles = getSampleStyleSheet()

        # Título
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1  # Center
        )

        titulo = f"Relatório - {tipo_relatorio.replace('_', ' ').title()}"
        story.append(Paragraph(titulo, title_style))
        story.append(Spacer(1, 20))

        # Informações do relatório
        info_style = styles['Normal']
        info_text = f"Gerado em: {date.today().strftime('%d/%m/%Y')}<br/>"

        if 'periodo' in dados_relatorio:
            info_text += f"Período: {dados_relatorio['periodo']['inicio']} a {dados_relatorio['periodo']['fim']}<br/>"

        story.append(Paragraph(info_text, info_style))
        story.append(Spacer(1, 20))

        # Tabela de dados
        if tipo_relatorio == 'INQUILINOS_ATIVOS':
            headers = ['Nome', 'Tipo', 'Documento', 'Email', 'Apartamentos']
            table_data = [headers]

            for item in dados_relatorio['dados']:
                table_data.append([
                    item['nome'][:30],  # Truncar nomes longos
                    item['tipo'],
                    item['documento'],
                    item['email'][:25],
                    item['apartamentos'][:20]
                ])

        elif tipo_relatorio == 'OCUPACAO':
            headers = ['Mês', 'Total Apts', 'Ocupados', 'Taxa %']
            table_data = [headers]

            for item in dados_relatorio['dados_mensais']:
                table_data.append([
                    item['mes'],
                    str(item['total_apartamentos']),
                    str(item['ocupados']),
                    f"{item['taxa_ocupacao']}%"
                ])

        elif tipo_relatorio == 'INADIMPLENTES':
            headers = ['Nome', 'Documento', 'Dias', 'Valor R$']
            table_data = [headers]

            for item in dados_relatorio['dados']:
                table_data.append([
                    item['nome'][:30],
                    item['documento'],
                    str(item['dias_inadimplente']),
                    f"R$ {item['valor_total']:.2f}"
                ])

        # Criar tabela
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        story.append(table)

        # Resumo (se houver)
        if 'resumo' in dados_relatorio:
            story.append(Spacer(1, 20))
            story.append(Paragraph("Resumo:", styles['Heading3']))

            resumo_text = ""
            for key, value in dados_relatorio['resumo'].items():
                label = key.replace('_', ' ').title()
                resumo_text += f"{label}: {value}<br/>"

            story.append(Paragraph(resumo_text, styles['Normal']))

        doc.build(story)
        buffer.seek(0)
        return buffer

    def exportar_para_excel(self, dados_relatorio, tipo_relatorio, filename=None):
        """Exporta relatório para Excel usando pandas"""
        if not filename:
            filename = f"relatorio_{tipo_relatorio}_{date.today().strftime('%Y%m%d')}.xlsx"

        buffer = io.BytesIO()

        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            if tipo_relatorio == 'INQUILINOS_ATIVOS':
                df = pd.DataFrame(dados_relatorio['dados'])
                df.to_excel(writer, sheet_name='Inquilinos Ativos', index=False)

            elif tipo_relatorio == 'OCUPACAO':
                df = pd.DataFrame(dados_relatorio['dados_mensais'])
                df.to_excel(writer, sheet_name='Ocupação Mensal', index=False)

                # Adicionar resumo em outra aba
                resumo_df = pd.DataFrame([dados_relatorio['resumo']])
                resumo_df.to_excel(writer, sheet_name='Resumo', index=False)

            elif tipo_relatorio == 'INADIMPLENTES':
                df = pd.DataFrame(dados_relatorio['dados'])
                df.to_excel(writer, sheet_name='Inadimplentes', index=False)

        buffer.seek(0)
        return buffer

# Instância global do serviço
relatorio_service = RelatorioService()
```

### API Views para Relatórios
```python
# aptos/views.py (extensão)
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from .services.relatorio_service import relatorio_service

class RelatorioViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def inquilinos_ativos(self, request):
        """Relatório de inquilinos ativos"""
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        formato = request.query_params.get('formato', 'json')

        if data_inicio:
            data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
        if data_fim:
            data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()

        dados = relatorio_service.gerar_relatorio_inquilinos_ativos(
            data_inicio=data_inicio,
            data_fim=data_fim
        )

        if formato.lower() == 'pdf':
            buffer = relatorio_service.exportar_para_pdf(dados, 'INQUILINOS_ATIVOS')
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="inquilinos_ativos.pdf"'
            return response

        elif formato.lower() == 'excel':
            buffer = relatorio_service.exportar_para_excel(dados, 'INQUILINOS_ATIVOS')
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="inquilinos_ativos.xlsx"'
            return response

        return Response(dados)

    @action(detail=False, methods=['get'])
    def ocupacao(self, request):
        """Relatório de ocupação"""
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        formato = request.query_params.get('formato', 'json')

        if data_inicio:
            data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
        if data_fim:
            data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()

        dados = relatorio_service.gerar_relatorio_ocupacao(
            data_inicio=data_inicio,
            data_fim=data_fim
        )

        if formato.lower() == 'pdf':
            buffer = relatorio_service.exportar_para_pdf(dados, 'OCUPACAO')
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="ocupacao.pdf"'
            return response

        elif formato.lower() == 'excel':
            buffer = relatorio_service.exportar_para_excel(dados, 'OCUPACAO')
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="ocupacao.xlsx"'
            return response

        return Response(dados)

    @action(detail=False, methods=['get'])
    def inadimplentes(self, request):
        """Relatório de inadimplentes"""
        formato = request.query_params.get('formato', 'json')

        dados = relatorio_service.gerar_relatorio_inadimplentes()

        if formato.lower() == 'pdf':
            buffer = relatorio_service.exportar_para_pdf(dados, 'INADIMPLENTES')
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="inadimplentes.pdf"'
            return response

        elif formato.lower() == 'excel':
            buffer = relatorio_service.exportar_para_excel(dados, 'INADIMPLENTES')
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="inadimplentes.xlsx"'
            return response

        return Response(dados)

    @action(detail=False, methods=['get'])
    def metricas_dashboard(self, request):
        """Métricas para dashboard"""
        # Métricas básicas
        total_inquilinos = Inquilino.objects.count()
        inquilinos_ativos = Inquilino.objects.filter(status='ATIVO').count()
        inadimplentes = Inquilino.objects.filter(status='INADIMPLENTE').count()

        # Taxa de ocupação atual
        total_apartamentos = Aptos.objects.count()
        apartamentos_ocupados = InquilinoApartamento.objects.filter(
            ativo=True,
            data_inicio__lte=date.today(),
            Q(data_fim__isnull=True) | Q(data_fim__gte=date.today())
        ).values('apartamento').distinct().count()

        taxa_ocupacao = (apartamentos_ocupados / total_apartamentos * 100) if total_apartamentos > 0 else 0

        # Tendência mensal (últimos 6 meses)
        tendencia = []
        for i in range(6):
            data_ref = date.today() - timedelta(days=30 * i)
            ocupados_mes = InquilinoApartamento.objects.filter(
                ativo=True,
                data_inicio__lte=data_ref,
                Q(data_fim__isnull=True) | Q(data_fim__gte=data_ref)
            ).values('apartamento').distinct().count()

            tendencia.append({
                'mes': data_ref.strftime('%m/%Y'),
                'ocupados': ocupados_mes,
                'taxa': (ocupados_mes / total_apartamentos * 100) if total_apartamentos > 0 else 0
            })

        return Response({
            'resumo': {
                'total_inquilinos': total_inquilinos,
                'inquilinos_ativos': inquilinos_ativos,
                'inadimplentes': inadimplentes,
                'apartamentos_ocupados': apartamentos_ocupados,
                'taxa_ocupacao': round(taxa_ocupacao, 2)
            },
            'tendencia_ocupacao': list(reversed(tendencia))
        })
```

## Critérios de Sucesso
- [ ] Relatório de inquilinos ativos funcionando
- [ ] Relatório de ocupação com métricas corretas
- [ ] Relatório de inadimplentes completo
- [ ] Exportação PDF funcionando
- [ ] Exportação Excel funcionando
- [ ] API endpoints respondendo corretamente
- [ ] Métricas de dashboard precisas
- [ ] Performance adequada para relatórios grandes
- [ ] Sistema de cache implementado
- [ ] Testes cobrindo cenários principais