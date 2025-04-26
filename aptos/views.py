from django.shortcuts import render

from .models import Aptos


def lista_aptos(request):
    aptos = Aptos.objects.select_related("building_name").prefetch_related("fotos")
    return render(request, "aptos_lista.html", {"aptos": aptos})
