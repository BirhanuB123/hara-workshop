from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from apps.accounts.models import User
from apps.notifications.models import Notification, NotificationType

def _notify_new_message(conversation, message, sender):
    try:
        snippet = message.content.strip()[:120] if message.content else 'Sent an attachment'
        if sender.role == 'CUSTOMER':
            admins = User.objects.filter(role='ADMIN', is_active=True)
            sender_name = sender.get_full_name() or sender.email
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    title=f"New message from {sender_name}",
                    message=snippet,
                    notification_type=NotificationType.MESSAGE,
                    link_url=f"/admin/messages?conversation={conversation.id}"
                )
        else:
            Notification.objects.create(
                user=conversation.customer,
                title="HARA WORKSHOP sent you a message",
                message=snippet,
                notification_type=NotificationType.MESSAGE,
                link_url=f"/customer/messages?conversation={conversation.id}"
            )
    except Exception as e:
        # Notifications should never crash message delivery
        print(f"Failed to create notification for message {message.id}: {e}")

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Conversation.objects.none()

        qs = Conversation.objects.select_related('customer', 'quotation', 'order').prefetch_related(
            'messages', 'messages__sender'
        )

        if user.role == 'ADMIN':
            search = self.request.query_params.get('search')
            if search:
                qs = qs.filter(
                    Q(subject__icontains=search) |
                    Q(customer__first_name__icontains=search) |
                    Q(customer__last_name__icontains=search) |
                    Q(customer__email__icontains=search) |
                    Q(customer__customer_profile__company_name__icontains=search)
                )
            return qs

        # CUSTOMER: strictly isolated to their own conversations
        return qs.filter(customer=user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Mark incoming unread messages as read upon viewing
        instance.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        user = self.request.user
        target_customer = user

        if user.role == 'ADMIN':
            customer_id = self.request.data.get('customer_id') or self.request.data.get('customer')
            if customer_id:
                cust = User.objects.filter(id=customer_id).first()
                if cust:
                    target_customer = cust

        # Handle optional quotation and order links
        quotation_id = self.request.data.get('quotation_id') or self.request.data.get('quotation')
        order_id = self.request.data.get('order_id') or self.request.data.get('order')
        quotation = None
        order = None
        if quotation_id:
            from apps.quotations.models import Quote
            quotation = Quote.objects.filter(id=quotation_id).first()
        if order_id:
            from apps.orders.models import Order
            order = Order.objects.filter(id=order_id).first()

        conversation = serializer.save(
            customer=target_customer,
            quotation=quotation,
            order=order
        )

        # Optional initial message
        initial_content = (self.request.data.get('initial_message') or self.request.data.get('content') or '').strip()
        attachment = self.request.FILES.get('attachment', None)
        if initial_content or attachment:
            msg = Message.objects.create(
                conversation=conversation,
                sender=user,
                content=initial_content,
                attachment=attachment
            )
            conversation.last_message_at = msg.created_at
            conversation.save(update_fields=['last_message_at', 'updated_at'])
            _notify_new_message(conversation, msg, user)

    @action(detail=False, methods=['get', 'post'])
    def general(self, request):
        """
        Retrieves or initializes the continuous general conversation between customer and admin.
        """
        user = request.user
        target_customer = user

        if user.role == 'ADMIN':
            customer_id = request.data.get('customer_id') or request.query_params.get('customer_id')
            if customer_id:
                cust = User.objects.filter(id=customer_id).first()
                if cust:
                    target_customer = cust
                else:
                    return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'customer_id is required for admin'}, status=status.HTTP_400_BAD_REQUEST)

        conv = Conversation.objects.filter(
            customer=target_customer,
            quotation__isnull=True,
            order__isnull=True,
            status='OPEN'
        ).first()

        if not conv:
            conv = Conversation.objects.create(
                customer=target_customer,
                subject='General Workshop Inquiry'
            )

        serializer = self.get_serializer(conv)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        conversation = self.get_object()

        if request.method == 'GET':
            # Mark incoming messages as read
            conversation.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
            msgs = conversation.messages.select_related('sender').all()
            return Response(MessageSerializer(msgs, many=True, context={'request': request}).data)

        # POST: Create message
        content = (request.data.get('content') or '').strip()
        attachment = request.FILES.get('attachment', None)

        if not content and not attachment:
            return Response({'error': 'Message content or an attachment is required'}, status=status.HTTP_400_BAD_REQUEST)

        msg = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            attachment=attachment
        )
        conversation.last_message_at = msg.created_at
        conversation.save(update_fields=['last_message_at', 'updated_at'])

        _notify_new_message(conversation, msg, request.user)

        return Response(MessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        return self.messages(request, pk)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        updated_count = conversation.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        return Response({'status': 'marked read', 'updated_count': updated_count})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'unread_count': 0})

        if user.role == 'ADMIN':
            count = Message.objects.filter(is_read=False).exclude(sender__role='ADMIN').count()
        else:
            count = Message.objects.filter(conversation__customer=user, is_read=False).exclude(sender=user).count()

        return Response({'unread_count': count})

    @action(detail=False, methods=['get'])
    def customers(self, request):
        """
        Returns registered customers so an Admin can initiate a message with any customer.
        """
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only workshop administrators can access customer directory'}, status=status.HTTP_403_FORBIDDEN)

        customers_qs = User.objects.filter(role='CUSTOMER', is_active=True).select_related('customer_profile').order_by('first_name', 'last_name', 'email')
        data = []
        for u in customers_qs:
            company = u.customer_profile.company_name if hasattr(u, 'customer_profile') and u.customer_profile else ''
            data.append({
                'id': str(u.id),
                'first_name': u.first_name,
                'last_name': u.last_name,
                'email': u.email,
                'phone_number': u.phone_number or '',
                'company_name': company
            })
        return Response(data)

class MessageViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Message.objects.all()
        return Message.objects.filter(conversation__customer=user)

    @action(detail=True, methods=['patch', 'post'])
    def read(self, request, pk=None):
        message = self.get_object()
        if not message.is_read:
            message.is_read = True
            message.save(update_fields=['is_read', 'updated_at'])
        return Response({'status': 'marked read', 'id': str(message.id)})

