from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Organization

User = get_user_model()

class Command(BaseCommand):
    help = 'Set up test users and organizations for multi-tenant system'

    def handle(self, *args, **options):
        # Get or create organizations
        ministry_org, created = Organization.objects.get_or_create(
            name="Ministry of Health - Republic of Kenya",
            defaults={
                'org_type': 'MINISTRY',
                'department': 'Department of Forensic Pathology',
                'primary_color': '#2563eb',
                'secondary_color': '#1e40af',
            }
        )

        hospital_org, created = Organization.objects.get_or_create(
            name="Kenyatta National Hospital",
            defaults={
                'org_type': 'HOSPITAL',
                'department': 'Forensic Pathology Unit',
                'primary_color': '#dc2626',
                'secondary_color': '#b91c1c',
                'parent_org': ministry_org,
            }
        )

        # Create test users
        users_data = [
            {
                'username': 'ministry_admin',
                'email': 'admin@health.go.ke',
                'role': 'MINISTRY_ADMIN',
                'organization': ministry_org,
                'first_name': 'Ministry',
                'last_name': 'Admin',
            },
            {
                'username': 'hospital_admin',
                'email': 'admin@knh.or.ke',
                'role': 'HOSPITAL_ADMIN',
                'organization': hospital_org,
                'first_name': 'Hospital',
                'last_name': 'Admin',
            },
            {
                'username': 'pathologist',
                'email': 'pathologist@knh.or.ke',
                'role': 'PATHOLOGIST',
                'organization': hospital_org,
                'first_name': 'Dr.',
                'last_name': 'Pathologist',
            },
            {
                'username': 'police',
                'email': 'officer@police.go.ke',
                'role': 'POLICE',
                'organization': hospital_org,
                'first_name': 'Police',
                'last_name': 'Officer',
            },
        ]

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'role': user_data['role'],
                    'organization': user_data['organization'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                }
            )

            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {user.username} ({user.role})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'User already exists: {user.username}')
                )

        self.stdout.write(
            self.style.SUCCESS('Test users setup complete!')
        )
        self.stdout.write('Login credentials:')
        self.stdout.write('  ministry_admin: password123')
        self.stdout.write('  hospital_admin: password123')
        self.stdout.write('  pathologist: password123')
        self.stdout.write('  police: password123')