from django.urls import path
from . import views

urlpatterns = [
    # CRUD endpoints
    path('', views.InvoiceListCreateView.as_view(), name='invoice-list-create'),
    path('<int:pk>/', views.InvoiceRetrieveUpdateDestroyView.as_view(), name='invoice-detail'),
    
    # Summary endpoint
    path('summary/', views.InvoiceSummaryView.as_view(), name='invoice-summary'),
    path('summary/monthly/', views.MonthlyRevenueView.as_view(), name='monthly-revenue'),
    path('summary/recent/', views.RecentActivityView.as_view(), name='recent-activity'),
    path('summary/status-distribution/', views.StatusDistributionView.as_view(), name='status-distribution'),
    # Custom action endpoints
    path('<int:pk>/mark-received/', views.mark_invoice_as_received, name='mark-received'),
    path('<int:pk>/mark-pending/', views.mark_invoice_as_pending, name='mark-pending'),
    path('<int:pk>/render/', views.render_invoice_template, name='render-invoice'),
]