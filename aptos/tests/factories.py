"""
Factories para testes usando factory_boy.

Facilita criação de objetos de teste com dados válidos e consistentes.
"""
import factory
from factory.django import DjangoModelFactory
from faker import Faker
from datetime import date, timedelta

from aptos.models import (
    Builders, Aptos, Inquilino, InquilinoApartamento,
    HistoricoStatus, DocumentoInquilino
)

fake = Faker('pt_BR')


def gerar_cpf_valido():
    """Gera CPF válido para testes (apenas dígitos)."""
    return fake.cpf().replace('.', '').replace('-', '')


def gerar_cnpj_valido():
    """Gera CNPJ válido para testes."""
    # CNPJ válido: 11.222.333/0001-81
    return '11222333000181'


class BuilderFactory(DjangoModelFactory):
    class Meta:
        model = Builders

    name = factory.Faker('company', locale='pt_BR')
    street = factory.Faker('street_address', locale='pt_BR')
    neighborhood = factory.Faker('bairro', locale='pt_BR')
    city = factory.Faker('city', locale='pt_BR')
    state = 'SP'
    zip_code = factory.Faker('postcode', locale='pt_BR')
    country = 'Brasil'


class AptosFactory(DjangoModelFactory):
    class Meta:
        model = Aptos

    unit_number = factory.Sequence(lambda n: f'{100 + n}')
    building_name = factory.SubFactory(BuilderFactory)
    description = factory.Faker('text', max_nb_chars=200, locale='pt_BR')
    rental_price = factory.Faker('pydecimal', left_digits=4, right_digits=2, positive=True)
    is_available = True
    is_furnished = False
    is_pets_allowed = False
    has_laundry = True
    has_parking = True
    has_internet = True
    has_air_conditioning = False
    number_of_bedrooms = factory.Faker('random_int', min=1, max=4)
    number_of_bathrooms = factory.Faker('random_int', min=1, max=3)
    square_footage = factory.Faker('random_int', min=40, max=200)


class InquilinoPFFactory(DjangoModelFactory):
    """Factory para Inquilino Pessoa Física."""
    class Meta:
        model = Inquilino

    tipo = 'PF'
    nome_completo = factory.Faker('name', locale='pt_BR')
    cpf = factory.LazyFunction(gerar_cpf_valido)
    email = factory.Sequence(lambda n: f'inquilino{n}@example.com')
    telefone = factory.Faker('phone_number', locale='pt_BR')
    status = 'ATIVO'
    rg = factory.Faker('rg', locale='pt_BR')
    data_nascimento = factory.Faker('date_of_birth', minimum_age=18, maximum_age=80)
    estado_civil = factory.Faker('random_element', elements=['Solteiro', 'Casado', 'Divorciado', 'Viúvo'])
    profissao = factory.Faker('job', locale='pt_BR')
    renda = factory.Faker('pydecimal', left_digits=5, right_digits=2, positive=True)


class InquilinoPJFactory(DjangoModelFactory):
    """Factory para Inquilino Pessoa Jurídica."""
    class Meta:
        model = Inquilino

    tipo = 'PJ'
    razao_social = factory.Faker('company', locale='pt_BR')
    nome_fantasia = factory.Faker('company', locale='pt_BR')
    cnpj = factory.LazyFunction(lambda: fake.cnpj().replace('.', '').replace('-', '').replace('/', ''))
    email = factory.Sequence(lambda n: f'empresa{n}@example.com')
    telefone = factory.Faker('phone_number', locale='pt_BR')
    status = 'ATIVO'
    inscricao_estadual = factory.Sequence(lambda n: f'{110000000 + n}')
    responsavel_legal = factory.Faker('name', locale='pt_BR')


class InquilinoApartamentoFactory(DjangoModelFactory):
    """Factory para associação Inquilino-Apartamento."""
    class Meta:
        model = InquilinoApartamento

    inquilino = factory.SubFactory(InquilinoPFFactory)
    apartamento = factory.SubFactory(AptosFactory)
    data_inicio = factory.LazyFunction(lambda: date.today() - timedelta(days=30))
    data_fim = None
    valor_aluguel = factory.Faker('pydecimal', left_digits=4, right_digits=2, positive=True)
    ativo = True


class HistoricoStatusFactory(DjangoModelFactory):
    """Factory para histórico de status."""
    class Meta:
        model = HistoricoStatus

    inquilino = factory.SubFactory(InquilinoPFFactory)
    status_anterior = 'ATIVO'
    status_novo = 'INADIMPLENTE'
    motivo = factory.Faker('sentence', locale='pt_BR')
    categoria_motivo = 'MANUAL'


class DocumentoInquilinoFactory(DjangoModelFactory):
    """Factory para documentos de inquilino."""
    class Meta:
        model = DocumentoInquilino

    inquilino = factory.SubFactory(InquilinoPFFactory)
    tipo_documento = 'RG'
    nome_original = factory.Faker('file_name', extension='pdf')
    versao = 1
    tamanho = factory.Faker('random_int', min=1024, max=10485760)  # 1KB - 10MB
    mime_type = 'application/pdf'
    ativo = True
