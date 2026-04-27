from rest_framework import serializers
from .models import User, Client, Invoice, InvoiceItem, Payment


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'name', 'email', 'role', 'is_active', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = User
        fields = ['name', 'email', 'password', 'role']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ClientSerializer(serializers.ModelSerializer):
    invoice_count = serializers.SerializerMethodField()

    class Meta:
        model  = Client
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_invoice_count(self, obj):
        return obj.invoices.count()


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total', 'sort_order']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Payment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'recorded_by']


class InvoiceListSerializer(serializers.ModelSerializer):
    client_name    = serializers.CharField(source='client.name', read_only=True)
    client_email   = serializers.CharField(source='client.email', read_only=True)
    client_company = serializers.CharField(source='client.company', read_only=True)

    class Meta:
        model  = Invoice
        fields = [
            'id', 'invoice_number', 'status', 'issue_date', 'due_date',
            'total', 'currency', 'client_id',
            'client_name', 'client_email', 'client_company', 'created_at',
        ]


class InvoiceDetailSerializer(serializers.ModelSerializer):
    # Flat client fields — matches what the original Node.js backend returned
    client_name       = serializers.CharField(source='client.name',       read_only=True)
    client_email      = serializers.CharField(source='client.email',      read_only=True)
    client_company    = serializers.CharField(source='client.company',    read_only=True)
    client_address    = serializers.CharField(source='client.address',    read_only=True)
    client_city       = serializers.CharField(source='client.city',       read_only=True)
    client_country    = serializers.CharField(source='client.country',    read_only=True)
    client_tax_number = serializers.CharField(source='client.tax_number', read_only=True)
    client_phone      = serializers.CharField(source='client.phone',      read_only=True)

    class Meta:
        model  = Invoice
        # Explicit list — excludes the nested 'client' object, keeps client_id
        fields = [
            'id', 'invoice_number', 'status', 'issue_date', 'due_date',
            'subtotal', 'tax_rate', 'tax_amount', 'discount_amount', 'total',
            'currency', 'notes', 'terms', 'payment_link', 'stripe_payment_intent_id',
            'paid_at', 'sent_at', 'created_at', 'updated_at',
            'client_id',
            'client_name', 'client_email', 'client_company', 'client_address',
            'client_city', 'client_country', 'client_tax_number', 'client_phone',
        ]


class InvoiceWriteSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)

    class Meta:
        model  = Invoice
        fields = [
            'client', 'status', 'issue_date', 'due_date',
            'tax_rate', 'discount_amount', 'currency', 'notes', 'terms', 'items',
        ]

    def _calc_totals(self, items_data, tax_rate, discount_amount):
        subtotal   = sum(float(i['quantity']) * float(i['unit_price']) for i in items_data)
        tax_amount = subtotal * (float(tax_rate) / 100)
        total      = subtotal + tax_amount - float(discount_amount or 0)
        return subtotal, tax_amount, total

    def _gen_invoice_number(self):
        from django.utils import timezone
        year  = timezone.now().year
        count = Invoice.objects.filter(invoice_number__startswith=f'INV-{year}-').count()
        return f'INV-{year}-{str(count + 1).zfill(4)}'

    def create(self, validated_data):
        items_data      = validated_data.pop('items', [])
        tax_rate        = validated_data.get('tax_rate', 0)
        discount_amount = validated_data.get('discount_amount', 0)
        subtotal, tax_amount, total = self._calc_totals(items_data, tax_rate, discount_amount)

        invoice = Invoice.objects.create(
            invoice_number=self._gen_invoice_number(),
            subtotal=subtotal, tax_amount=tax_amount, total=total,
            **validated_data,
        )
        for i, item in enumerate(items_data):
            item_total = float(item['quantity']) * float(item['unit_price'])
            InvoiceItem.objects.create(invoice=invoice, total=item_total, sort_order=i, **item)
        return invoice

    def update(self, instance, validated_data):
        items_data      = validated_data.pop('items', None)
        tax_rate        = validated_data.get('tax_rate', instance.tax_rate)
        discount_amount = validated_data.get('discount_amount', instance.discount_amount)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        if items_data is not None:
            subtotal, tax_amount, total = self._calc_totals(items_data, tax_rate, discount_amount)
            instance.subtotal    = subtotal
            instance.tax_amount  = tax_amount
            instance.total       = total
            instance.items.all().delete()
            for i, item in enumerate(items_data):
                item_total = float(item['quantity']) * float(item['unit_price'])
                InvoiceItem.objects.create(invoice=instance, total=item_total, sort_order=i, **item)

        instance.save()
        return instance
