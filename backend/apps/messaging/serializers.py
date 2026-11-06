import os
from rest_framework import serializers
from .models import Conversation, Message
from apps.accounts.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    attachment = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 
            'conversation', 
            'sender', 
            'sender_name', 
            'sender_role', 
            'content', 
            'attachment', 
            'attachment_name', 
            'is_read', 
            'is_me', 
            'created_at'
        ]
        read_only_fields = ['id', 'sender', 'sender_name', 'sender_role', 'is_read', 'created_at']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.email

    def get_attachment(self, obj):
        if obj.attachment:
            try:
                return obj.attachment.url
            except Exception:
                return None
        return None

    def get_attachment_name(self, obj):
        if obj.attachment:
            return os.path.basename(obj.attachment.name)
        return None

    def get_is_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender == request.user
        return False

class ConversationSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    customer_id = serializers.UUIDField(write_only=True, required=False)
    quotation_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    order_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    quotation_details = serializers.SerializerMethodField()
    order_details = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id', 
            'customer', 
            'customer_id',
            'subject', 
            'status', 
            'quotation', 
            'quotation_id',
            'quotation_details', 
            'order', 
            'order_id',
            'order_details', 
            'last_message_at', 
            'last_message', 
            'unread_count', 
            'messages', 
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'customer', 'status', 'last_message_at', 'created_at', 'updated_at']

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.exclude(sender=request.user).filter(is_read=False).count()
        return 0

    def get_last_message(self, obj):
        latest = obj.messages.order_by('created_at').last()
        if latest:
            request = self.context.get('request')
            is_me = (request.user == latest.sender) if (request and request.user.is_authenticated) else False
            return {
                'id': str(latest.id),
                'content': latest.content,
                'created_at': latest.created_at,
                'sender_name': latest.sender.get_full_name() or latest.sender.email,
                'sender_role': latest.sender.role,
                'is_me': is_me,
                'is_read': latest.is_read,
                'has_attachment': bool(latest.attachment)
            }
        return None

    def get_quotation_details(self, obj):
        if obj.quotation:
            return {
                'id': str(obj.quotation.id),
                'quote_number': obj.quotation.quote_number,
                'project_title': obj.quotation.project_title,
                'service_type': obj.quotation.service_type,
                'status': obj.quotation.status,
            }
        return None

    def get_order_details(self, obj):
        if obj.order:
            return {
                'id': str(obj.order.id),
                'order_number': obj.order.order_number,
                'status': obj.order.status,
            }
        return None
