from rest_framework import serializers
from .models import Quote, QuoteItem, QuoteAttachment
from apps.accounts.serializers import UserSerializer
from apps.core.phone_validator import validate_phone_number

class QuoteAttachmentSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = QuoteAttachment
        fields = ['id', 'file', 'file_name', 'created_at']

    def get_file(self, obj):
        if obj.file:
            try:
                return obj.file.url
            except Exception:
                return None
        return None

class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = ['id', 'description', 'quantity', 'unit_cost', 'total_cost']

class QuoteSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    items = QuoteItemSerializer(many=True, read_only=True)
    attachments = QuoteAttachmentSerializer(many=True, read_only=True)
    telegram_deep_link = serializers.SerializerMethodField()

    class Meta:
        model = Quote
        fields = [
            'id', 'quote_number', 'customer', 'customer_name', 'customer_phone', 'customer_email',
            'product', 'product_code', 'product_name', 'product_category', 'product_image_url',
            'project_title', 'service_type', 'description', 'material_preference',
            'width_cm', 'height_cm', 'length_cm', 'quantity',
            'calculated_volume_m3', 'estimated_baseline_amount',
            'preferred_completion_date', 'installation_required', 'delivery_required',
            'delivery_address', 'site_location', 'status',
            'materials_cost', 'labor_cost', 'transportation_cost', 'installation_cost',
            'additional_charges', 'discount', 'subtotal', 'total_amount',
            'expiration_date', 'workshop_notes', 'customer_notes',
            'telegram_chat_id', 'telegram_linked_at', 'telegram_deep_link',
            'items', 'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'quote_number', 'customer', 'created_at', 'updated_at']

    def get_telegram_deep_link(self, obj):
        if obj.telegram_link_token:
            from django.conf import settings
            bot_user = getattr(settings, 'TELEGRAM_BOT_USERNAME', 'HaraWorkshopOrdersBot').lstrip('@')
            return f"https://t.me/{bot_user}?start={obj.telegram_link_token}"
        return None

class QuoteCreateSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(required=True, max_length=200)
    customer_phone = serializers.CharField(required=True, max_length=50)
    customer_email = serializers.EmailField(required=True)
    project_title = serializers.CharField(required=True, max_length=200)
    service_type = serializers.CharField(required=True, max_length=100)
    description = serializers.CharField(required=True)
    quantity = serializers.IntegerField(default=1, min_value=1)

    def validate_customer_phone(self, value):
        is_valid, err_msg, normalized = validate_phone_number(value)
        if not is_valid:
            raise serializers.ValidationError(err_msg)
        return normalized

    class Meta:
        model = Quote
        fields = [
            'customer_name', 'customer_phone', 'customer_email',
            'product', 'product_code', 'product_name', 'product_category', 'product_image_url',
            'project_title', 'service_type', 'description', 'material_preference',
            'width_cm', 'height_cm', 'length_cm', 'quantity',
            'calculated_volume_m3', 'estimated_baseline_amount',
            'preferred_completion_date', 'installation_required', 'delivery_required',
            'delivery_address', 'site_location', 'customer_notes'
        ]

class QuotePriceProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = [
            'materials_cost', 'labor_cost', 'transportation_cost',
            'installation_cost', 'additional_charges', 'discount',
            'expiration_date', 'workshop_notes'
        ]
