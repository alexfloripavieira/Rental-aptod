from django.shortcuts import render

from .models import Aptos, Builders


def lista_aptos(request):
    aptos = Aptos.objects.select_related("building_name").prefetch_related("fotos")
    return render(request, "aptos/aptos_lista.html", {"aptos": aptos})


def listar_builders(request):
    builders = Builders.objects.prefetch_related("builder_fotos").all()
    return render(request, "aptos/builders_lista.html", {"builders": builders})
