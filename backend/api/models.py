import qrcode
from io import BytesIO
from django.core.files import File
from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

# 1. Custom User Model (Role-Based Access)
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('PATHOLOGIST', 'Pathologist'),
        ('TECHNICIAN', 'Morgue Technician'),
        ('POLICE', 'Police Liaison'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='TECHNICIAN')
    badge_number = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

# 2. The Autopsy Case (The Core)
class AutopsyCase(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('RELEASED', 'Body Released'),
    )
    
    case_id = models.CharField(max_length=20, unique=True, editable=False)
    ob_number = models.CharField(max_length=50, help_text="Police Occurrence Book Number")
    police_station = models.CharField(max_length=100)
    
    deceased_name = models.CharField(max_length=100, default="Unknown")
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('U', 'Unknown')])
    
    date_of_arrival = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    assigned_pathologist = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'PATHOLOGIST'})
    qr_code_image = models.ImageField(upload_to='qr_codes/', blank=True, null=True)

    def save(self, *args, **kwargs):
        # 1. Generate Case ID if it doesn't exist
        if not self.case_id:
            self.case_id = "CASE-" + str(uuid.uuid4())[:8].upper()

        # 2. Generate QR Code Image
        # We verify if we already have one to avoid re-generating it on every simple update
        if not self.qr_code_image:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            # This is the data hidden in the QR code (The Case ID)
            qr.add_data(self.case_id)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")

            # Save image to a memory buffer
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            file_name = f'qr_{self.case_id}.png'
            
            # Save the file to the Django ImageField
            self.qr_code_image.save(file_name, File(buffer), save=False)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.case_id} - {self.deceased_name}"

# 3. Evidence Tracking
class Evidence(models.Model):
    case = models.ForeignKey(AutopsyCase, related_name='evidence', on_delete=models.CASCADE)
    item_name = models.CharField(max_length=200) # e.g., "Blood Sample", "Clothing"
    collected_at = models.DateTimeField(auto_now_add=True)
    collected_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    location = models.CharField(max_length=100, default="Evidence Locker")

    def __str__(self):
        return f"{self.item_name} ({self.case.case_id})"

# 4. The Final Report
class AutopsyReport(models.Model):
    case = models.OneToOneField(AutopsyCase, on_delete=models.CASCADE, primary_key=True, related_name='report')
    cause_of_death = models.TextField()
    manner_of_death = models.CharField(max_length=20, choices=[
        ('HOMICIDE', 'Homicide'),
        ('SUICIDE', 'Suicide'),
        ('ACCIDENT', 'Accidental'),
        ('NATURAL', 'Natural'),
        ('UNDETERMINED', 'Undetermined')
    ])
    details = models.TextField(help_text="Full internal/external examination notes")
    finalized_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report for {self.case.case_id}"