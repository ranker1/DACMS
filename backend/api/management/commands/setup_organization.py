from django.core.management.base import BaseCommand
from api.models import Organization


class Command(BaseCommand):
    help = 'Set up default organization configuration for Ministry of Health - Kenya'

    def handle(self, *args, **options):
        # Check if organization already exists
        if Organization.objects.exists():
            self.stdout.write(self.style.WARNING('Organization already exists. Skipping setup.'))
            return

        # Create default organization
        org = Organization.objects.create(
            name="Ministry of Health - Republic of Kenya",
            department="Department of Forensic Pathology",
            address="Afya House, Cathedral Road, P.O. Box 30016-00100, Nairobi, Kenya",
            phone="+254 20 2717077",
            email="info@health.go.ke",
            website="https://www.health.go.ke",
            report_footer="This is an official government document of the Ministry of Health, Republic of Kenya. Unauthorized reproduction is prohibited."
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully created organization: {org.name}'))