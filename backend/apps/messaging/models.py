from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel

class Conversation(TimeStampedModel):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    subject = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default='OPEN', choices=[('OPEN', 'Open'), ('CLOSED', 'Closed')])
    last_message_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_message_at']

    def __str__(self):
        return f'{self.subject} ({self.customer.get_full_name()})'

class Message(TimeStampedModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    attachment = models.FileField(upload_to='messages/', blank=True, null=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.get_full_name()}: {self.content[:40]}'
