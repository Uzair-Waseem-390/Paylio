from rest_framework import serializers
from .models import Invoice
from decimal import Decimal
from datetime import datetime

class InvoiceSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['user', 'total_amount', 'created_at', 'updated_at']
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
    
    def validate_tax_percentage(self, value):
        if value and value < 0:
            raise serializers.ValidationError("Tax percentage cannot be negative")
        if value and value > 100:
            raise serializers.ValidationError("Tax percentage cannot exceed 100%")
        return value
    
    def validate(self, data):
        """
        Cross-field validation
        """
        # Get issue_date and due_date from data
        issue_date = data.get('issue_date')
        due_date = data.get('due_date')
        
        # If both dates are provided, validate them
        if issue_date and due_date:
            if due_date < issue_date:
                raise serializers.ValidationError({
                    'due_date': "Due date cannot be before issue date"
                })
        
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# In invoices/serializers.py

class InvoiceSummarySerializer(serializers.Serializer):
    total_generated = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_received = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_pending = serializers.DecimalField(max_digits=10, decimal_places=2)
    invoice_count = serializers.IntegerField()
    received_count = serializers.IntegerField()
    pending_count = serializers.IntegerField()
    avg_invoice_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    comparison = serializers.DictField(
        child=serializers.DecimalField(max_digits=10, decimal_places=2), 
        required=False,
        allow_null=True
    )