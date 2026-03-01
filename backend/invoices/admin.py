from django.contrib import admin
from .models import Invoice

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'client_name', 'amount', 'total_amount', 'status', 'issue_date', 'due_date']
    list_filter = ['status', 'template_name', 'issue_date']
    search_fields = ['client_name', 'client_email', 'description']
    readonly_fields = ['total_amount', 'created_at', 'updated_at']