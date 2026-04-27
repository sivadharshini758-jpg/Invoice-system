from django.core.management.base import BaseCommand
from api.models import User


class Command(BaseCommand):
    help = 'Create default admin user'

    def handle(self, *args, **kwargs):
        if User.objects.filter(email='admin@example.com').exists():
            self.stdout.write('Admin user already exists.')
            return
        User.objects.create_user(
            email='admin@example.com',
            name='System Admin',
            password='Admin@123',
            role='admin',
        )
        self.stdout.write(self.style.SUCCESS(
            '\n✅ Admin created: admin@example.com / Admin@123'
            '\n⚠️  CHANGE THE PASSWORD after first login!\n'
        ))
