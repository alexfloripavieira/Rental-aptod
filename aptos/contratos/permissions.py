"""
Permissoes customizadas para o modulo de contratos.
"""
from rest_framework.permissions import BasePermission


class IsSuperAdminUser(BasePermission):
    """
    Permissao que permite acesso apenas a super administradores.
    """

    def has_permission(self, request, view):
        """
        Verifica se o usuario e super admin.

        Args:
            request: Requisicao HTTP
            view: View sendo acessada

        Returns:
            bool: True se usuario e super admin autenticado
        """
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )
