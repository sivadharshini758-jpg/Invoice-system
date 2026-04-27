from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Client, Invoice, InvoiceItem, Payment


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['email', 'name', 'role', 'is_active', 'created_at']
    list_filter   = ['role', 'is_active']
    search_fields = ['email', 'name']
    ordering      = ['-created_at']
    fieldsets = (
        (None,           {'fields': ('email', 'password')}),
        ('Personal',     {'fields': ('name', 'role')}),
        ('Permissions',  {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields': ('email', 'name', 'password1', 'password2', 'role')}),
    )


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display  = ['name', 'email', 'company', 'is_active', 'created_at']
    search_fields = ['name', 'email', 'company']
    list_filter   = ['is_active']


class InvoiceItemInline(admin.TabularInline):
    model  = InvoiceItem
    extra  = 0
    fields = ['description', 'quantity', 'unit_price', 'total']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display  = ['invoice_number', 'client', 'status', 'total', 'due_date']
    list_filter   = ['status', 'currency']
    search_fields = ['invoice_number', 'client__name']
    inlines       = [InvoiceItemInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ['invoice', 'amount', 'method', 'status', 'paid_at']
    list_filter   = ['method', 'status']
