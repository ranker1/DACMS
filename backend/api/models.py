from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import qrcode
from io import BytesIO
from django.core.files import File

class CustomUser(AbstractUser):
    ROLES = (
        ('ADMIN', 'Admin'),
        ('POLICE', 'Police Officer'),
        ('PATHOLOGIST', 'Pathologist'),
    )
    role = models.CharField(max_length=20, choices=ROLES, default='POLICE')

class AutopsyCase(models.Model):
    CASE_TYPES = [
        ('NORMAL', 'Clinical/Hospital'),
        ('FORENSIC', 'Forensic/Crime Division'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Arrival'),
        ('IN_PROGRESS', 'Examination In Progress'),
        ('TOX_PENDING', 'Pending Toxicology'),
        ('COMPLETE', 'Case Closed'),
    ]

    IDENTIFICATION_METHODS = [
        ('VISUAL', 'Visual Identification'),
        ('ID_CARD', 'ID Document found on body'),
        ('FINGERPRINT', 'Fingerprint Analysis'),
        ('DNA', 'DNA Profiling'),
        ('DENTAL', 'Dental Records (Odontology)'),
        ('UNKNOWN', 'Unidentified'),
    ]

    # --- 1. HEADER INFO ---
    case_id = models.CharField(max_length=20, unique=True)
    case_type = models.CharField(max_length=10, choices=CASE_TYPES, default='NORMAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # --- 2. SUBJECT DEMOGRAPHICS ---
    deceased_name = models.CharField(max_length=100)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('U', 'Unknown')])
    race = models.CharField(max_length=50, blank=True, help_text="e.g. African, Caucasian, Asian, Mixed")
    date_of_birth = models.DateField(null=True, blank=True)
    
    # --- 3. DEATH CIRCUMSTANCES ---
    place_of_death = models.CharField(max_length=200, blank=True, help_text="Location where death occurred")
    time_of_death = models.DateTimeField(null=True, blank=True)
    circumstances_of_death = models.TextField(blank=True, help_text="Police report summary, scene investigation notes")
    medical_history = models.TextField(blank=True, help_text="Relevant pre-existing conditions (Diabetes, Hypertension, etc.)")

    # --- 4. IDENTIFICATION ---
    identification_method = models.CharField(max_length=20, choices=IDENTIFICATION_METHODS, default='VISUAL')
    identification_notes = models.TextField(blank=True, help_text="Details of who identified the body and how")

    # --- 5. ADMINISTRATIVE ---
    ob_number = models.CharField(max_length=50, blank=True, help_text="Police OB Number")
    police_station = models.CharField(max_length=100, blank=True)
    investigating_officer = models.CharField(max_length=100, blank=True)
    
    # --- 6. VISUAL BODY MAP DATA ---
    external_injuries = models.TextField(blank=True, null=True) # Text summary
    body_map_data = models.JSONField(blank=True, null=True)     # Red dots coordinates
    
    date_of_arrival = models.DateTimeField(auto_now_add=True)
    qr_code_image = models.ImageField(upload_to='qr_codes/', blank=True)

    def __str__(self):
        return f"{self.case_id} - {self.deceased_name}"

    # --- QR CODE GENERATOR ---
    def save(self, *args, **kwargs):
        if not self.qr_code_image:
            qr_data = f"CASE ID: {self.case_id}\nNAME: {self.deceased_name}"
            qr = qrcode.make(qr_data)
            canvas = BytesIO()
            qr.save(canvas, format='PNG')
            file_name = f'qr_{self.case_id}.png'
            self.qr_code_image.save(file_name, File(canvas), save=False)

        super().save(*args, **kwargs)

