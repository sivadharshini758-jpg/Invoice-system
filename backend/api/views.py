from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.core.mail import send_mail
from django.conf import settings

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Client, Invoice, Payment
from .serializers import (
    UserSerializer, UserCreateSerializer,
    ClientSerializer,
    InvoiceListSerializer, InvoiceDetailSerializer, InvoiceWriteSerializer,
    PaymentSerializer,
)

import datetime


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


# ══ AUTH ══════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email    = request.data.get('email', '').lower()
    password = request.data.get('password', '')
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=400)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=401)
    if not user.is_active or not user.check_password(password):
        return Response({'error': 'Invalid credentials'}, status=401)
    access, _ = get_tokens(user)
    return Response({'token': access, 'user': UserSerializer(user).data})


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data = request.data.copy()
    data['email'] = data.get('email', '').lower()
    ser = UserCreateSerializer(data=data)
    if not ser.is_valid():
        return Response({'error': ser.errors}, status=400)
    user = ser.save()
    access, _ = get_tokens(user)
    return Response({'token': access, 'user': UserSerializer(user).data}, status=201)


@api_view(['GET'])
def get_me(request):
    return Response({'user': UserSerializer(request.user).data})


@api_view(['PATCH'])
def update_profile(request):
    user = request.user
    if 'name' in request.data:
        user.name = request.data['name']
    if 'email' in request.data:
        user.email = request.data['email'].lower()
    if 'password' in request.data:
        user.set_password(request.data['password'])
    user.save()
    return Response({'user': UserSerializer(user).data})


@api_view(['GET'])
def list_users(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only'}, status=403)
    users = User.objects.all()
    return Response({'users': UserSerializer(users, many=True).data})


@api_view(['PATCH'])
def toggle_user(request, pk):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only'}, status=403)
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    user.is_active = not user.is_active
    user.save()
    return Response({'user': UserSerializer(user).data})


# ══ CLIENTS ════════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
def clients(request):
    if request.method == 'GET':
        qs = Client.objects.all()
        search = request.query_params.get('search')
        active = request.query_params.get('active')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search) | Q(company__icontains=search))
        if active is not None:
            qs = qs.filter(is_active=(active == 'true'))
        return Response({'clients': ClientSerializer(qs, many=True).data})

    # POST
    ser = ClientSerializer(data=request.data)
    if not ser.is_valid():
        return Response({'error': ser.errors}, status=400)
    ser.save(created_by=request.user)
    return Response({'client': ser.data}, status=201)


@api_view(['GET', 'PATCH', 'DELETE'])
def client_detail(request, pk):
    try:
        client = Client.objects.get(pk=pk)
    except Client.DoesNotExist:
        return Response({'error': 'Client not found'}, status=404)

    if request.method == 'GET':
        invoice_summary = (
            client.invoices.values('status')
            .annotate(count=Count('id'), total=Sum('total'))
        )
        return Response({
            'client': ClientSerializer(client).data,
            'invoiceSummary': list(invoice_summary),
        })

    if request.method == 'PATCH':
        ser = ClientSerializer(client, data=request.data, partial=True)
        if not ser.is_valid():
            return Response({'error': ser.errors}, status=400)
        ser.save()
        return Response({'client': ser.data})

    # DELETE
    if client.invoices.exists():
        return Response({'error': 'Cannot delete client with existing invoices. Deactivate instead.'}, status=409)
    client.delete()
    return Response({'message': 'Client deleted'})


# ══ INVOICES ═══════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
def invoices(request):
    if request.method == 'GET':
        qs = Invoice.objects.select_related('client').all()
        # Auto-mark overdue
        qs.filter(status='sent', due_date__lt=timezone.now().date()).update(status='overdue')

        status_f   = request.query_params.get('status')
        client_id  = request.query_params.get('client_id')
        from_date  = request.query_params.get('from')
        to_date    = request.query_params.get('to')
        search     = request.query_params.get('search')

        if status_f:   qs = qs.filter(status=status_f)
        if client_id:  qs = qs.filter(client_id=client_id)
        if from_date:  qs = qs.filter(issue_date__gte=from_date)
        if to_date:    qs = qs.filter(issue_date__lte=to_date)
        if search:
            qs = qs.filter(Q(invoice_number__icontains=search) | Q(client__name__icontains=search))

        return Response({'invoices': InvoiceListSerializer(qs, many=True).data})

    # POST — remap client_id -> client for DRF PrimaryKeyRelatedField
    data = request.data.copy()
    if 'client_id' in data and 'client' not in data:
        data['client'] = data.pop('client_id')
    ser = InvoiceWriteSerializer(data=data)
    if not ser.is_valid():
        return Response({'error': ser.errors}, status=400)
    invoice = ser.save(
        created_by=request.user,
        issue_date=data.get('issue_date') or timezone.now().date(),
    )
    return Response({'invoice': InvoiceListSerializer(invoice).data}, status=201)


@api_view(['GET', 'PATCH', 'PUT', 'DELETE'])
def invoice_detail(request, pk):
    try:
        invoice = Invoice.objects.select_related('client').prefetch_related('items', 'payments').get(pk=pk)
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=404)

    if request.method == 'GET':
        return Response({
            'invoice':  InvoiceDetailSerializer(invoice).data,
            'items':    InvoiceItemSerializer(invoice.items.all(), many=True).data,
            'payments': PaymentSerializer(invoice.payments.all(), many=True).data,
        })

    if request.method in ('PATCH', 'PUT'):
        # remap client_id -> client for DRF PrimaryKeyRelatedField
        data = request.data.copy()
        if 'client_id' in data and 'client' not in data:
            data['client'] = data.pop('client_id')
        partial = request.method == 'PATCH'
        ser = InvoiceWriteSerializer(invoice, data=data, partial=partial)
        if not ser.is_valid():
            return Response({'error': ser.errors}, status=400)
        ser.save()
        return Response({'message': 'Invoice updated'})

    # DELETE
    if invoice.status not in ('draft', 'cancelled'):
        return Response({'error': 'Only draft or cancelled invoices can be deleted'}, status=409)
    invoice.delete()
    return Response({'message': 'Invoice deleted'})


