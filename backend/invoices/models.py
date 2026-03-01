from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Received', 'Received'),
    ]
    
    TEMPLATE_CHOICES = [
        ('Template 1 (Modern)', 'Template 1 (Modern)'),
        ('Template 2 (Minimal)', 'Template 2 (Minimal)'),
        ('Template 3 (Corporate)', 'Template 3 (Corporate)'),
        ('Custom Template', 'Custom Template'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    client_name = models.CharField(max_length=255)
    client_email = models.EmailField()
    client_address = models.TextField()
    description = models.TextField()
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    tax_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    issue_date = models.DateField()
    due_date = models.DateField()
    template_name = models.CharField(max_length=50, choices=TEMPLATE_CHOICES, default='Template 1 (Modern)')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Auto-calculate total
        if self.tax_percentage:
            tax = (self.amount * self.tax_percentage / Decimal('100'))
        else:
            tax = Decimal('0')
        self.total_amount = self.amount + tax
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Invoice #{self.id} - {self.client_name} - {self.status}"