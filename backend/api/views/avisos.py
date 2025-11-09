from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Q, F

from api.models import MensajeBot


@api_view(["GET"])
@permission_classes([AllowAny])
def listar_avisos(request):
    """
    Devuelve avisos reales (MensajeBot) según audiencia.

    - Autenticado: all OR destinatario directo OR comparte grupo
    - Anónimo: sólo audiencia="all"
    """
    user = getattr(request, "user", None)

    base_filter = Q(producto__isnull=True) | Q(producto__stock__lte=F("producto__umbral_minimo"))

    if user and getattr(user, "is_authenticated", False):
        qs = (
            MensajeBot.objects.filter(
                (Q(audiencia="all")
                 | Q(audiencia="users", destinatarios=user)
                 | Q(audiencia="groups", grupos__in=user.groups.all()))
                & base_filter
            )
            .distinct()
            .order_by("-created_at")[:50]
        )
    else:
        qs = (
            MensajeBot.objects.filter(audiencia="all")
            .filter(base_filter)
            .order_by("-created_at")[:50]
        )

    data = [
        {
            "id": m.id,
            "mensaje": m.texto,
            "fecha": m.created_at.isoformat(),
            "tipo": m.tipo,
            "meta": m.meta,
        }
        for m in qs
    ]
    return Response(data)
