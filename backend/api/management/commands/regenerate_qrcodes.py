from django.core.management.base import BaseCommand
from api.models import AutopsyCase
import qrcode
from io import BytesIO
from django.core.files import File


class Command(BaseCommand):
    help = 'Regenerates QR codes for all autopsy cases with updated information'

    def handle(self, *args, **options):
        cases = AutopsyCase.objects.all()
        count = 0

        for case in cases:
            # Build comprehensive summary for QR code
            qr_data = f"""CASE ID: {case.case_id}
NAME: {case.deceased_name}
AGE: {case.age if case.age else 'N/A'}
GENDER: {case.gender}
DOB: {case.date_of_birth if case.date_of_birth else 'N/A'}
TYPE: {case.case_type}
STATUS: {case.status}
OB#: {case.ob_number if case.ob_number else 'N/A'}
STATION: {case.police_station if case.police_station else 'N/A'}
OFFICER: {case.investigating_officer if case.investigating_officer else 'N/A'}
PLACE: {case.place_of_death if case.place_of_death else 'N/A'}
TIME: {case.time_of_death if case.time_of_death else 'N/A'}
ID METHOD: {case.identification_method}
ARRIVED: {case.date_of_arrival.strftime('%Y-%m-%d %H:%M') if case.date_of_arrival else 'N/A'}"""

            qr = qrcode.make(qr_data)
            canvas = BytesIO()
            qr.save(canvas, format='PNG')
            file_name = f'qr_{case.case_id}.png'
            case.qr_code_image.save(file_name, File(canvas), save=False)
            case.save()
            
            count += 1
            self.stdout.write(self.style.SUCCESS(f'✓ Regenerated QR code for {case.case_id}'))

        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully regenerated {count} QR codes'))
