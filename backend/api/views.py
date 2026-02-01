import os
from django.conf import settings
from reportlab.lib.colors import red, black, white
from reportlab.lib.utils import ImageReader
from .models import AutopsyCase
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from .models import CustomUser, AutopsyCase, Evidence, AutopsyReport
from .serializers import UserSerializer, AutopsyCaseSerializer, EvidenceSerializer, ReportSerializer
from .models import HistologyCassette
from .serializers import HistologyCassetteSerializer
from rest_framework.parsers import JSONParser
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import AuditLog
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import json
from .models import Consent, Observer, ChainOfCustody, EvidencePhoto
from .serializers import ConsentSerializer, ObserverSerializer, ChainOfCustodySerializer, EvidencePhotoSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from reportlab.lib.pagesizes import letter

# Custom Permission
class IsPathologistOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role in ['PATHOLOGIST', 'ADMIN'])


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class ReadOnlyForPolice(permissions.BasePermission):
    """Allow read-only for police; full access for pathologist/admin."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'POLICE' and request.method not in permissions.SAFE_METHODS:
            return False
        return True


class IsAssigneeOrAdminOrPathologist(permissions.BasePermission):
    """Object-level: allow edit if user is assignee, pathologist, or admin; police read-only."""
    def has_object_permission(self, request, view, obj):
        # SAFE methods allowed for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Admin always allowed
        if request.user.role == 'ADMIN':
            return True

        # Pathologists allowed
        if request.user.role == 'PATHOLOGIST':
            return True

        # If object has assignment, only assignee can edit
        assignment = getattr(obj, 'assignment', None)
        if assignment and assignment.assignee_id == getattr(request.user, 'id', None):
            return True

        return False

# 1. User ViewSet
class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated] # Only logged-in users

# 2. Case ViewSet
class AutopsyCaseViewSet(viewsets.ModelViewSet):
    queryset = AutopsyCase.objects.all().order_by('-date_of_arrival')
    serializer_class = AutopsyCaseSerializer
    permission_classes = [permissions.IsAuthenticated, ReadOnlyForPolice, IsAssigneeOrAdminOrPathologist]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Police see only cases (read-only) but restrict sensitive fields server-side via serializers/UI
        if user.role == 'POLICE':
            return qs  # could filter further if needed (e.g., by police station)
        # Pathologists see all cases; admins see all
        return qs

    def perform_create(self, serializer):
        # Only pathologist or admin can create
        if not (self.request.user.role in ['PATHOLOGIST', 'ADMIN']):
            raise permissions.PermissionDenied('Only pathologists or admins can create cases')
        instance = serializer.save()
        # Optionally assign the creator as assignee
        try:
            from .models import CaseAssignment
            CaseAssignment.objects.update_or_create(case=instance, defaults={'assignee': self.request.user})
        except Exception:
            pass
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        autopsy_case = self.get_object()
        
        # Create the HttpResponse object with the appropriate PDF headers.
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Report_{autopsy_case.case_id}.pdf"'

        # Create the PDF object, using the response object as its "file."
        p = canvas.Canvas(response, pagesize=A4)
        width, height = A4

        # --- HEADER ---
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, "MINISTRY OF HEALTH - KENYA")
        p.setFont("Helvetica", 12)
        p.drawString(50, height - 70, "Department of Forensic Pathology")
        
        # Draw a line
        p.line(50, height - 80, width - 50, height - 80)

        # --- CASE INFO ---
        y = height - 120
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, f"CASE REPORT: {autopsy_case.case_id}")
        
        p.setFont("Helvetica", 11)
        y -= 25
        p.drawString(50, y, f"Deceased: {autopsy_case.deceased_name}")
        p.drawString(300, y, f"OB Number: {autopsy_case.ob_number}")
        
        y -= 20
        p.drawString(50, y, f"Age/Gender: {autopsy_case.age} / {autopsy_case.gender}")
        p.drawString(300, y, f"Date: {autopsy_case.date_of_arrival.strftime('%Y-%m-%d')}")

        # --- THE FINDINGS (Check if report exists) ---
        # --- THE FINDINGS (Safe Check) ---
        y -= 40
        p.line(50, y, width - 50, y)
        y -= 30
        
        # Check if the attribute 'report' exists on the case object
        if hasattr(autopsy_case, 'report'):
            report = autopsy_case.report
            
            p.setFont("Helvetica-Bold", 12)
            p.drawString(50, y, "CAUSE OF DEATH:")
            p.setFont("Helvetica", 11)
            y -= 20
            p.drawString(50, y, f"{report.cause_of_death}")
            
            y -= 40
            p.setFont("Helvetica-Bold", 12)
            p.drawString(50, y, "MANNER OF DEATH:")
            p.setFont("Helvetica", 11)
            p.drawString(200, y, f"{report.manner_of_death}")

            y -= 40
            p.setFont("Helvetica-Bold", 12)
            p.drawString(50, y, "EXAMINATION NOTES:")
            y -= 20
            
            # Simple text wrapping for long notes
            text = p.beginText(50, y)
            text.setFont("Helvetica", 10)
            text.textLines(report.final_summary or "No summary available")
            p.drawText(text)
        else:
            # If no report exists yet
            p.setFont("Helvetica-Oblique", 12)
            p.setFillColor(colors.red)
            p.drawString(50, y, "PENDING PATHOLOGIST REPORT")

        # --- FOOTER ---
        p.setFont("Helvetica", 9)
        p.setFillColor(colors.black)
        p.drawString(50, 50, f"Generated by DACMS on {timezone.now().strftime('%Y-%m-%d %H:%M')}")
        p.drawString(50, 35, "This is a computer-generated document.")

        # Close the PDF object cleanly, and we're done.
        p.showPage()
        p.save()
        return response

# 3. Evidence ViewSet
class EvidenceViewSet(viewsets.ModelViewSet):
    queryset = Evidence.objects.all()
    serializer_class = EvidenceSerializer


# Histology cassette endpoints (list/create under a report, and detail)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def cassette_list_create(request, report_id):
    # Ensure report exists
    report = get_object_or_404(AutopsyReport, pk=report_id)

    if request.method == 'GET':
        q = HistologyCassette.objects.filter(report=report)
        serializer = HistologyCassetteSerializer(q, many=True)
        return Response(serializer.data)

    # POST -> create
    data = request.data.copy()
    data['report'] = report.id
    serializer = HistologyCassetteSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pathologists_list(request):
    qs = CustomUser.objects.filter(role='PATHOLOGIST')
    serializer = UserSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET', 'DELETE', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def cassette_detail(request, report_id, cassette_id):
    report = get_object_or_404(AutopsyReport, pk=report_id)
    cassette = get_object_or_404(HistologyCassette, pk=cassette_id, report=report)

    if request.method == 'GET':
        serializer = HistologyCassetteSerializer(cassette)
        return Response(serializer.data)

    if request.method in ['PUT', 'PATCH']:
        serializer = HistologyCassetteSerializer(cassette, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        cassette.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ViewSet alternative (router-friendly). Keeps behaviour similar to the function views above.
class HistologyCassetteViewSet(viewsets.ModelViewSet):
    serializer_class = HistologyCassetteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        report_id = self.kwargs.get('report_id')
        if report_id:
            return HistologyCassette.objects.filter(report__pk=report_id)
        return HistologyCassette.objects.all()

    def perform_create(self, serializer):
        report_id = self.kwargs.get('report_id')
        report = get_object_or_404(AutopsyReport, pk=report_id)
        serializer.save(report=report)


# Case assignment endpoint: GET current assignment, POST to set/unset
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def case_assignment_view(request, case_pk):
    from .models import CaseAssignment
    case = get_object_or_404(AutopsyCase, pk=case_pk)

    if request.method == 'GET':
        try:
            a = CaseAssignment.objects.get(case=case)
            return Response({'assignee_id': a.assignee.id if a.assignee else None, 'assignee_username': a.assignee.username if a.assignee else None})
        except CaseAssignment.DoesNotExist:
            return Response({'assignee_id': None, 'assignee_username': None})

    # POST -> set/unset assignment
    if request.user.role not in ['ADMIN', 'PATHOLOGIST']:
        return Response({'detail': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

    assignee_id = request.data.get('assignee_id')
    if assignee_id:
        user = get_object_or_404(CustomUser, pk=assignee_id)
        obj, created = CaseAssignment.objects.update_or_create(case=case, defaults={'assignee': user})
        return Response({'status': 'assigned', 'assignee_id': user.id, 'assignee_username': user.username})
    else:
        CaseAssignment.objects.filter(case=case).delete()
        return Response({'status': 'unassigned'})


# Simple audit logging via signals
@receiver(post_save, sender=AutopsyCase)
def log_case_save(sender, instance, created, **kwargs):
    try:
        user = None
        # Attempt to fetch user from thread/request is not straightforward; leave null if unknown
        AuditLog.objects.create(user=user, action='CREATE' if created else 'UPDATE', model_name='AutopsyCase', object_pk=str(instance.pk), changes=None)
    except Exception:
        pass


@receiver(post_delete, sender=AutopsyCase)
def log_case_delete(sender, instance, **kwargs):
    try:
        AuditLog.objects.create(user=None, action='DELETE', model_name='AutopsyCase', object_pk=str(instance.pk), changes=None)
    except Exception:
        pass

# 4. Report ViewSet
class ReportViewSet(viewsets.ModelViewSet):
    queryset = AutopsyReport.objects.all()
    serializer_class = ReportSerializer

    permission_classes = [permissions.IsAuthenticated, ReadOnlyForPolice, IsAssigneeOrAdminOrPathologist]

    def get_permissions(self):
        # Keep default check then object-level permission will be enforced
        return [p() for p in self.permission_classes]

    def perform_create(self, serializer):
        case_id = self.request.data.get('case_id')
        case = AutopsyCase.objects.get(pk=case_id)
        serializer.save(case=case, pathologist=self.request.user)


# --- New ViewSets for Consent / Observers / Chain / Photos ---
class ConsentViewSet(viewsets.ModelViewSet):
    queryset = Consent.objects.all()
    serializer_class = ConsentSerializer
    permission_classes = [IsAuthenticated, ReadOnlyForPolice]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = super().get_queryset()
        case = self.request.query_params.get('case')
        if case:
            return qs.filter(case__pk=case)
        return qs


class ObserverViewSet(viewsets.ModelViewSet):
    queryset = Observer.objects.all()
    serializer_class = ObserverSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        qs = super().get_queryset()
        case = self.request.query_params.get('case')
        if case:
            return qs.filter(case__pk=case)
        return qs


class ChainOfCustodyViewSet(viewsets.ModelViewSet):
    queryset = ChainOfCustody.objects.all().order_by('-timestamp')
    serializer_class = ChainOfCustodySerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        qs = super().get_queryset()
        case = self.request.query_params.get('case')
        if case:
            return qs.filter(case__pk=case).order_by('-timestamp')
        return qs


class EvidencePhotoViewSet(viewsets.ModelViewSet):
    queryset = EvidencePhoto.objects.all().order_by('-uploaded_at')
    serializer_class = EvidencePhotoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def get_queryset(self):
        qs = super().get_queryset()
        case = self.request.query_params.get('case')
        evidence = self.request.query_params.get('evidence')
        if case:
            return qs.filter(case__pk=case).order_by('-uploaded_at')
        if evidence:
            return qs.filter(evidence__pk=evidence).order_by('-uploaded_at')
        return qs

# Custom Login View that returns the Role
class CustomLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'role': user.role  # <--- This is the golden ticket
        })
    

class RegisterUserView(APIView):
    def post(self, request):
        # 1. Security Check: Only Admins can create users
        if not request.user.is_superuser and request.user.role != 'ADMIN':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        # 2. Get Data
        username = request.data.get('username')
        password = request.data.get('password')
        role = request.data.get('role')

        # 3. Validation
        if not username or not password or not role:
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Create User
        try:
            user = CustomUser.objects.create_user(username=username, password=password, role=role)
            return Response({'message': f'User {username} created successfully!'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
def generate_pdf(request, case_id):
    # --- 1. GET THE CASE ---
    try:
        case = AutopsyCase.objects.get(pk=case_id)
    except (AutopsyCase.DoesNotExist, ValueError):
        try:
            case = AutopsyCase.objects.get(case_id=case_id)
        except AutopsyCase.DoesNotExist:
            return HttpResponse("Case not found", status=404)

    # --- 2. SETUP PDF ---
    response = HttpResponse(content_type='application/pdf')
    filename = f"{case.case_id}_Full_Report.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    p = canvas.Canvas(response, pagesize=letter)
    p.setTitle(f"Forensic Autopsy - {case.case_id}")

    # Helper: Safe Text
    def get_text(val, default="N/A"):
        return str(val) if val else default

    # Helper: Draw Header
    def draw_header(title, is_first_page=False):
        p.setFillColor(black)
        # Main Title
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, 750, f"OFFICIAL AUTOPSY REPORT: {case.case_id}")
        
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, 735, "CONFIDENTIAL - FORENSIC PATHOLOGY UNIT")
        p.line(50, 730, 550, 730)
        
        # Section Title (Top Right)
        if not is_first_page:
            p.setFont("Helvetica-Oblique", 12)
            p.drawRightString(550, 735, title)
        
        # QR Code (Only on First Page)
        if is_first_page and case.qr_code_image:
            try:
                qr_path = case.qr_code_image.path 
                if os.path.exists(qr_path):
                    p.drawImage(ImageReader(qr_path), 480, 680, width=65, height=65)
                    p.setFont("Helvetica", 6)
                    p.drawCentredString(512, 675, "SCAN TO VERIFY")
            except Exception:
                pass

    # ================= PAGE 1: IDENTIFICATION & HISTORY =================
    draw_header("Identification", is_first_page=True)

    # FIX: Start content at 700 (below header line at 730)
    y = 700

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "1. DECEDENT DEMOGRAPHICS")
    p.setFont("Helvetica", 10)
    y -= 20
    
    p.drawString(50, y, f"Name: {get_text(case.deceased_name)}")
    p.drawString(280, y, f"DOB: {get_text(case.date_of_birth)}")
    y -= 15
    p.drawString(50, y, f"Age: {get_text(case.age)}")
    p.drawString(280, y, f"Arrival: {case.date_of_arrival.strftime('%Y-%m-%d')}")
    y -= 15
    p.drawString(50, y, f"Sex: {get_text(case.gender)}")
    p.drawString(280, y, f"Place Death: {get_text(case.place_of_death)}")
    y -= 15
    p.drawString(50, y, f"Race: {get_text(case.race)}")
    p.drawString(280, y, f"Time Death: {get_text(case.time_of_death)}")
    
    y -= 20
    p.line(50, y, 550, y)
    y -= 20

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "2. IDENTIFICATION")
    y -= 20
    p.setFont("Helvetica", 10)
    p.drawString(50, y, f"Method: {get_text(case.identification_method)}")
    y -= 15
    p.drawString(50, y, f"Notes: {get_text(case.identification_notes)}")
    y -= 20

    p.line(50, y, 550, y)
    y -= 20

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "3. HISTORICAL SUMMARY")
    y -= 20
    p.setFont("Helvetica", 10)
    p.drawString(50, y, "Circumstances of Death:")
    y -= 15
    
    text_obj = p.beginText(60, y)
    text_obj.setFont("Helvetica", 9)
    for line in get_text(case.circumstances_of_death, "No details.").split('\n'):
        text_obj.textLine(line[:90]) 
        y -= 12
    p.drawText(text_obj)
    
    y -= 20
    p.drawString(50, y, "Medical History:")
    y -= 15
    p.drawString(60, y, get_text(case.medical_history, "Unknown"))

    p.showPage()

    # ================= PAGE 2: EXTERNAL EXAMINATION =================
    draw_header("Page 2: External Exam")
    
    try: report = case.report
    except: report = None

    # FIX: Start at 700
    y = 700

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "4. GENERAL EXTERNAL EXAMINATION")
    y -= 20
    p.setFont("Helvetica", 10)
    
    if report:
        p.drawString(50, y, f"Height: {get_text(report.height_cm)} cm   Weight: {get_text(report.weight_kg)} kg")
        p.drawString(300, y, f"Hair: {get_text(report.hair_color)}")
        y -= 15
        p.drawString(50, y, f"Habitus: {get_text(report.body_habitus)}")
        p.drawString(300, y, f"Eyes: {get_text(report.eye_color)}")
        y -= 20
        
        p.drawString(50, y, f"Rigor: {get_text(report.rigor_mortis)}")
        y -= 15
        p.drawString(50, y, f"Livor: {get_text(report.livor_mortis)}")
        y -= 25
        
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, "Clothing/Effects:")
        y -= 15
        p.setFont("Helvetica", 9)
        p.drawString(60, y, get_text(report.clothing_description)[:100])
        y -= 20
    else:
        p.drawString(50, y, "Report data missing.")
        y -= 20

    p.line(50, y, 550, y)
    y -= 20

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "5. EVIDENCE OF INJURY")
    y -= 20
    
    p.setFont("Helvetica", 9)
    if case.external_injuries:
        for line in case.external_injuries.split('\n'):
            p.drawString(50, y, line[:90])
            y -= 12
            if y < 50: 
                p.showPage()
                draw_header("Injuries (Cont)")
                y = 700 # FIX: Reset to 700, not 750
    else:
        p.drawString(50, y, "No injuries recorded.")

    p.showPage()

    # ================= PAGE 3: VISUAL BODY MAP =================
    draw_header("Page 3: Body Map")
    
    # FIX: Start at 700
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 700, "6. VISUAL INJURY DIAGRAM")
    
    current_y = 660 # Start images lower

    if case.body_map_data and isinstance(case.body_map_data, list):
        markers = case.body_map_data
        used_views = set(m.get('view') for m in markers)
        
        possible_paths = [
            os.path.join(settings.BASE_DIR, 'assets'),
            os.path.join(settings.BASE_DIR, 'backend', 'assets')
        ]
        base_path = None
        for path in possible_paths:
            if os.path.exists(path):
                base_path = path
                break
        
        if not base_path:
            p.drawString(50, current_y, f"Error: Assets folder not found on server.")
            current_y -= 20
        else:
            for view in used_views:
                image_filename = f"{view.lower()}.png"
                image_path = os.path.join(base_path, image_filename)

                if os.path.exists(image_path):
                    try:
                        img = ImageReader(image_path)
                        orig_w, orig_h = img.getSize()
                        target_width = 300
                        aspect_ratio = orig_h / orig_w
                        target_height = target_width * aspect_ratio

                        if current_y - target_height < 50:
                            p.showPage()
                            draw_header("Page 3 (Cont): Body Map")
                            current_y = 700 # FIX: Reset to 700

                        p.setFont("Helvetica-Bold", 10)
                        p.drawString(50, current_y + 10, f"DIAGRAM: {view}")
                        draw_y = current_y - target_height
                        
                        p.drawImage(img, 100, draw_y, width=target_width, height=target_height, mask='auto')

                        for i, m in enumerate(markers):
                            if m.get('view') == view:
                                rel_x = (m['x'] / 100) * target_width
                                rel_y = ((100 - m['y']) / 100) * target_height
                                abs_x = 100 + rel_x
                                abs_y = draw_y + rel_y
                                
                                p.setFillColor(red)
                                p.circle(abs_x, abs_y, 5, stroke=0, fill=1)
                                p.setFillColor(white)
                                p.setFont("Helvetica-Bold", 7)
                                p.drawCentredString(abs_x, abs_y - 2.5, str(i + 1))

                        current_y = draw_y - 50 
                        p.setFillColor(black)
                    except Exception as e:
                        p.drawString(50, current_y, f"Error drawing {view}: {str(e)}")
                        current_y -= 20
                else:
                    p.drawString(50, current_y, f"Image file missing: {image_filename}")
                    current_y -= 20
    else:
        p.drawString(50, current_y, "No visual map data available.")

    p.showPage()

    # ================= PAGE 4: INTERNAL EXAMINATION =================
    draw_header("Page 4: Internal Exam")
    
    # FIX: Start at 700
    y = 700

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "7. INTERNAL EXAMINATION")
    y -= 20
    
    if report:
        p.setFont("Helvetica", 10)
        p.drawString(50, y, "Organ Weights (grams):")
        y -= 15
        
        row1_y = y
        p.drawString(50, row1_y, f"Brain: {get_text(report.brain_weight)}")
        p.drawString(200, row1_y, f"Heart: {get_text(report.heart_weight)}")
        p.drawString(350, row1_y, f"Liver: {get_text(report.liver_weight)}")
        y -= 15
        
        row2_y = y
        p.drawString(50, row2_y, f"R. Lung: {get_text(report.lung_right_weight)}")
        p.drawString(200, row2_y, f"L. Lung: {get_text(report.lung_left_weight)}")
        p.drawString(350, row2_y, f"Spleen: {get_text(report.spleen_weight)}")
        y -= 15
        
        row3_y = y
        p.drawString(50, row3_y, f"R. Kidney: {get_text(report.kidney_right_weight)}")
        p.drawString(200, row3_y, f"L. Kidney: {get_text(report.kidney_left_weight)}")
        y -= 20

        p.line(50, y, 550, y)
        y -= 20
        
        systems = [
            ("Technique", report.evisceration_technique),
            ("Cardiovascular", report.heart_findings),
            ("Respiratory", report.lung_findings),
            ("Digestive", report.stomach_contents),
            ("Hepatobiliary", report.liver_findings),
            ("Genitourinary", report.genitalia_findings),
            ("Neck", report.neck_findings),
        ]
        
        for title, content in systems:
            if y < 100:
                p.showPage()
                draw_header("Page 4 (Cont): Internal")
                y = 700 # FIX: Reset to 700
            
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, y, f"{title}:")
            p.setFont("Helvetica", 9)
            
            content_text = get_text(content, "Unremarkable.")
            if len(content_text) > 90:
                p.drawString(130, y, content_text[:90] + "...")
                p.drawString(130, y-12, content_text[90:180])
                y -= 25
            else:
                p.drawString(130, y, content_text)
                y -= 15
    else:
        p.drawString(50, y, "Internal Exam Data Not Yet Entered.")

    p.showPage()

    # ================= PAGE 5: SUMMARY & OPINION =================
    draw_header("Page 5: Summary")
    
    # FIX: Start at 700
    y = 700
    
    if report:
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "8. ANCILLARY STUDIES")
        y -= 20
        p.setFont("Helvetica", 10)
        p.drawString(50, y, f"Toxicology: {get_text(report.toxicology_results)}")
        y -= 15
        p.drawString(50, y, f"Histology: {get_text(report.histology_results)}")
        y -= 15
        p.drawString(50, y, f"Microbiology: {get_text(report.microbiology_results)}")
        y -= 20
        
        p.line(50, y, 550, y)
        y -= 20
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "9. CAUSE & MANNER OF DEATH")
        y -= 25
        
        p.setFont("Helvetica-Bold", 11)
        p.drawString(50, y, f"MANNER: {get_text(report.manner_of_death)}")
        y -= 20
        p.drawString(50, y, f"CAUSE: {get_text(report.cause_of_death)}")
        y -= 30
        
        p.setFont("Helvetica", 10)
        p.drawString(50, y, "FINAL SUMMARY / OPINION:")
        y -= 15
        
        text_obj = p.beginText(50, y)
        text_obj.setFont("Helvetica", 10)
        for line in get_text(report.final_summary).split('\n'):
            text_obj.textLine(line[:85])
            y -= 12
        p.drawText(text_obj)
    
    p.showPage()

    # ================= PAGE 6: EXTRAS =================
    draw_header("Page 6: Administrative Extras")
    
    # FIX: Start at 700
    y_cursor = 700

    # 1. Observers
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_cursor, "10. ATTENDANCE / OBSERVERS")
    y_cursor -= 20
    p.setFont("Helvetica", 10)
    
    observers = Observer.objects.filter(case=case)
    if observers.exists():
        for obs in observers:
            name = obs.user.username if obs.user else obs.name
            p.drawString(60, y_cursor, f"- {name} ({obs.role})")
            y_cursor -= 15
    else:
        p.drawString(60, y_cursor, "No observers recorded.")
        y_cursor -= 15
    y_cursor -= 10
    
    # 2. Consent (Only if Clinical)
    if case.case_type == 'NORMAL':
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y_cursor, "11. CONSENT (Clinical)")
        y_cursor -= 20
        p.setFont("Helvetica", 10)
        
        consent = Consent.objects.filter(case=case).first()
        if consent:
            signer = get_text(consent.signer_name)
            rel = get_text(consent.relationship)
            p.drawString(60, y_cursor, f"Signer: {signer} ({rel})")
            y_cursor -= 15
            
            status_text = "GRANTED" if consent.consent_given else "NOT GRANTED / PENDING"
            p.drawString(60, y_cursor, f"Status: {status_text}")
            y_cursor -= 15
            
            if consent.notes:
                p.drawString(60, y_cursor, f"Notes: {get_text(consent.notes)}")
                y_cursor -= 15
        else:
            p.drawString(60, y_cursor, "No consent record found.")
            y_cursor -= 15
    else:
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y_cursor, "11. CONSENT")
        y_cursor -= 20
        p.setFont("Helvetica", 10)
        p.drawString(60, y_cursor, "Forensic Case - Consent not required by law.")
        y_cursor -= 15

    y_cursor -= 20

    # 3. Chain of Custody
    if y_cursor < 200: 
        p.showPage()
        draw_header("Extras (Cont)")
        y_cursor = 700 # FIX: Reset to 700
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_cursor, "12. CHAIN OF CUSTODY LOG")
    y_cursor -= 20
    
    chain_events = ChainOfCustody.objects.filter(case=case).order_by('-timestamp')
    if chain_events.exists():
        p.setFont("Helvetica", 9)
        for ev in chain_events:
            if y_cursor < 50: 
                p.showPage()
                draw_header("Extras (Cont)")
                y_cursor = 700 # FIX: Reset to 700
            
            date_str = ev.timestamp.strftime('%Y-%m-%d %H:%M')
            line = f"[{date_str}] {ev.event_type}: {ev.notes}"
            p.drawString(60, y_cursor, line[:90])
            y_cursor -= 12
    else:
        p.setFont("Helvetica", 10)
        p.drawString(60, y_cursor, "No chain of custody events logged.")
        y_cursor -= 15

    y_cursor -= 20

    # 4. Evidence Photos Log
    if y_cursor < 200: 
        p.showPage()
        draw_header("Extras (Cont)")
        y_cursor = 700 # FIX: Reset to 700
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_cursor, "13. EVIDENCE PHOTO LOG")
    y_cursor -= 20
    
    photos = EvidencePhoto.objects.filter(case=case)
    if photos.exists():
        p.setFont("Helvetica", 9)
        for photo in photos:
            if y_cursor < 50: 
                p.showPage()
                draw_header("Extras (Cont)")
                y_cursor = 700 # FIX: Reset to 700
            
            exhibit_tag = "[EXHIBIT]" if photo.is_exhibit else ""
            line = f"- {exhibit_tag} {photo.caption} (File: {os.path.basename(photo.image.name)})"
            p.drawString(60, y_cursor, line[:90])
            y_cursor -= 12
    else:
        p.setFont("Helvetica", 10)
        p.drawString(60, y_cursor, "No photos recorded.")

    p.showPage()
    p.save()
    return response