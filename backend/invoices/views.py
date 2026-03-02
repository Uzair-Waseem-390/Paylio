from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum, Q
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from .models import Invoice
from .serializers import InvoiceSerializer, InvoiceSummarySerializer

# ========== CRUD Views using Generics ==========

class InvoiceListCreateView(generics.ListCreateAPIView):
    """
    GET: List all invoices for authenticated user
    POST: Create new invoice
    """
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter invoices by logged-in user only"""
        queryset = Invoice.objects.filter(user=self.request.user)
        
        # Date filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            parsed_start = parse_date(start_date)
            if parsed_start:
                queryset = queryset.filter(issue_date__gte=parsed_start)
        
        if end_date:
            parsed_end = parse_date(end_date)
            if parsed_end:
                queryset = queryset.filter(issue_date__lte=parsed_end)
        
        # Status filtering
        status_filter = self.request.query_params.get('status')
        if status_filter in ['Pending', 'Received']:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        """Associate invoice with logged-in user"""
        serializer.save(user=self.request.user)


class InvoiceRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve single invoice
    PUT/PATCH: Update invoice
    DELETE: Delete invoice
    """
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Ensure users can only access their own invoices"""
        return Invoice.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        """Recalculate total on update"""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete invoice"""
        instance.delete()






from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, action
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import timedelta
from .models import Invoice
from .serializers import InvoiceSerializer, InvoiceSummarySerializer
from collections import OrderedDict
from rest_framework import serializers

# ========== Enhanced Summary View ==========

# ========== Enhanced Summary View ==========

