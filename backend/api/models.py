from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import qrcode
from io import BytesIO
from django.core.files import File

class Organization(models.Model):
    """Organization/Ministry/Hospital configuration"""
    ORG_TYPES = [
        ('MINISTRY', 'Ministry of Health'),
        ('HOSPITAL', 'Government Hospital'),
        ('PRIVATE', 'Private Institution'),
    ]

    name = models.CharField(max_length=200, default="Ministry of Health - Kenya")
    org_type = models.CharField(max_length=20, choices=ORG_TYPES, default='MINISTRY')
    department = models.CharField(max_length=200, default="Department of Forensic Pathology")
    address = models.TextField(blank=True, help_text="Official address")
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    # Branding
    logo = models.ImageField(upload_to='logos/', blank=True, help_text="Organization logo")
    primary_color = models.CharField(max_length=7, default="#2563eb", help_text="Hex color code")
    secondary_color = models.CharField(max_length=7, default="#1e40af", help_text="Hex color code")

    # Parent organization (for hospitals under ministry)
    parent_org = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='child_orgs')

    # Settings
    report_footer = models.TextField(default="This is an official government document. Unauthorized reproduction is prohibited.")
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_org_type_display()})"

    class Meta:
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"

    @property
    def is_ministry(self):
        return self.org_type == 'MINISTRY'

    @property
    def is_hospital(self):
        return self.org_type == 'HOSPITAL'

class CustomUser(AbstractUser):
    ROLES = (
        # Ministry Level
        ('MINISTRY_ADMIN', 'Ministry Administrator'),
        ('MINISTRY_SUPERVISOR', 'Ministry Supervisor'),

        # Hospital Level
        ('HOSPITAL_ADMIN', 'Hospital Administrator'),
        ('PATHOLOGIST', 'Pathologist'),
        ('POLICE', 'Police Officer'),
        ('LAB_TECH', 'Laboratory Technician'),
    )

    role = models.CharField(max_length=20, choices=ROLES, default='POLICE')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='users')

    # Additional fields
    employee_id = models.CharField(max_length=20, blank=True, help_text="Employee/Staff ID")
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()}) - {self.organization.name}"

    @property
    def is_ministry_level(self):
        return self.role in ['MINISTRY_ADMIN', 'MINISTRY_SUPERVISOR']

    @property
    def is_hospital_level(self):
        return self.role in ['HOSPITAL_ADMIN', 'PATHOLOGIST', 'POLICE', 'LAB_TECH']

    @property
    def can_manage_cases(self):
        return self.role in ['MINISTRY_ADMIN', 'MINISTRY_SUPERVISOR', 'HOSPITAL_ADMIN', 'PATHOLOGIST']

    @property
    def can_manage_users(self):
        return self.role in ['MINISTRY_ADMIN', 'HOSPITAL_ADMIN']

    @property
    def can_view_all_cases(self):
        return self.is_ministry_level or (self.role == 'HOSPITAL_ADMIN')

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
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='cases')
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
    
    date_of_arrival = models.DateTimeField(null=True, blank=True, help_text="When the body arrived at the morgue")
    qr_code_image = models.ImageField(upload_to='qr_codes/', blank=True)
    # Flag to indicate a closed case was later reopened
    reopened = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.case_id} - {self.deceased_name}"

    # --- QR CODE GENERATOR ---
    def save(self, *args, **kwargs):
        if not self.qr_code_image:
            # Build comprehensive summary for QR code
            qr_data = f"""CASE ID: {self.case_id}
NAME: {self.deceased_name}
AGE: {self.age if self.age else 'N/A'}
GENDER: {self.gender}
DOB: {self.date_of_birth if self.date_of_birth else 'N/A'}
TYPE: {self.case_type}
STATUS: {self.status}
OB#: {self.ob_number if self.ob_number else 'N/A'}
STATION: {self.police_station if self.police_station else 'N/A'}
OFFICER: {self.investigating_officer if self.investigating_officer else 'N/A'}
PLACE: {self.place_of_death if self.place_of_death else 'N/A'}
TIME: {self.time_of_death if self.time_of_death else 'N/A'}
ID METHOD: {self.identification_method}
ARRIVED: {self.date_of_arrival.strftime('%Y-%m-%d %H:%M') if self.date_of_arrival else 'N/A'}"""
            
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
    # Frontend posts `item_name` and `location` so keep explicit fields
    # Allow null for existing rows so migrations do not prompt for a default
    item_name = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    collected_at = models.DateTimeField(auto_now_add=True)


