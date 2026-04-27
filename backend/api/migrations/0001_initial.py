import uuid
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('role', models.CharField(choices=[('admin', 'Admin'), ('staff', 'Staff'), ('viewer', 'Viewer')], default='staff', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('groups', models.ManyToManyField(blank=True, related_name='api_user_set', to='auth.group')),
                ('user_permissions', models.ManyToManyField(blank=True, related_name='api_user_set', to='auth.permission')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254)),
                ('phone', models.CharField(blank=True, max_length=50)),
                ('company', models.CharField(blank=True, max_length=255)),
                ('address', models.TextField(blank=True)),
                ('city', models.CharField(blank=True, max_length=100)),
                ('country', models.CharField(blank=True, max_length=100)),
                ('tax_number', models.CharField(blank=True, max_length=100)),
                ('notes', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='clients_created', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Invoice',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('invoice_number', models.CharField(max_length=50, unique=True)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('sent', 'Sent'), ('paid', 'Paid'), ('overdue', 'Overdue'), ('cancelled', 'Cancelled')], default='draft', max_length=20)),
                ('issue_date', models.DateField()),
                ('due_date', models.DateField()),
                ('subtotal', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('tax_rate', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('tax_amount', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('discount_amount', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('total', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('currency', models.CharField(default='USD', max_length=10)),
                ('notes', models.TextField(blank=True)),
                ('terms', models.TextField(blank=True)),
                ('payment_link', models.TextField(blank=True)),
                ('stripe_payment_intent_id', models.CharField(blank=True, max_length=255)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.RESTRICT, related_name='invoices', to='api.client')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices_created', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='InvoiceItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('description', models.TextField()),
                ('quantity', models.DecimalField(decimal_places=2, default=1, max_digits=10)),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=15)),
                ('total', models.DecimalField(decimal_places=2, max_digits=15)),
                ('sort_order', models.IntegerField(default=0)),
                ('invoice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='api.invoice')),
            ],
            options={'ordering': ['sort_order']},
        ),
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('method', models.CharField(choices=[('stripe', 'Stripe'), ('paypal', 'PayPal'), ('razorpay', 'Razorpay'), ('bank', 'Bank Transfer'), ('cash', 'Cash'), ('cheque', 'Cheque'), ('upi', 'UPI')], max_length=50)),
                ('transaction_id', models.CharField(blank=True, max_length=255)),
                ('status', models.CharField(default='completed', max_length=30)),
                ('notes', models.TextField(blank=True)),
                ('paid_at', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('invoice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='api.invoice')),
                ('recorded_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='payments_recorded', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-paid_at']},
        ),
    ]
