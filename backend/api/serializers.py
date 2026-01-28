from rest_framework import serializers
from .models import CustomUser, AutopsyCase, Evidence, AutopsyReport

# 1. User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'badge_number']

# 2. Evidence Serializer
class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = '__all__'

# 3. Report Serializer
class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutopsyReport
        fields = '__all__'

# 4. Case Serializer (The Big One)
class AutopsyCaseSerializer(serializers.ModelSerializer):
    # We nest the evidence and report so we get everything in one API call
    evidence = EvidenceSerializer(many=True, read_only=True)
    report = ReportSerializer(read_only=True)
    assigned_pathologist_name = serializers.CharField(source='assigned_pathologist.username', read_only=True)

    class Meta:
        model = AutopsyCase
        fields = '__all__'