class AutopsyReport(models.Model):
    MANNERS_OF_DEATH = [
        ('NATURAL', 'Natural'),
        ('ACCIDENT', 'Accident'),
        ('SUICIDE', 'Suicide'),
        ('HOMICIDE', 'Homicide'),
        ('UNDETERMINED', 'Undetermined'),
    ]

    BODY_HABITUS = [
        ('EMACIATED', 'Emaciated/Cachectic'),
        ('THIN', 'Thin'),
        ('NORM', 'Normal/Athletic'),
        ('OBESE', 'Obese'),
        ('MORBID', 'Morbidly Obese'),
    ]

    case = models.OneToOneField(AutopsyCase, on_delete=models.CASCADE, primary_key=True, related_name='report')
    pathologist = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    exam_date = models.DateTimeField(auto_now_add=True)

    # --- 1. EXTERNAL EXAM ---
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    bmi = models.FloatField(null=True, blank=True)
    
    body_habitus = models.CharField(max_length=20, choices=BODY_HABITUS, default='NORM')
    nutrition_notes = models.TextField(blank=True, help_text="Hydration, muscle wasting, etc.")

    hair_color = models.CharField(max_length=50, blank=True)
    eye_color = models.CharField(max_length=50, blank=True)
    dentition_status = models.CharField(max_length=100, blank=True, help_text="Natural, Dentures, Edentulous")

    rigor_mortis = models.CharField(max_length=100, blank=True)
    livor_mortis = models.CharField(max_length=100, blank=True)
    decomposition_changes = models.TextField(blank=True, help_text="Bloating, skin slippage, insect activity")
    
    clothing_description = models.TextField(blank=True)
    personal_effects = models.TextField(blank=True, help_text="Jewelry, cash, items found on body")
    medical_interventions = models.TextField(blank=True, help_text="CPR marks, IV lines, intubation")
    scars_tattoos = models.TextField(blank=True)

    # --- 2. INTERNAL EXAM (ORGAN WEIGHTS) ---
    heart_weight = models.FloatField(null=True, blank=True, help_text="Grams")
    lung_right_weight = models.FloatField(null=True, blank=True, help_text="Grams")
    lung_left_weight = models.FloatField(null=True, blank=True, help_text="Grams")
    liver_weight = models.FloatField(null=True, blank=True, help_text="Grams")
    spleen_weight = models.FloatField(null=True, blank=True, help_text="Grams")
    kidney_right_weight = models.FloatField(null=True, blank=True, help_text="Grams")
    kidney_left_weight = models.FloatField(null=True, blank=True, help_text="Grams")
    brain_weight = models.FloatField(null=True, blank=True, help_text="Grams")

    # --- 3. SYSTEM DESCRIPTIONS ---
    evisceration_technique = models.TextField(blank=True, default="Standard Y-incision and Rokitansky technique.")
    fluid_findings = models.TextField(blank=True, help_text="Pleural effusion, ascites, hemothorax")
    
    heart_findings = models.TextField(blank=True)
    lung_findings = models.TextField(blank=True)
    liver_findings = models.TextField(blank=True)
    stomach_contents = models.TextField(blank=True)
    neck_findings = models.TextField(blank=True)
    
    genitalia_findings = models.TextField(blank=True, help_text="Prostate/Testes or Uterus/Ovaries")
    endocrine_findings = models.TextField(blank=True, help_text="Thyroid, Adrenals, Pituitary")
    musculoskeletal_findings = models.TextField(blank=True, help_text="Rib fractures, muscle development")

    # --- 4. TOXICOLOGY & LABS ---
    specimens_collected = models.TextField(blank=True, help_text="e.g. Heart Blood, Femoral Blood, Vitreous")
    toxicology_results = models.TextField(blank=True, help_text="Detailed drug levels")
    lab_name = models.CharField(max_length=100, blank=True)
    
    histology_results = models.TextField(blank=True, help_text="Microscopic findings")
    microbiology_results = models.TextField(blank=True, help_text="Cultures (Blood, CSF)")
    postmortem_imaging = models.TextField(blank=True, help_text="X-Ray / CT Scan findings")

    # --- 5. CONCLUSION & EVIDENCE ---
    cause_of_death = models.TextField(blank=True)
    manner_of_death = models.CharField(max_length=20, choices=MANNERS_OF_DEATH, default='UNDETERMINED')
    final_summary = models.TextField(blank=True)
    
    evidence_disposition = models.TextField(blank=True, help_text="List of items collected and who received them")

    # --- 6. NEW PATHOLOGIST FIELDS ---
    pathologic_diagnoses = models.TextField(blank=True, help_text="List of findings (FAD). One per line.")
    organ_retention = models.TextField(blank=True, default="All organs returned to body.", help_text="Were any organs retained for teaching/further study?")

# --- NEW MODEL: HISTOLOGY CASSETTES ---
class HistologyCassette(models.Model):
    report = models.ForeignKey(AutopsyReport, on_delete=models.CASCADE, related_name='cassettes')
    cassette_id = models.CharField(max_length=10, help_text="e.g. A1, B2")
    tissue_type = models.CharField(max_length=100, help_text="e.g. Left Ventricle, Liver")
    description = models.TextField(blank=True, help_text="Microscopic findings for this specific slide")

    def __str__(self):
        return f"{self.cassette_id}: {self.tissue_type}"

class Evidence(models.Model):
    case = models.ForeignKey(AutopsyCase, on_delete=models.CASCADE, related_name='evidence')
    description = models.CharField(max_length=255)
    collected_at = models.DateTimeField(auto_now_add=True)
    chain_of_custody = models.TextField(blank=True)