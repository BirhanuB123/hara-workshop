from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.select_related('customer').prefetch_related('messages', 'messages__sender').all()
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER':
            return Conversation.objects.filter(customer=user).prefetch_related('messages', 'messages__sender')
        return Conversation.objects.all().select_related('customer').prefetch_related('messages', 'messages__sender')

    def perform_create(self, serializer):
        customer = self.request.user
        serializer.save(customer=customer)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        conversation = self.get_object()
        content = request.data.get('content')
        attachment = request.FILES.get('attachment', None)
        if not content:
            return Response({'error': 'Message content required'}, status=status.HTTP_400_BAD_REQUEST)

        msg = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            attachment=attachment
        )
        conversation.save() # Updates last_message_at
        return Response(MessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.exclude(sender=request.user).update(is_read=True)
        return Response({'status': 'marked read'})
