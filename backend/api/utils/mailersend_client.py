from __future__ import annotations

import logging
from typing import Iterable, Mapping, Sequence, Union

from django.conf import settings
from django.utils.html import strip_tags
from mailersend import Email, EmailBuilder, MailerSendClient
from mailersend.exceptions import MailerSendError

logger = logging.getLogger(__name__)

Recipient = Union[str, Mapping[str, str]]

_client: MailerSendClient | None = None
_email_resource: Email | None = None


def _get_email_resource() -> Email:
    if not settings.MAILERSEND_API_KEY:
        raise RuntimeError("MAILERSEND_API_KEY is not configured.")

    global _client  # noqa: PLW0603
    global _email_resource  # noqa: PLW0603

    if _client is None:
        _client = MailerSendClient(api_key=settings.MAILERSEND_API_KEY)
    if _email_resource is None:
        _email_resource = Email(_client)
    return _email_resource


def _normalize_recipients(recipients: Iterable[Recipient]) -> list[dict[str, str]]:
    normalized: list[dict[str, str]] = []
    for recipient in recipients:
        if isinstance(recipient, str):
            normalized.append({"email": recipient, "name": recipient})
            continue
        email = recipient.get("email")
        if not email:
            raise ValueError("Recipient dict must include an 'email' key.")
        normalized.append({"email": email, "name": recipient.get("name", email)})
    if not normalized:
        raise ValueError("At least one recipient is required.")
    return normalized


def send_plain_text_email(
    *,
    subject: str,
    message: str | None = None,
    html_message: str | None = None,
    recipients: Sequence[Recipient],
    sender_name: str | None = None,
    reply_to: Sequence[str] | None = None,
) -> dict:
    """
    Envía un correo de texto plano usando MailerSend.
    `recipients` acepta una lista de strings o dicts con llaves `email`/`name`.
    """
    sender_email = settings.MAILERSEND_FROM_EMAIL
    if not sender_email:
        raise RuntimeError("MAILERSEND_SENDER is not configured with a valid email.")

    if not message and not html_message:
        raise ValueError("Debe proporcionar message y/o html_message.")

    normalized_recipients = _normalize_recipients(recipients)

    builder = (
        EmailBuilder()
        .from_email(
            email=sender_email,
            name=sender_name
            or settings.MAILERSEND_FROM_NAME
            or sender_email,
        )
        .subject(subject)
        .to_many(normalized_recipients)
    )

    text_body = message or (strip_tags(html_message) if html_message else None)
    if text_body:
        builder.text(text_body)
    if html_message:
        builder.html(html_message)

    if reply_to:
        builder.reply_to(reply_to[0])

    email_resource = _get_email_resource()

    try:
        response = email_resource.send(builder.build())
        payload = response.to_dict()
        logger.info("MailerSend response: %s", payload)
        return payload
    except MailerSendError as exc:
        logger.exception("MailerSend API error: %s", exc)
        raise RuntimeError("MailerSend email sending failed.") from exc
    except Exception as exc:  # pragma: no cover - dependiente de API externa
        logger.exception("Unexpected error enviando correo con MailerSend.")
        raise RuntimeError("MailerSend email sending failed.") from exc