class InvoiceSummaryView(generics.GenericAPIView):
    """
    Get revenue summary with optional date filtering
    Enhanced with additional metrics and better error handling
    """
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSummarySerializer
    
    def get_queryset(self):
        """Base queryset with user filtering"""
        return Invoice.objects.filter(user=self.request.user)
    
    def apply_date_filter(self, queryset):
        """Apply date filtering from query params"""
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            parsed_start = parse_date(start_date)
            if parsed_start:
                queryset = queryset.filter(issue_date__gte=parsed_start)
            else:
                from rest_framework import serializers
                raise serializers.ValidationError({"start_date": "Invalid date format. Use YYYY-MM-DD"})
        
        if end_date:
            parsed_end = parse_date(end_date)
            if parsed_end:
                queryset = queryset.filter(issue_date__lte=parsed_end)
            else:
                from rest_framework import serializers
                raise serializers.ValidationError({"end_date": "Invalid date format. Use YYYY-MM-DD"})
        
        return queryset, start_date, end_date
    
    def get(self, request):
        try:
            # Get base queryset
            queryset = self.get_queryset()
            
            # Apply date filters if provided
            filtered_queryset, start_date, end_date = self.apply_date_filter(queryset)
            
            # Calculate totals
            total_generated = filtered_queryset.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            total_received = filtered_queryset.filter(status='Received').aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            total_pending = filtered_queryset.filter(status='Pending').aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            # Counts
            invoice_count = filtered_queryset.count()
            received_count = filtered_queryset.filter(status='Received').count()
            pending_count = filtered_queryset.filter(status='Pending').count()
            
            # Calculate average invoice value
            avg_invoice_value = total_generated / invoice_count if invoice_count > 0 else 0
            
            # Get period-over-period comparison (if date range provided)
            comparison_data = {}
            if start_date and end_date:
                # Calculate previous period of same length
                start = parse_date(start_date)
                end = parse_date(end_date)
                if start and end:
                    period_days = (end - start).days
                    prev_start = start - timedelta(days=period_days)
                    prev_end = start - timedelta(days=1)
                    
                    prev_queryset = queryset.filter(
                        issue_date__gte=prev_start,
                        issue_date__lte=prev_end
                    )
                    
                    prev_generated = prev_queryset.aggregate(
                        total=Sum('total_amount')
                    )['total'] or 0
                    
                    growth_percentage = (
                        ((total_generated - prev_generated) / prev_generated * 100) 
                        if prev_generated > 0 else 0
                    )
                    
                    comparison_data = {
                        'previous_period_generated': prev_generated,
                        'growth_percentage': round(growth_percentage, 2)
                    }
            
            summary_data = {
                'total_generated': round(total_generated, 2),
                'total_received': round(total_received, 2),
                'total_pending': round(total_pending, 2),
                'invoice_count': invoice_count,
                'received_count': received_count,
                'pending_count': pending_count,
                'avg_invoice_value': round(avg_invoice_value, 2),
            }
            
            # Add comparison data only if it exists
            if comparison_data:
                summary_data['comparison'] = comparison_data
            
            serializer = self.get_serializer(summary_data)
            return Response(serializer.data)
            
        except serializers.ValidationError as e:
            return Response({"error": str(e.detail)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error in summary view: {str(e)}")  # For debugging
            import traceback
            traceback.print_exc()  # This will print the full error in console
            return Response(
                {"error": f"An error occurred while generating summary: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ========== Additional Summary Views for Dashboard ==========

class MonthlyRevenueView(generics.GenericAPIView):
    """
    Get monthly revenue breakdown for charts
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get last 12 months of data
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=365)
        
        invoices = Invoice.objects.filter(
            user=request.user,
            issue_date__gte=start_date,
            issue_date__lte=end_date
        )
        
        # Group by month
        monthly_data = []
        current = start_date
        while current <= end_date:
            month_start = current.replace(day=1)
            if current.month == 12:
                month_end = current.replace(year=current.year+1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = current.replace(month=current.month+1, day=1) - timedelta(days=1)
            
            month_invoices = invoices.filter(
                issue_date__gte=month_start,
                issue_date__lte=month_end
            )
            
            monthly_data.append({
                'month': month_start.strftime('%Y-%m'),
                'generated': month_invoices.aggregate(total=Sum('total_amount'))['total'] or 0,
                'received': month_invoices.filter(status='Received').aggregate(total=Sum('total_amount'))['total'] or 0,
                'count': month_invoices.count()
            })
            
            # Move to next month
            if current.month == 12:
                current = current.replace(year=current.year+1, month=1)
            else:
                current = current.replace(month=current.month+1)
        
        return Response(monthly_data)


class RecentActivityView(generics.GenericAPIView):
    """
    Get recent invoice activity
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        recent_invoices = Invoice.objects.filter(
            user=request.user
        ).order_by('-created_at')[:10]
        
        data = []
        for invoice in recent_invoices:
            data.append({
                'id': invoice.id,
                'client_name': invoice.client_name,
                'amount': invoice.total_amount,
                'status': invoice.status,
                'issue_date': invoice.issue_date,
                'created_at': invoice.created_at,
                'template': invoice.template_name
            })
        
        return Response(data)


class StatusDistributionView(generics.GenericAPIView):
    """
    Get invoice status distribution
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Apply date filters if provided
        queryset = Invoice.objects.filter(user=request.user)
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            parsed_start = parse_date(start_date)
            if parsed_start:
                queryset = queryset.filter(issue_date__gte=parsed_start)
        
        if end_date:
            parsed_end = parse_date(end_date)
            if parsed_end:
                queryset = queryset.filter(issue_date__lte=parsed_end)
        
        # Get counts by status
        received_count = queryset.filter(status='Received').count()
        pending_count = queryset.filter(status='Pending').count()
        
        # Get amounts by status
        received_amount = queryset.filter(status='Received').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        pending_amount = queryset.filter(status='Pending').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        return Response({
            'by_count': {
                'received': received_count,
                'pending': pending_count,
                'total': received_count + pending_count
            },
            'by_amount': {
                'received': received_amount,
                'pending': pending_amount,
                'total': received_amount + pending_amount
            }
        })







# ========== Custom Actions ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_invoice_as_received(request, pk):
    """
    Mark invoice as Received
    """
    invoice = get_object_or_404(Invoice, pk=pk, user=request.user)
    
    if invoice.status == 'Received':
        return Response(
            {"message": "Invoice is already marked as Received"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    invoice.status = 'Received'
    invoice.save()
    
    serializer = InvoiceSerializer(invoice)
    return Response({
        "message": "Invoice marked as received successfully",
        "invoice": serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_invoice_as_pending(request, pk):
    """
    Mark invoice as Pending
    """
    invoice = get_object_or_404(Invoice, pk=pk, user=request.user)
    
    if invoice.status == 'Pending':
        return Response(
            {"message": "Invoice is already marked as Pending"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    invoice.status = 'Pending'
    invoice.save()
    
    serializer = InvoiceSerializer(invoice)
    return Response({
        "message": "Invoice marked as pending successfully",
        "invoice": serializer.data
    })


# # ========== Template Rendering View =========

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import Invoice

# ========== Template Rendering View ==========

@api_view(['GET'])
@permission_classes([])  # Temporarily empty to handle authentication manually
def render_invoice_template(request, pk):
    """
    Render invoice in selected template for browser viewing/printing
    Accepts JWT token via query parameter for authentication
    """
    try:
        user = None
        
        # Method 1: Check for token in Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                user = jwt_auth.get_user(validated_token)
            except Exception as e:
                print(f"Header token validation error: {e}")
        
        # Method 2: Check for token in query params
        if not user:
            token_param = request.query_params.get('token')
            if token_param:
                try:
                    jwt_auth = JWTAuthentication()
                    validated_token = jwt_auth.get_validated_token(token_param)
                    user = jwt_auth.get_user(validated_token)
                except Exception as e:
                    print(f"Query param token validation error: {e}")
        
        # If still no user, return 401
        if not user:
            return HttpResponse(
                "Authentication required. Please log in again.",
                status=401,
                content_type='text/plain'
            )
        
        # Get invoice and verify ownership
        invoice = get_object_or_404(Invoice, pk=pk)
        
        # Check if invoice belongs to the authenticated user
        if invoice.user != user:
            return HttpResponse(
                "You don't have permission to view this invoice.",
                status=403,
                content_type='text/plain'
            )
        
        # Use f-strings instead of % formatting to avoid CSS conflicts
        status_color = '#28a745' if invoice.status == 'Received' else '#ffc107'
        
        template_style = f"""
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            .invoice-header {{ text-align: center; margin-bottom: 30px; }}
            .invoice-details {{ margin-bottom: 20px; }}
            table {{ width: 100%; border-collapse: collapse; }}
            th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
            .total {{ font-size: 1.2em; font-weight: bold; text-align: right; margin-top: 20px; }}
            .status {{ color: {status_color}; font-weight: bold; }}
            .badge {{
                display: inline-block;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 0.9em;
            }}
            .badge-success {{ background-color: #d4edda; color: #155724; }}
            .badge-warning {{ background-color: #fff3cd; color: #856404; }}
            @media print {{
                body {{ margin: 0; padding: 20px; }}
                .no-print {{ display: none; }}
            }}
        </style>
        """
        
        # Create different templates based on selection
        if invoice.template_name == 'Template 2 (Minimal)':
            template_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #{invoice.id}</title>
                {template_style}
                <style>
                    body {{ font-family: 'Helvetica', sans-serif; max-width: 800px; margin: 0 auto; }}
                    .header {{ border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }}
                    .client-section {{ background: #f9f9f9; padding: 20px; margin-bottom: 30px; }}
                    .amount {{ font-size: 2em; color: #333; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>INVOICE #{invoice.id}</h1>
                    <p>Date: {invoice.issue_date}</p>
                </div>
                
                <div class="client-section">
                    <h3>Bill To:</h3>
                    <p><strong>{invoice.client_name}</strong><br>
                    {invoice.client_email}<br>
                    {invoice.client_address}</p>
                </div>
                
                <table>
                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Tax</th>
                        <th>Total</th>
                    </tr>
                    <tr>
                        <td>{invoice.description}</td>
                        <td>${invoice.amount}</td>
                        <td>{invoice.tax_percentage or 0}%</td>
                        <td><strong>${invoice.total_amount}</strong></td>
                    </tr>
                </table>
                
                <div class="total">
                    <p>Total Due: <strong>${invoice.total_amount}</strong></p>
                    <p>Due Date: {invoice.due_date}</p>
                    <p>Status: <span class="badge badge-{'success' if invoice.status == 'Received' else 'warning'}">{invoice.status}</span></p>
                </div>
            </body>
            </html>
            """
        
        elif invoice.template_name == 'Template 3 (Corporate)':
            template_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #{invoice.id}</title>
                {template_style}
                <style>
                    body {{ font-family: 'Times New Roman', serif; }}
                    .corporate-header {{ background: #2c3e50; color: white; padding: 30px; margin-bottom: 40px; }}
                    .corporate-header h1 {{ margin: 0; }}
                    .details-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }}
                    .amount-box {{ background: #ecf0f1; padding: 20px; text-align: center; }}
                    .amount-box .number {{ font-size: 2.5em; color: #2c3e50; }}
                </style>
            </head>
            <body>
                <div class="corporate-header">
                    <h1>INVOICE</h1>
                    <p>Invoice #{invoice.id}</p>
                </div>
                
                <div class="details-grid">
                    <div>
                        <h3>Client Information</h3>
                        <p><strong>{invoice.client_name}</strong><br>
                        {invoice.client_email}<br>
                        {invoice.client_address}</p>
                    </div>
                    <div>
                        <h3>Invoice Details</h3>
                        <p><strong>Issue Date:</strong> {invoice.issue_date}<br>
                        <strong>Due Date:</strong> {invoice.due_date}<br>
                        <strong>Status:</strong> <span class="badge badge-{'success' if invoice.status == 'Received' else 'warning'}">{invoice.status}</span></p>
                    </div>
                </div>
                
                <table>
                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Tax (%)</th>
                        <th>Total</th>
                    </tr>
                    <tr>
                        <td>{invoice.description}</td>
                        <td>${invoice.amount}</td>
                        <td>{invoice.tax_percentage or 0}%</td>
                        <td>${invoice.total_amount}</td>
                    </tr>
                </table>
                
                <div class="amount-box">
                    <p>Total Amount Due</p>
                    <p class="number">${invoice.total_amount}</p>
                </div>
            </body>
            </html>
            """
        
        else:  # Template 1 (Modern) and default
            template_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #{invoice.id}</title>
                {template_style}
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }}
                    .modern-header {{ 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px;
                        border-radius: 10px 10px 0 0;
                    }}
                    .content {{ padding: 40px; }}
                    .info-row {{ display: flex; justify-content: space-between; margin-bottom: 30px; }}
                    .info-box {{ flex: 1; }}
                    .info-box:first-child {{ margin-right: 20px; }}
                </style>
            </head>
            <body>
                <div class="modern-header">
                    <h1>INVOICE</h1>
                    <h2>#{invoice.id}</h2>
                </div>
                
                <div class="content">
                    <div class="info-row">
                        <div class="info-box">
                            <h3>Client Details</h3>
                            <p><strong>{invoice.client_name}</strong><br>
                            {invoice.client_email}<br>
                            {invoice.client_address}</p>
                        </div>
                        <div class="info-box">
                            <h3>Invoice Details</h3>
                            <p><strong>Issue Date:</strong> {invoice.issue_date}<br>
                            <strong>Due Date:</strong> {invoice.due_date}<br>
                            <strong>Status:</strong> <span class="status">{invoice.status}</span></p>
                        </div>
                    </div>
                    
                    <table>
                        <tr>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Tax</th>
                            <th>Total</th>
                        </tr>
                        <tr>
                            <td>{invoice.description}</td>
                            <td>${invoice.amount}</td>
                            <td>{invoice.tax_percentage or 0}%</td>
                            <td><strong>${invoice.total_amount}</strong></td>
                        </tr>
                    </table>
                    
                    <div class="total">
                        <p>Total Amount: <strong>${invoice.total_amount}</strong></p>
                    </div>
                </div>
            </body>
            </html>
            """
        
        # Add print button at the bottom
        print_button = """
        <div class="no-print" style="text-align: center; margin-top: 30px; padding: 20px;">
            <button onclick="window.print()" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                🖨️ Print / Save as PDF
            </button>
        </div>
        """
        
        # Insert print button before closing body tag
        template_html = template_html.replace('</body>', f'{print_button}</body>')
        
        return HttpResponse(template_html)
        
    except Exception as e:
        print(f"Error in render view: {str(e)}")
        import traceback
        traceback.print_exc()
        return HttpResponse(
            f"An error occurred: {str(e)}",
            status=500,
            content_type='text/plain'
        )