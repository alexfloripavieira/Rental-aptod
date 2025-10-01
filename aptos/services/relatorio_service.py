"""
Serviço para geração de relatórios e analytics
"""
from django.db.models import Count, Avg, Q, F, Sum
from django.utils import timezone
from datetime import date, timedelta
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
import pandas as pd
import io

from aptos.models import Inquilino, Aptos, InquilinoApartamento, HistoricoStatus


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
                'apartamentos': apartamentos or 'Nenhum',
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
                Q(data_fim__isnull=True) | Q(data_fim__gte=current_date),
                data_inicio__lte=next_month - timedelta(days=1),
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
                if isinstance(value, dict):
                    resumo_text += f"{label}: {value.get('mes', 'N/A')} - {value.get('taxa_ocupacao', 0)}%<br/>"
                else:
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
                # Flatten apartamentos data
                flat_dados = []
                for item in dados_relatorio['dados']:
                    flat_item = {
                        'id': item['id'],
                        'nome': item['nome'],
                        'documento': item['documento'],
                        'email': item['email'],
                        'telefone': item['telefone'],
                        'dias_inadimplente': item['dias_inadimplente'],
                        'data_inadimplencia': item['data_inadimplencia'],
                        'valor_total': item['valor_total']
                    }
                    flat_dados.append(flat_item)

                df = pd.DataFrame(flat_dados)
                df.to_excel(writer, sheet_name='Inadimplentes', index=False)

        buffer.seek(0)
        return buffer


# Instância global do serviço
relatorio_service = RelatorioService()
