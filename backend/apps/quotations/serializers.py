from rest_framework import serializers
from .models import Quote, QuoteItem, QuoteAttachment
from apps.accounts.serializers import UserSerializer

class QuoteAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteAttachment
        fields = ['id', 'file', 'file_name', 'created_at']

class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = ['id', 'description', 'quantity', 'unit_cost', 'total_cost']

class QuoteSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    items = QuoteItemSerializer(many=True, read_only=True)
    attachments = QuoteAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Quote
        fields = [
            'id', 'quote_number', 'customer', 'project_title', 'service_type',
            'description', 'material_preference', 'width_cm', 'height_cm',
            'length_cm', 'quantity', 'preferred_completion_date',
            'installation_required', 'delivery_required', 'delivery_address',
            'status', 'materials_cost', 'labor_cost', 'transportation_cost',
            'installation_cost', 'additional_charges', 'discount', 'subtotal',
            'total_amount', 'expiration_date', 'workshop_notes', 'customer_notes',
            'items', 'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'quote_number', 'customer', 'created_at', 'updated_at']

class QuoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = [
            'project_title', 'service_type', 'description', 'material_preference',
            'width_cm', 'height_cm', 'length_cm', 'quantity', 'preferred_completion_date',
            'installation_required', 'delivery_required', 'delivery_address', 'customer_notes'
        ]

class QuotePriceProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = [
            'materials_cost', 'labor_cost', 'transportation_cost',
            'installation_cost', 'additional_charges', 'discount',
            'expiration_date', 'workshop_notes'
        ]
