from rest_framework import serializers
from .models import Builders, Aptos, Foto, BuilderFoto, Inquilino, InquilinoApartamento, HistoricoStatus, HistoricoAssociacao


class FotoSerializer(serializers.ModelSerializer):
    """Serializer para fotos dos apartamentos"""
    
    class Meta:
        model = Foto
        fields = ['id', 'photos', 'description']


class BuilderFotoSerializer(serializers.ModelSerializer):
    """Serializer para fotos das Empreendimentos"""
    
    class Meta:
        model = BuilderFoto
        fields = ['id', 'photos', 'description']


class BuildersSerializer(serializers.ModelSerializer):
    """Serializer para Empreendimentos com fotos relacionadas"""
    builder_fotos = BuilderFotoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Builders
        fields = [
            'id', 'name', 'street', 'neighborhood', 'city', 'state', 
            'zip_code', 'country', 'video', 'created_at', 'updated_at',
            'builder_fotos'
        ]


class BuildersListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para lista de Empreendimentos (sem fotos para performance)"""
    
    class Meta:
        model = Builders
        fields = ['id', 'name', 'city', 'state']


class BuildersAddressSerializer(serializers.ModelSerializer):
    """Serializer de endereço completo para uso em detalhes de Apartamento"""
    class Meta:
        model = Builders
        fields = [
            'id', 'name', 'street', 'neighborhood', 'city', 'state', 'zip_code', 'country'
        ]


class AptosSerializer(serializers.ModelSerializer):
    """Serializer completo para apartamentos com construtora e fotos"""
    fotos = FotoSerializer(many=True, read_only=True)
    # Para detalhes precisamos do endereço completo da construtora
    building_name = BuildersAddressSerializer(read_only=True)
    
    # Campos computados para facilitar frontend
    building_full_address = serializers.SerializerMethodField()
    photo_count = serializers.SerializerMethodField()
    has_video = serializers.SerializerMethodField()
    
    class Meta:
        model = Aptos
        fields = [
            'id', 'unit_number', 'floor', 'building_name', 'description',
            'rental_price', 'is_available', 'is_furnished', 'is_pets_allowed',
            'has_laundry', 'has_parking', 'has_internet', 'has_air_conditioning',
            'number_of_bedrooms', 'number_of_bathrooms', 'square_footage',
            'video', 'created_at', 'updated_at', 'fotos', 'building_full_address',
            'photo_count', 'has_video'
        ]
    
    def get_building_full_address(self, obj):
        """Retorna endereço completo da construtora"""
        if obj.building_name:
            return f"{obj.building_name.street}, {obj.building_name.neighborhood}, {obj.building_name.city} - {obj.building_name.state}"
        return None
    
    def get_photo_count(self, obj):
        """Retorna quantidade de fotos do apartamento"""
        return obj.fotos.count()
    
    def get_has_video(self, obj):
        """Retorna se o apartamento tem vídeo"""
        return bool(obj.video)


class AptosListSerializer(serializers.ModelSerializer):
    """Serializer otimizado para listagem de apartamentos (sem fotos completas)"""
    building_name = BuildersListSerializer(read_only=True)
    photo_count = serializers.SerializerMethodField()
    main_photo = serializers.SerializerMethodField()
    has_video = serializers.SerializerMethodField()
    
    class Meta:
        model = Aptos
        fields = [
            'id', 'unit_number', 'building_name', 'rental_price', 'is_available',
            'number_of_bedrooms', 'number_of_bathrooms', 'square_footage',
            'photo_count', 'main_photo', 'video', 'has_video'
        ]
    
    def get_photo_count(self, obj):
        """Retorna quantidade de fotos"""
        return obj.fotos.count()
    
    def get_main_photo(self, obj):
        """Retorna primeira foto como foto principal"""
        first_photo = obj.fotos.first()
        if first_photo and first_photo.photos:
            return self.context['request'].build_absolute_uri(first_photo.photos.url)
        return None

    def get_has_video(self, obj):
        """Indica se o apartamento possui vídeo"""
        return bool(getattr(obj, 'video', None))

# Serializers para Inquilinos
class InquilinoSerializer(serializers.ModelSerializer):
    """Serializer completo para inquilinos"""
    apartamentos_ativos = serializers.SerializerMethodField()
    documento_principal = serializers.SerializerMethodField()
    tempo_como_inquilino = serializers.SerializerMethodField()
    nome_exibicao = serializers.SerializerMethodField()
    
    class Meta:
        model = Inquilino
        fields = [
            'id', 'tipo', 'nome_completo', 'razao_social', 'nome_fantasia',
            'cpf', 'cnpj', 'rg', 'email', 'telefone', 'status',
            'data_nascimento', 'estado_civil', 'profissao', 'renda',
            'inscricao_estadual', 'responsavel_legal', 'endereco_completo',
            'observacoes', 'apartamentos_ativos', 'documento_principal',
            'tempo_como_inquilino', 'nome_exibicao', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_apartamentos_ativos(self, obj):
        """Retorna apartamentos com locação ativa"""
        apartamentos = obj.apartamentos.filter(
            associacoes_inquilino__ativo=True
        ).values('id', 'unit_number', 'building_name__name')
        return list(apartamentos)
    
    def get_documento_principal(self, obj):
        """Retorna CPF ou CNPJ formatado"""
        if obj.tipo == 'PF' and obj.cpf:
            return obj.cpf_formatado
        elif obj.tipo == 'PJ' and obj.cnpj:
            return obj.cnpj_formatado
        return None
    
    def get_tempo_como_inquilino(self, obj):
        """Calcula tempo total como inquilino em dias"""
        from datetime import date
        associacoes = obj.associacoes_apartamento.all()
        if not associacoes:
            return 0
        
        total_dias = 0
        for assoc in associacoes:
            inicio = assoc.data_inicio
            fim = assoc.data_fim or date.today()
            total_dias += (fim - inicio).days
        
        return total_dias
    
    def get_nome_exibicao(self, obj):
        """Nome para exibição baseado no tipo"""
        if obj.tipo == 'PF':
            return obj.nome_completo
        return obj.razao_social or obj.nome_fantasia
    
    def validate(self, data):
        """Validação customizada para tipo PF/PJ"""
        tipo = data.get('tipo')
        
        if tipo == 'PF':
            # Validar campos obrigatórios para PF
            required_fields = ['nome_completo', 'cpf', 'email']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(
                        f'{field} é obrigatório para pessoa física.'
                    )
        
        elif tipo == 'PJ':
            # Validar campos obrigatórios para PJ
            required_fields = ['razao_social', 'cnpj', 'email']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(
                        f'{field} é obrigatório para pessoa jurídica.'
                    )
        
        return data


class InquilinoListSerializer(serializers.ModelSerializer):
    """Serializer otimizado para listagem de inquilinos"""
    nome_exibicao = serializers.SerializerMethodField()
    documento = serializers.SerializerMethodField()
    apartamentos_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Inquilino
        fields = [
            'id', 'tipo', 'nome_exibicao', 'documento', 'email',
            'telefone', 'status', 'apartamentos_count', 'created_at'
        ]
    
    def get_nome_exibicao(self, obj):
        if obj.tipo == 'PF':
            return obj.nome_completo
        return obj.razao_social or obj.nome_fantasia
    
    def get_documento(self, obj):
        if obj.tipo == 'PF':
            return obj.cpf_formatado
        return obj.cnpj_formatado
    
    def get_apartamentos_count(self, obj):
        return obj.apartamentos.filter(
            associacoes_inquilino__ativo=True
        ).count()


class HistoricoStatusSerializer(serializers.ModelSerializer):
    """Serializer para histórico de status com campos expandidos"""
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    tempo_decorrido = serializers.SerializerMethodField()

    class Meta:
        model = HistoricoStatus
        fields = [
            'id', 'status_anterior', 'status_novo', 'motivo',
            'categoria_motivo', 'usuario_nome', 'timestamp',
            'tempo_decorrido', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp', 'usuario_nome', 'tempo_decorrido']

    def get_tempo_decorrido(self, obj):
        """Calcula tempo decorrido desde a mudança"""
        from django.utils import timezone
        
        delta = timezone.now() - obj.timestamp
        if delta.days > 0:
            return f"{delta.days} dias atrás"
        elif delta.seconds > 3600:
            horas = delta.seconds // 3600
            return f"{horas} horas atrás"
        else:
            minutos = delta.seconds // 60
            return f"{minutos} minutos atrás"


class AssociacaoSerializer(serializers.ModelSerializer):
    inquilino_nome = serializers.SerializerMethodField()
    apartamento_info = serializers.SerializerMethodField()
    duracao_meses = serializers.ReadOnlyField()
    esta_ativo = serializers.ReadOnlyField()

    class Meta:
        model = InquilinoApartamento
        fields = [
            'id', 'inquilino', 'apartamento', 'data_inicio', 'data_fim',
            'valor_aluguel', 'ativo', 'observacoes', 'inquilino_nome',
            'apartamento_info', 'duracao_meses', 'esta_ativo',
            'created_at', 'updated_at'
        ]

    def get_inquilino_nome(self, obj):
        if obj.inquilino.tipo == 'PF':
            return obj.inquilino.nome_completo
        return obj.inquilino.razao_social

    def get_apartamento_info(self, obj):
        return {
            'unit_number': obj.apartamento.unit_number,
            'building_name': obj.apartamento.building_name.name,
            'floor': obj.apartamento.floor,
        }

    def validate(self, data):
        """Validação customizada"""
        inquilino = data.get('inquilino')

        # Verificar status do inquilino
        if inquilino and inquilino.status == 'BLOQUEADO':
            raise serializers.ValidationError(
                'Inquilino bloqueado não pode ser associado a apartamentos.'
            )

        return data

class AssociacaoListSerializer(serializers.ModelSerializer):
    """Serializer otimizado para listagem"""
    inquilino_nome = serializers.SerializerMethodField()
    apartamento_numero = serializers.CharField(source='apartamento.unit_number')
    edificio_nome = serializers.CharField(source='apartamento.building_name.name')
    status_inquilino = serializers.CharField(source='inquilino.status')

    class Meta:
        model = InquilinoApartamento
        fields = [
            'id', 'inquilino_nome', 'apartamento_numero', 'edificio_nome',
            'data_inicio', 'data_fim', 'valor_aluguel', 'ativo',
            'status_inquilino', 'esta_ativo'
        ]

    def get_inquilino_nome(self, obj):
        if obj.inquilino.tipo == 'PF':
            return obj.inquilino.nome_completo
        return obj.inquilino.razao_social


class HistoricoAssociacaoSerializer(serializers.ModelSerializer):
    """Serializer para histórico de associações"""
    acao_display = serializers.CharField(source='get_acao_display', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = HistoricoAssociacao
        fields = [
            'id', 'acao', 'acao_display', 'detalhes', 'observacoes',
            'usuario_nome', 'timestamp'
        ]