# Assignment model to tie a case to a pathologist (or police officer)
class CaseAssignment(models.Model):
    case = models.OneToOneField(AutopsyCase, on_delete=models.CASCADE, related_name='assignment')
    assignee = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, related_name='assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.case.case_id} -> {self.assignee.username if self.assignee else 'Unassigned'}"


# Simple audit log for create/update/delete actions
class AuditLog(models.Model):
    ACTIONS = (('CREATE', 'Create'), ('UPDATE', 'Update'), ('DELETE', 'Delete'))
    user = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=10, choices=ACTIONS)
    model_name = models.CharField(max_length=100)
    object_pk = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    changes = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"{self.timestamp.isoformat()} {self.action} {self.model_name}({self.object_pk}) by {self.user}"
    chain_of_custody = models.TextField(blank=True)


# --- Consent for Clinical Autopsies ---
class Consent(models.Model):
    case = models.OneToOneField(AutopsyCase, on_delete=models.CASCADE, related_name='consent')
    consent_given = models.BooleanField(default=False)
    signer_name = models.CharField(max_length=100, blank=True)
    relationship = models.CharField(max_length=50, blank=True)
    signed_at = models.DateTimeField(null=True, blank=True)
    form_file = models.FileField(upload_to='consents/', null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Consent for {self.case.case_id} - {'Given' if self.consent_given else 'Not Given'}"


# --- Observers (Police, Treating Doctor, Students, Photographers) ---
class Observer(models.Model):
    OBSERVER_ROLES = (
        ('POLICE', 'Police/Detective'),
        ('TREATING_DOCTOR', 'Treating Physician'),
        ('STUDENT', 'Medical Student/Resident'),
        ('PHOTOGRAPHER', 'Forensic Photographer'),
        ('OTHER', 'Other')
    )
    case = models.ForeignKey(AutopsyCase, on_delete=models.CASCADE, related_name='observers')
    user = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=30, choices=OBSERVER_ROLES, default='OTHER')
    present = models.BooleanField(default=True)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        who = self.user.username if self.user else self.name or 'Unknown'
        return f"{who} ({self.role}) on {self.case.case_id}"


# --- Chain of Custody Events ---
class ChainOfCustody(models.Model):
    EVENT_TYPES = (
        ('TRANSFER', 'Transfer'),
        ('RECEIPT', 'Receipt'),
        ('STORAGE', 'Storage'),
        ('RELEASE', 'Release'),
        ('SEAL', 'Seal/Unseal')
    )
    evidence = models.ForeignKey('Evidence', on_delete=models.CASCADE, null=True, blank=True, related_name='chain_events')
    case = models.ForeignKey(AutopsyCase, on_delete=models.CASCADE, null=True, blank=True, related_name='chain_events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    from_user = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='custody_from')
    to_user = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='custody_to')
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.event_type} @ {self.timestamp.isoformat()} ({self.case.case_id if self.case else 'NoCase'})"


# --- Evidence Photos / Exhibits ---
class EvidencePhoto(models.Model):
    evidence = models.ForeignKey('Evidence', on_delete=models.CASCADE, null=True, blank=True, related_name='photos')
    case = models.ForeignKey(AutopsyCase, on_delete=models.CASCADE, null=True, blank=True, related_name='photos')
    image = models.ImageField(upload_to='evidence_photos/')
    caption = models.CharField(max_length=255, blank=True)
    photographer_name = models.CharField(max_length=100, blank=True)
    photographer_role = models.CharField(max_length=50, blank=True)
    taken_at = models.DateTimeField(null=True, blank=True)
    is_exhibit = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo {self.id} for {self.case.case_id if self.case else (self.evidence.case.case_id if self.evidence else 'Unknown')}"