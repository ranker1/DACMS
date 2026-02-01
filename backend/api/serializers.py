from rest_framework import serializers
from .models import CustomUser, AutopsyCase, Evidence, AutopsyReport, HistologyCassette
from .models import Consent, Observer, ChainOfCustody, EvidencePhoto


# 1. User Serializer (remove non-existent fields)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role']


# 2. Evidence Serializer (match frontend keys like `item_name`)
class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = ['id', 'case', 'item_name', 'location', 'description', 'collected_at', 'chain_of_custody']


# 3. Report Serializer
class ReportSerializer(serializers.ModelSerializer):
    case = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = AutopsyReport
        fields = '__all__'


# 4. Histology Cassette Serializer
class HistologyCassetteSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistologyCassette
        fields = ['id', 'report', 'cassette_id', 'tissue_type', 'description']


# AuditLog serializer (read-only)
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'model_name', 'object_pk', 'timestamp', 'changes']


# 5. Case Serializer (The Big One)
class AutopsyCaseSerializer(serializers.ModelSerializer):
    # We nest the evidence and report so we get everything in one API call
    evidence = EvidenceSerializer(many=True, read_only=True)
    report = ReportSerializer(read_only=True)
    consent = serializers.SerializerMethodField()
    observers = serializers.SerializerMethodField()

    class Meta:
        model = AutopsyCase
        fields = '__all__'

    def get_consent(self, obj):
        try:
            from .serializers import ConsentSerializer
            return ConsentSerializer(obj.consent).data
        except Exception:
            return None

    def get_observers(self, obj):
        try:
            from .serializers import ObserverSerializer
            return ObserverSerializer(obj.observers.all(), many=True).data
        except Exception:
            return []


# New serializers for the added models
class ConsentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consent
        fields = '__all__'


class ObserverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observer
        fields = '__all__'


class ChainOfCustodySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChainOfCustody
        fields = '__all__'


class EvidencePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvidencePhoto
        fields = '__all__'