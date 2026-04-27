import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# ── USER ──────────────────────────────────────────────────────────────
class UserManager(BaseUserManager):
    def create_user(self, email, name, password, role='staff'):
        if not email:
            raise ValueError('Email required')
        user = self.model(email=self.normalize_email(email), name=name, role=role)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password):
        user = self.create_user(email, name, password, role='admin')
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('admin', 'Admin'), ('staff', 'Staff'), ('viewer', 'Viewer')]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name       = models.CharField(max_length=255)
    email      = models.EmailField(unique=True)
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['name']
    objects = UserManager()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.email})'


# ── CLIENT ────────────────────────────────────────────────────────────
class Client(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name       = models.CharField(max_length=255)
    email      = models.EmailField()
    phone      = models.CharField(max_length=50, blank=True)
    company    = models.CharField(max_length=255, blank=True)
    address    = models.TextField(blank=True)
    city       = models.CharField(max_length=100, blank=True)
    country    = models.CharField(max_length=100, blank=True)
    tax_number = models.CharField(max_length=100, blank=True)
    notes      = models.TextField(blank=True)
    is_active  = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='clients_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


# ── INVOICE ───────────────────────────────────────────────────────────
class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'), ('sent', 'Sent'), ('paid', 'Paid'),
        ('overdue', 'Overdue'), ('cancelled', 'Cancelled'),
    ]

    id                       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number           = models.CharField(max_length=50, unique=True)
    client                   = models.ForeignKey(Client, on_delete=models.RESTRICT, related_name='invoices')
    status                   = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    issue_date               = models.DateField()
    due_date                 = models.DateField()
    subtotal                 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_rate                 = models.DecimalField(max_digits=5,  decimal_places=2, default=0)
    tax_amount               = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_amount          = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total                    = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency                 = models.CharField(max_length=10, default='USD')
    notes                    = models.TextField(blank=True)
    terms                    = models.TextField(blank=True)
    payment_link             = models.TextField(blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    paid_at                  = models.DateTimeField(null=True, blank=True)
    sent_at                  = models.DateTimeField(null=True, blank=True)
    created_by               = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='invoices_created')
    created_at               = models.DateTimeField(auto_now_add=True)
    updated_at               = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.invoice_number


# ── INVOICE ITEM ──────────────────────────────────────────────────────
class InvoiceItem(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice     = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.TextField()
    quantity    = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price  = models.DecimalField(max_digits=15, decimal_places=2)
    total       = models.DecimalField(max_digits=15, decimal_places=2)
    sort_order  = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order']


# ── PAYMENT ───────────────────────────────────────────────────────────
class Payment(models.Model):
    METHOD_CHOICES = [
        ('stripe','Stripe'), ('paypal','PayPal'), ('razorpay','Razorpay'),
        ('bank','Bank Transfer'), ('cash','Cash'), ('cheque','Cheque'), ('upi','UPI'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice        = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount         = models.DecimalField(max_digits=15, decimal_places=2)
    method         = models.CharField(max_length=50, choices=METHOD_CHOICES)
    transaction_id = models.CharField(max_length=255, blank=True)
    status         = models.CharField(max_length=30, default='completed')
    notes          = models.TextField(blank=True)
    paid_at        = models.DateTimeField()
    recorded_by    = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='payments_recorded')
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-paid_at']
