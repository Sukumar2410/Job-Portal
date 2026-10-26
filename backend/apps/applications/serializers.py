from httpcore import request
from rest_framework import serializers
from apps.jobs.serializers import JobListSerializer
from apps.users.serializers import UserSerializer, CandidateProfileSerializer
from .models import Application, ApplicationStatusHistory, Interview, ApplicationStatus
from datetime import datetime
from .models import InterviewMode
from apps.users.models import Resume

class InterviewSerializer(serializers.ModelSerializer):
    scheduled_by_email = serializers.CharField(source='scheduled_by.email', read_only=True)

    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ('scheduled_by', 'created_at', 'updated_at')


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(source='changed_by.email', read_only=True)
    to_status_display = serializers.CharField(source='get_to_status_display', read_only=True)

    class Meta:
        model = ApplicationStatusHistory
        fields = ('id', 'from_status', 'to_status', 'to_status_display',
                  'changed_by_email', 'note', 'changed_at')


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """For candidates applying to jobs"""

    resume_snapshot = serializers.FileField(
        required=False,
        allow_null=True,
        help_text="Optional. If omitted, resume from your profile will be used."
    )

    class Meta:
        model = Application
        fields = (
            "job",
            "cover_letter",
            "resume_snapshot",
            "expected_salary",
            "notice_period_days",
        )
        extra_kwargs = {
            "cover_letter": {"required": False, "allow_blank": True},
            "expected_salary": {"required": False, "allow_null": True},
            "notice_period_days": {"required": False, "allow_null": True},
        }

    def validate_expected_salary(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Expected salary cannot be negative."
            )
        return value

    def validate_notice_period_days(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Notice period cannot be negative."
            )
        return value

    def validate_job(self, job):
        from apps.jobs.models import JobStatus
        from django.utils import timezone

        if job.status != JobStatus.ACTIVE:
            raise serializers.ValidationError(
                "This job is not currently accepting applications."
            )

        if job.application_deadline and job.application_deadline < timezone.now().date():
            raise serializers.ValidationError(
                "Application deadline has passed."
            )

        if job.max_applications and job.applications_count >= job.max_applications:
            raise serializers.ValidationError(
                "This job has reached maximum applications."
            )

        return job

    def validate(self, attrs):
        user = self.context["request"].user
        job = attrs["job"]
        request = self.context["request"]
        candidate = request.user
    
        # Prevent duplicate application
        if Application.objects.filter(job=job, candidate=user).exists():
            raise serializers.ValidationError({
                "detail": "You have already applied to this job."
            })

        # Resume is mandatory
        profile = getattr(candidate, "candidate_profile", None)
        uploaded_resume = attrs.get("resume_snapshot")

        # Check both legacy resume and new Resume model
        has_legacy_resume = bool(profile and profile.resume)

        has_new_resume = Resume.objects.filter(
            candidate=candidate
        ).exists()

        if not (uploaded_resume or has_legacy_resume or has_new_resume):
            raise serializers.ValidationError({
                "resume": "Please upload your resume before applying for a job."
            })

        return attrs

    def create(self, validated_data):
        from django.conf import settings
        from django.core.mail import EmailMultiAlternatives
        from django.utils import timezone
        from django.utils.html import strip_tags

        # Candidate comes from serializer.save(candidate=request.user)
        candidate = validated_data.pop("candidate")

        job = validated_data["job"]

        resume = validated_data.get("resume_snapshot")
        if not resume:
            profile = getattr(candidate, "candidate_profile", None)
            if profile and profile.resume:
                validated_data["resume_snapshot"] = profile.resume

        application = Application.objects.create(
            candidate=candidate,
            **validated_data
        )

        # Increase application count
        job.applications_count += 1
        job.save(update_fields=["applications_count"])

        # -----------------------------
        # BEAUTIFUL HR NOTIFICATION
        # -----------------------------
        # Get the HR user from the company
        hr_profile = job.company.hr_users.first()
        hr_email = hr_profile.user.email if hr_profile and hr_profile.user else None

        if hr_email:
            subject = f"📥 New Application for {job.title}"

            html_message = f"""
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:30px 0;">
                <tr>
                  <td align="center">

                    <table width="650" cellpadding="0" cellspacing="0"
                      style="background:#ffffff;border-radius:14px;overflow:hidden;">

                      <tr>
                        <td align="center"
                          style="background:#0f766e;padding:32px;color:white;">
                          <h1 style="margin:0;font-size:30px;">Enterprise Job Portal</h1>
                          <p style="margin-top:10px;font-size:15px;">
                            New Candidate Application Received
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:32px;">

                          <h2 style="margin:0 0 18px;color:#111827;">
                            Hello {hr_profile.user.full_name if hr_profile and hr_profile.user else "HR Team"} 👋
                          </h2>

                          <p style="color:#4b5563;font-size:15px;line-height:24px;">
                            A new candidate has applied for one of your job openings.
                            Review the application from your HR dashboard.
                          </p>

                          <table width="100%" cellpadding="12"
                            style="margin:28px 0;background:#ecfeff;border-left:5px solid #14b8a6;border-radius:8px;">

                            <tr>
                              <td width="45%"><strong>👤 Candidate</strong></td>
                              <td>{candidate.full_name}</td>
                            </tr>

                            <tr>
                              <td><strong>📧 Email</strong></td>
                              <td>{candidate.email}</td>
                            </tr>

                            <tr>
                              <td><strong>💼 Job Title</strong></td>
                              <td>{job.title}</td>
                            </tr>

                            <tr>
                              <td><strong>🏢 Company</strong></td>
                              <td>{job.company.name}</td>
                            </tr>

                            <tr>
                              <td><strong>📅 Applied On</strong></td>
                              <td>{timezone.localtime(application.applied_at).strftime("%d %B %Y • %I:%M %p")}</td>
                            </tr>
                          </table>

                          <div style="text-align:center;margin:34px 0;">
                            <a href="http://localhost:4200/hr/applications"
                              style="background:#0f766e;color:#ffffff;text-decoration:none;
                                     padding:14px 28px;border-radius:8px;font-weight:bold;
                                     display:inline-block;">
                              View Applications
                            </a>
                          </div>

                          <hr style="border:none;border-top:1px solid #e5e7eb;">

                          <p style="font-size:13px;color:#6b7280;line-height:22px;">
                            This is an automated notification from Enterprise Job Portal.
                            Please do not reply to this email.
                          </p>

                        </td>
                      </tr>

                      <tr>
                        <td align="center"
                          style="background:#f9fafb;padding:18px;color:#6b7280;font-size:12px;">
                          © 2026 Enterprise Job Portal • Recruitment Platform
                        </td>
                      </tr>

                    </table>

                  </td>
                </tr>
              </table>
            </body>
            </html>
            """

            text_message = strip_tags(html_message)

            try:
                email = EmailMultiAlternatives(
                    subject=subject,
                    body=text_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[hr_email],
                )
                email.attach_alternative(html_message, "text/html")
                email.send(fail_silently=True)
            except Exception:
                pass

        return application

class CandidateProfileMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="candidate.id")
    full_name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return obj.candidate.full_name

    def get_profile_picture(self, obj):
        request = self.context.get("request")

        user = obj.candidate

        if not user.profile_picture:
            return None

        if request:
            return request.build_absolute_uri(user.profile_picture.url)

        return user.profile_picture.url
    
class ApplicationListSerializer(serializers.ModelSerializer):
    """For lists - lightweight"""
    job = JobListSerializer(read_only=True)
    candidate_email = serializers.CharField(source='candidate.email', read_only=True)
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    rating = serializers.IntegerField(read_only=True)
    candidate_profile = CandidateProfileMiniSerializer(source="*", read_only=True)

    class Meta:
        model = Application
        fields = ('id', 'job', 'candidate_email', 'candidate_name', 'status', "candidate_profile",
                  'status_display', 'rating', 'applied_at', 'updated_at')


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """Full details for HR/Candidate views"""
    job = JobListSerializer(read_only=True)
    candidate = UserSerializer(read_only=True)
    candidate_profile = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    interviews = InterviewSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = ('id', 'job', 'candidate', 'candidate_profile',
                  'cover_letter', 'resume_snapshot',
                  'expected_salary', 'notice_period_days',
                  'status', 'status_display', 'hr_notes', 'rating',
                  'rejection_reason', 'applied_at', 'updated_at',
                  'status_history', 'interviews')
        read_only_fields = ('applied_at', 'updated_at')

    def get_candidate_profile(self, obj):
        profile = obj.candidate.candidate_profile

        # Profile picture is stored on User, not CandidateProfile
        if obj.candidate.profile_picture:
            profile_picture = self.context["request"].build_absolute_uri(
                obj.candidate.profile_picture.url
            )
        else:
            profile_picture = None

        return {
            "headline": profile.headline,
            "summary": profile.summary,
            "experience_years": profile.experience_years,
            "current_location": profile.current_location,
            "skills": ( [s.strip() for s in profile.skills.split(",")]
                if profile.skills else [] ),
            "profile_picture": profile_picture,
        }
    
    def to_representation(self, instance):
        """Hide HR-only fields from candidates"""
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from apps.users.models import UserRole
            if request.user.role == UserRole.CANDIDATE:
                data.pop('hr_notes', None)
                data.pop('rating', None)
        return data


class ApplicationStatusUpdateSerializer(serializers.Serializer):
    """For HR to update application status"""
    status = serializers.ChoiceField(choices=ApplicationStatus.choices)
    note = serializers.CharField(required=False, allow_blank=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)


class InterviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = ('application', 'round_name', 'mode', 'scheduled_at',
                  'duration_minutes', 'meeting_link', 'location',
                  'interviewer_name', 'interviewer_email', 'instructions')

class InterviewScheduleSerializer(serializers.Serializer):
    interview_date = serializers.DateField(required=False)
    interview_time = serializers.TimeField(required=False)

    interview_type = serializers.ChoiceField(
        choices=InterviewMode.choices,
        required=False,
        default=InterviewMode.ONLINE
    )

    meeting_link = serializers.URLField(
        required=False,
        allow_blank=True
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate(self, attrs):
        date = attrs.get("interview_date")
        time = attrs.get("interview_time")

        if date and time:
            scheduled = datetime.combine(date, time)

            if scheduled < datetime.now():
                raise serializers.ValidationError(
                    "Interview cannot be scheduled in the past."
                )

        return attrs