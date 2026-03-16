from rest_framework import serializers
from .models import CustomUser, AutopsyCase, Evidence, AutopsyReport, HistologyCassette, Organization
from .models import Consent, Observer, ChainOfCustody, EvidencePhoto


class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_type = serializers.CharField(source='organization.org_type', read_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name', 
                  'role', 'organization', 'organization_name', 'organization_type', 
                  'employee_id', 'phone', 'department', 'is_active']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
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


# Organization Serializer
class OrganizationSerializer(serializers.ModelSerializer):
    parent_org_name = serializers.CharField(source='parent_org.name', read_only=True)
    child_orgs_count = serializers.SerializerMethodField()
    case_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = '__all__'

    def get_child_orgs_count(self, obj):
        return obj.child_orgs.count()
    
    def get_case_count(self, obj):
        return obj.cases.count()