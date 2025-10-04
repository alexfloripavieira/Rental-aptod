"""
Serializers para geracao de contratos de locacao.
"""
from rest_framework import serializers
from .validators import validarCpf, validarRg, validarTelefone, validarCep


class EnderecoLocadorSerializer(serializers.Serializer):
    """Serializer para endereco do locador."""

    rua = serializers.CharField(max_length=200)
    numero = serializers.CharField(max_length=20)
    bairro = serializers.CharField(max_length=100)
    cidade = serializers.CharField(max_length=100)
    estado = serializers.CharField(max_length=2)
    cep = serializers.CharField(max_length=9)

    def validate_cep(self, value):
        """Valida formato do CEP."""
        if not validarCep(value):
            raise serializers.ValidationError("CEP invalido")
        return value

    def validate_estado(self, value):
        """Valida sigla do estado."""
        if len(value) != 2:
            raise serializers.ValidationError("Estado deve ter 2 caracteres")
        return value.upper()


class LocadorSerializer(serializers.Serializer):
    """Serializer para dados do locador."""

    nomeCompleto = serializers.CharField(max_length=200)
    nacionalidade = serializers.CharField(max_length=50)
    estadoCivil = serializers.CharField(max_length=30)
    profissao = serializers.CharField(max_length=100)
    cpf = serializers.CharField(max_length=14)
    endereco = EnderecoLocadorSerializer()

    def validate_cpf(self, value):
        """Valida CPF do locador."""
        if not validarCpf(value):
            raise serializers.ValidationError("CPF invalido")
        return value


class LocatarioSerializer(serializers.Serializer):
    """Serializer para dados do locatario."""

    nomeCompleto = serializers.CharField(max_length=200)
    nacionalidade = serializers.CharField(max_length=50)
    profissao = serializers.CharField(max_length=100)
    cpf = serializers.CharField(max_length=14)
    rg = serializers.CharField(max_length=20)
    rgOrgao = serializers.CharField(max_length=20)
    enderecoCompleto = serializers.CharField(max_length=300)
    telefone = serializers.CharField(max_length=15)
    email = serializers.EmailField()

    def validate_cpf(self, value):
        """Valida CPF do locatario."""
        if not validarCpf(value):
            raise serializers.ValidationError("CPF invalido")
        return value

    def validate_rg(self, value):
        """Valida RG do locatario."""
        if not validarRg(value):
            raise serializers.ValidationError("RG invalido")
        return value

    def validate_telefone(self, value):
        """Valida telefone do locatario."""
        if not validarTelefone(value):
            raise serializers.ValidationError(
                "Telefone invalido. Use o formato (XX) XXXXX-XXXX"
            )
        return value


class ContratoDetalhesSerializer(serializers.Serializer):
    """Serializer para detalhes do contrato."""

    dataInicio = serializers.DateField()
    valorCaucao = serializers.DecimalField(max_digits=10, decimal_places=2)
    clausulaSegunda = serializers.CharField(min_length=50, max_length=5000)

    def validate_valorCaucao(self, value):
        """Valida valor da caucao."""
        if value <= 0:
            raise serializers.ValidationError("Valor deve ser positivo")
        if value > 999999.99:
            raise serializers.ValidationError(
                "Valor excede o limite maximo de R$ 999.999,99"
            )
        return value


class ContratoSerializer(serializers.Serializer):
    """Serializer principal para geracao de contratos."""

    locador = LocadorSerializer()
    locatario = LocatarioSerializer()
    contrato = ContratoDetalhesSerializer()
    inventarioMoveis = serializers.CharField(min_length=20, max_length=2000)