@api_view(['POST'])
def send_invoice_email(request, pk):
    try:
        invoice = Invoice.objects.select_related('client').get(pk=pk)
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=404)

    subject = f'Invoice {invoice.invoice_number} from {settings.COMPANY_NAME}'
    message = (
        f'Dear {invoice.client.name},\n\n'
        f'Please find your invoice details below:\n'
        f'Invoice #: {invoice.invoice_number}\n'
        f'Amount Due: {invoice.currency} {invoice.total}\n'
        f'Due Date: {invoice.due_date}\n\n'
        f'Thank you for your business!\n{settings.COMPANY_NAME}'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [invoice.client.email])
    except Exception as e:
        return Response({'error': f'Email failed: {str(e)}'}, status=500)

    if invoice.status == 'draft':
        invoice.status = 'sent'
    invoice.sent_at = timezone.now()
    invoice.save()
    return Response({'message': 'Invoice emailed successfully'})


@api_view(['POST'])
def record_payment(request, pk):
    try:
        invoice = Invoice.objects.get(pk=pk)
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=404)

    amount = request.data.get('amount')
    method = request.data.get('method')
    if not amount or not method:
        return Response({'error': 'Amount and method are required'}, status=400)

    Payment.objects.create(
        invoice=invoice,
        amount=amount,
        method=method,
        transaction_id=request.data.get('transaction_id', ''),
        notes=request.data.get('notes', ''),
        paid_at=request.data.get('paid_at') or timezone.now(),
        recorded_by=request.user,
    )
    invoice.status  = 'paid'
    invoice.paid_at = timezone.now()
    invoice.save()
    return Response({'message': 'Payment recorded'})


# ══ PAYMENTS ═══════════════════════════════════════════════════════════

@api_view(['GET'])
def payments(request):
    qs = Payment.objects.select_related('invoice', 'invoice__client').all()[:200]
    data = []
    for p in qs:
        d = PaymentSerializer(p).data
        d['invoice_number'] = p.invoice.invoice_number
        d['client_name']    = p.invoice.client.name
        data.append(d)
    return Response({'payments': data})


# ══ DASHBOARD ══════════════════════════════════════════════════════════

@api_view(['GET'])
def dashboard(request):
    # Auto-mark overdue
    Invoice.objects.filter(status='sent', due_date__lt=timezone.now().date()).update(status='overdue')

    from django.db.models import DecimalField, Value
    from django.db.models.functions import Coalesce

    inv_qs = Invoice.objects.all()

    # Summary totals
    totals = inv_qs.aggregate(
        total_invoices=Count('id'),
        total_revenue=Coalesce(Sum('total'), Value(0, output_field=DecimalField())),
        paid_amount=Coalesce(Sum('total', filter=Q(status='paid')), Value(0, output_field=DecimalField())),
        overdue_amount=Coalesce(Sum('total', filter=Q(status='overdue')), Value(0, output_field=DecimalField())),
        pending_amount=Coalesce(Sum('total', filter=Q(status='sent')), Value(0, output_field=DecimalField())),
    )

    # By status
    by_status = list(
        inv_qs.values('status')
        .annotate(count=Count('id'), amount=Coalesce(Sum('total'), Value(0, output_field=DecimalField())))
    )

    # Monthly revenue (last 12 months)
    twelve_months_ago = timezone.now().date() - datetime.timedelta(days=365)
    monthly = list(
        inv_qs.filter(issue_date__gte=twelve_months_ago)
        .annotate(month=TruncMonth('issue_date'))
        .values('month')
        .annotate(
            revenue=Coalesce(Sum('total', filter=Q(status='paid')), Value(0, output_field=DecimalField())),
            invoices=Count('id'),
        )
        .order_by('month')
    )
    for m in monthly:
        m['month'] = m['month'].strftime('%Y-%m')

    # Top clients
    from .models import Client
    top_clients = list(
        Client.objects.annotate(
            invoice_count=Count('invoices'),
            total_billed=Coalesce(Sum('invoices__total'), Value(0, output_field=DecimalField())),
            total_paid=Coalesce(Sum('invoices__total', filter=Q(invoices__status='paid')), Value(0, output_field=DecimalField())),
        ).order_by('-total_billed')[:5].values('name', 'company', 'invoice_count', 'total_billed', 'total_paid')
    )

    # Recent invoices
    recent = list(
        inv_qs.select_related('client').order_by('-created_at')[:10].values(
            'id', 'invoice_number', 'status', 'total', 'due_date', 'created_at', 'client__name'
        )
    )
    for r in recent:
        r['client_name'] = r.pop('client__name')

    # Overdue
    overdue = list(
        inv_qs.filter(status='overdue').select_related('client').order_by('due_date')[:10].values(
            'id', 'invoice_number', 'total', 'due_date', 'client__name', 'client__email'
        )
    )
    for o in overdue:
        o['client_name']  = o.pop('client__name')
        o['client_email'] = o.pop('client__email')

    return Response({
        'summary':    totals,
        'byStatus':   by_status,
        'monthly':    monthly,
        'topClients': top_clients,
        'recent':     recent,
        'overdue':    overdue,
    })
