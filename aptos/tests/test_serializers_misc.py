import pytest
from datetime import date, timedelta

from aptos.serializers import InquilinoSerializer, InquilinoListSerializer
from aptos.tests.factories import InquilinoPFFactory, InquilinoPJFactory, InquilinoApartamentoFactory


@pytest.mark.django_db
def test_inquilino_serializer_pf_documento_tempo():
    inq = InquilinoPFFactory.create()
    # cria uma associação para ter tempo_como_inquilino > 0
    assoc = InquilinoApartamentoFactory.create(inquilino=inq)
    # move data_inicio para ontem para garantir > 0
    assoc.data_inicio = date.today() - timedelta(days=1)
    assoc.save()

    data = InquilinoSerializer(inq).data
    assert data["documento_principal"]
    assert data["nome_exibicao"] == inq.nome_completo
    assert data["tempo_como_inquilino"] >= 1


@pytest.mark.django_db
def test_inquilino_list_serializer_pj_documento():
    inq = InquilinoPJFactory.create()
    data = InquilinoListSerializer(inq).data
    assert data["documento"]  # CNPJ formatado presente
    assert data["nome_exibicao"] in (inq.razao_social, inq.nome_fantasia)
