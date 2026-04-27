from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/login',          views.login),
    path('auth/register',       views.register),
    path('auth/me',             views.get_me),
    path('auth/profile',        views.update_profile),
    path('auth/users',          views.list_users),
    path('auth/users/<uuid:pk>/toggle', views.toggle_user),

    # Clients
    path('clients',             views.clients),
    path('clients/<uuid:pk>',   views.client_detail),

    # Invoices
    path('invoices',                        views.invoices),
    path('invoices/<uuid:pk>',              views.invoice_detail),
    path('invoices/<uuid:pk>/send-email',   views.send_invoice_email),
    path('invoices/<uuid:pk>/record-payment', views.record_payment),

    # Payments
    path('payments',            views.payments),

    # Dashboard
    path('dashboard/summary',   views.dashboard),

    # Health
    path('health',              lambda r: __import__('rest_framework.response', fromlist=['Response']).Response({'status': 'ok'})),
]
