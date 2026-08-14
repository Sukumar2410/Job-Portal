"""
Seeds the database with realistic test data.
Usage: python manage.py seed_data
"""
import random
from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.users.models import User, UserRole, CandidateProfile, HRProfile
from apps.companies.models import Company, CompanySize, SubscriptionTier
from apps.jobs.models import Job, JobType, WorkMode, ExperienceLevel, JobStatus
from apps.applications.models import Application, ApplicationStatus, ApplicationStatusHistory
from apps.payments.models import SubscriptionPlan, PlanType, BillingCycle


COMPANIES_DATA = [
    ('TechCorp Solutions', 'Technology', 'MEDIUM', 'Bangalore, India'),
    ('DataFlow Analytics', 'Data & Analytics', 'SMALL', 'Hyderabad, India'),
    ('CloudNine Systems', 'Cloud Computing', 'LARGE', 'Pune, India'),
    ('FinEdge Fintech', 'Financial Services', 'MEDIUM', 'Mumbai, India'),
    ('HealthPlus Digital', 'Healthcare', 'SMALL', 'Chennai, India'),
    ('EduSphere Learning', 'EdTech', 'STARTUP', 'Delhi, India'),
    ('GreenGrid Energy', 'Renewable Energy', 'ENTERPRISE', 'Bangalore, India'),
    ('RetailHub Commerce', 'E-Commerce', 'LARGE', 'Gurgaon, India'),
]

JOB_TEMPLATES = [
    {
        'title': 'Senior Django Developer',
        'description': 'Build and maintain scalable REST APIs using Django & DRF.',
        'skills': 'Python, Django, DRF, PostgreSQL, Docker, AWS, REST APIs',
        'experience': 'SENIOR', 'min_sal': 1800000, 'max_sal': 2800000,
    },
    {
        'title': 'Frontend Angular Developer',
        'description': 'Design responsive SPAs with Angular and TypeScript.',
        'skills': 'Angular, TypeScript, RxJS, HTML, CSS, JavaScript, Tailwind',
        'experience': 'MID', 'min_sal': 900000, 'max_sal': 1500000,
    },
    {
        'title': 'Full Stack Engineer',
        'description': 'End-to-end product development on Django + Angular stack.',
        'skills': 'Python, Django, Angular, TypeScript, DRF, SQLite, Git',
        'experience': 'MID', 'min_sal': 1200000, 'max_sal': 1800000,
    },
    {
        'title': 'Data Scientist',
        'description': 'Build ML models for predictive analytics.',
        'skills': 'Python, Pandas, NumPy, Scikit-learn, TensorFlow, SQL, Statistics',
        'experience': 'SENIOR', 'min_sal': 2000000, 'max_sal': 3200000,
    },
    {
        'title': 'DevOps Engineer',
        'description': 'Manage CI/CD, container orchestration, and cloud infra.',
        'skills': 'Docker, Kubernetes, AWS, Jenkins, Terraform, Linux, Python',
        'experience': 'MID', 'min_sal': 1500000, 'max_sal': 2400000,
    },
    {
        'title': 'Junior Python Developer',
        'description': 'Great opportunity for freshers to work on Python projects.',
        'skills': 'Python, Django, HTML, CSS, Git, SQL',
        'experience': 'ENTRY', 'min_sal': 400000, 'max_sal': 700000,
    },
    {
        'title': 'UI/UX Designer',
        'description': 'Design intuitive user interfaces for web and mobile.',
        'skills': 'Figma, Adobe XD, Photoshop, Prototyping, User Research',
        'experience': 'MID', 'min_sal': 800000, 'max_sal': 1400000,
    },
    {
        'title': 'QA Automation Engineer',
        'description': 'Automate testing pipelines and ensure product quality.',
        'skills': 'Selenium, Python, Pytest, Jenkins, API Testing, Postman',
        'experience': 'MID', 'min_sal': 900000, 'max_sal': 1500000,
    },
]

CANDIDATE_SKILL_POOLS = [
    'Python, Django, DRF, PostgreSQL, Docker, REST APIs, Git',
    'Angular, TypeScript, RxJS, HTML, CSS, JavaScript',
    'Python, Django, Angular, TypeScript, SQLite, Git',
    'Java, Spring Boot, Hibernate, MySQL, Docker',
    'Python, Pandas, NumPy, Scikit-learn, SQL',
    'Node.js, Express, MongoDB, React, JavaScript',
    'Docker, Kubernetes, AWS, Jenkins, Linux',
    'HTML, CSS, JavaScript, React, Git',
    'Python, Flask, SQLAlchemy, PostgreSQL, REST APIs',
    'Angular, Node.js, MongoDB, Express, TypeScript',
]

LOCATIONS = ['Bangalore, India', 'Hyderabad, India', 'Pune, India', 'Mumbai, India',
             'Chennai, India', 'Delhi, India', 'Gurgaon, India', 'Remote']

FIRST_NAMES = ['Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Karan',
               'Divya', 'Rahul', 'Meera', 'Arjun', 'Kavya', 'Sanjay', 'Nisha', 'Amit']
LAST_NAMES = ['Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Gupta', 'Reddy',
              'Iyer', 'Nair', 'Menon', 'Rao', 'Joshi', 'Malhotra', 'Kapoor']


class Command(BaseCommand):
    help = 'Seeds the database with realistic test data'

    def add_arguments(self, parser):
        parser.add_argument('--flush', action='store_true',
                            help='Delete existing seed data (keeps super admins)')

    @transaction.atomic
    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write(self.style.WARNING('Flushing seed data...'))
            Application.objects.all().delete()
            Job.objects.all().delete()
            Company.objects.all().delete()
            User.objects.exclude(role=UserRole.SUPER_ADMIN).delete()
            self.stdout.write(self.style.SUCCESS('✓ Existing data cleared'))

        self.stdout.write('🌱 Seeding subscription plans...')
        self.create_subscription_plans()

        self.stdout.write('🌱 Seeding companies & HR users...')
        companies = self.create_companies_and_hr()

        self.stdout.write('🌱 Seeding jobs...')
        jobs = self.create_jobs(companies)

        self.stdout.write('🌱 Seeding candidates...')
        candidates = self.create_candidates(count=20)

        self.stdout.write('🌱 Seeding applications...')
        self.create_applications(candidates, jobs)

        self.stdout.write(self.style.SUCCESS('\n✅ Seed complete!\n'))
        self.print_summary()

    def create_subscription_plans(self):
        plans = [
            {
                'name': 'Free', 'plan_type': PlanType.COMPANY, 'tier_code': 'FREE',
                'price': 0, 'billing_cycle': BillingCycle.MONTHLY,
                'job_post_quota': 3, 'featured_job_quota': 0,
                'features_list': ['3 active job posts', 'Basic analytics', 'Email support'],
                'sort_order': 1,
            },
            {
                'name': 'Premium', 'plan_type': PlanType.COMPANY, 'tier_code': 'PREMIUM',
                'price': 9999, 'billing_cycle': BillingCycle.MONTHLY,
                'job_post_quota': 20, 'featured_job_quota': 5,
                'priority_listing': True, 'advanced_analytics': True, 'direct_messaging': True,
                'features_list': ['20 active jobs', 'Priority listing', 'Advanced analytics',
                                  'Direct messaging', 'AI top candidates'],
                'sort_order': 2,
            },
            {
                'name': 'Enterprise', 'plan_type': PlanType.COMPANY, 'tier_code': 'ENTERPRISE',
                'price': 49999, 'billing_cycle': BillingCycle.MONTHLY,
                'job_post_quota': 100, 'featured_job_quota': 25,
                'priority_listing': True, 'advanced_analytics': True, 'direct_messaging': True,
                'features_list': ['100 active jobs', 'Dedicated support', 'Custom SLA',
                                  'SSO integration', 'All Premium features'],
                'sort_order': 3,
            },
            {
                'name': 'Candidate Premium', 'plan_type': PlanType.CANDIDATE,
                'tier_code': 'CANDIDATE_PREMIUM', 'price': 499,
                'billing_cycle': BillingCycle.MONTHLY,
                'resume_boost': True, 'direct_messaging': True,
                'features_list': ['Resume boost', 'Priority applications', 'Recruiter messaging'],
                'sort_order': 1,
            },
        ]
        for p in plans:
            SubscriptionPlan.objects.update_or_create(
                tier_code=p['tier_code'], defaults=p
            )
        self.stdout.write(f'  ✓ {len(plans)} plans created')

    def create_companies_and_hr(self):
        companies = []
        for i, (name, industry, size, hq) in enumerate(COMPANIES_DATA):
            company, _ = Company.objects.get_or_create(
                name=name,
                defaults={
                    'description': f'{name} is a leading {industry.lower()} company.',
                    'industry': industry,
                    'company_size': size,
                    'headquarters': hq,
                    'founded_year': random.randint(2005, 2020),
                    'website': f'https://{name.lower().replace(" ", "")}.example.com',
                    'contact_email': f'hr@{name.lower().replace(" ", "")}.example.com',
                    'is_verified': random.choice([True, True, False]),
                    'is_active': True,
                }
            )

            # Create HR user for this company
            hr_email = f'hr{i+1}@{name.lower().replace(" ", "")}.example.com'
            hr_user, created = User.objects.get_or_create(
                email=hr_email,
                defaults={
                    'first_name': random.choice(FIRST_NAMES),
                    'last_name': random.choice(LAST_NAMES),
                    'role': UserRole.HR,
                    'is_verified': True,
                    'phone': f'98{random.randint(10000000, 99999999)}',
                }
            )
            if created:
                hr_user.set_password('TestPass@123')
                hr_user.save()

            HRProfile.objects.update_or_create(
                user=hr_user,
                defaults={
                    'company': company,
                    'designation': 'HR Manager',
                    'department': 'Human Resources',
                }
            )
            companies.append(company)
        self.stdout.write(f'  ✓ {len(companies)} companies + HR users created')
        return companies

    def create_jobs(self, companies):
        jobs = []
        for company in companies:
            num_jobs = random.randint(2, 5)
            selected_templates = random.sample(JOB_TEMPLATES, min(num_jobs, len(JOB_TEMPLATES)))
            for template in selected_templates:
                job = Job.objects.create(
                    company=company,
                    posted_by=company.hr_users.first().user if company.hr_users.exists() else None,
                    title=template['title'],
                    description=template['description'],
                    responsibilities='• Design and implement features\n• Collaborate with team\n• Write clean code',
                    requirements=f'• {template["experience"]} level experience\n• Strong problem-solving skills',
                    benefits='• Health insurance\n• Flexible work hours\n• Learning budget',
                    job_type=random.choice([JobType.FULL_TIME, JobType.FULL_TIME, JobType.CONTRACT]),
                    work_mode=random.choice([WorkMode.ONSITE, WorkMode.HYBRID, WorkMode.REMOTE]),
                    experience_level=template['experience'],
                    location=company.headquarters,
                    min_salary=Decimal(template['min_sal']),
                    max_salary=Decimal(template['max_sal']),
                    currency='INR',
                    skills_required=template['skills'],
                    status=JobStatus.ACTIVE,
                    posted_at=timezone.now() - timedelta(days=random.randint(1, 30)),
                    application_deadline=(timezone.now() + timedelta(days=random.randint(15, 60))).date(),
                )
                jobs.append(job)
        self.stdout.write(f'  ✓ {len(jobs)} jobs created')
        return jobs

    def create_candidates(self, count=20):
        candidates = []
        for i in range(count):
            email = f'candidate{i+1}@example.com'
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': random.choice(FIRST_NAMES),
                    'last_name': random.choice(LAST_NAMES),
                    'role': UserRole.CANDIDATE,
                    'is_verified': True,
                    'phone': f'98{random.randint(10000000, 99999999)}',
                }
            )
            if created:
                user.set_password('TestPass@123')
                user.save()

            skills = random.choice(CANDIDATE_SKILL_POOLS)
            exp_years = random.randint(0, 12)
            CandidateProfile.objects.update_or_create(
                user=user,
                defaults={
                    'headline': f'{random.choice(["Software Engineer", "Full Stack Developer", "Backend Developer", "Frontend Developer", "Data Analyst"])} with {exp_years}+ years',
                    'summary': 'Passionate developer with a strong foundation in modern technologies.',
                    'skills': skills,
                    'experience_years': exp_years,
                    'current_location': random.choice(LOCATIONS),
                    'expected_salary': Decimal(random.randint(500000, 2500000)),
                    'linkedin_url': f'https://linkedin.com/in/{user.first_name.lower()}{i}',
                    'github_url': f'https://github.com/{user.first_name.lower()}{i}',
                }
            )
            candidates.append(user)
        self.stdout.write(f'  ✓ {len(candidates)} candidates created')
        return candidates

    def create_applications(self, candidates, jobs):
        statuses_weights = [
            (ApplicationStatus.APPLIED, 40),
            (ApplicationStatus.UNDER_REVIEW, 20),
            (ApplicationStatus.SHORTLISTED, 15),
            (ApplicationStatus.INTERVIEW_SCHEDULED, 10),
            (ApplicationStatus.INTERVIEWED, 5),
            (ApplicationStatus.OFFERED, 3),
            (ApplicationStatus.HIRED, 2),
            (ApplicationStatus.REJECTED, 5),
        ]
        status_choices = []
        for s, w in statuses_weights:
            status_choices.extend([s] * w)

        count = 0
        for candidate in candidates:
            num_apps = random.randint(2, 6)
            applied_jobs = random.sample(jobs, min(num_apps, len(jobs)))
            for job in applied_jobs:
                if Application.objects.filter(candidate=candidate, job=job).exists():
                    continue
                app_status = random.choice(status_choices)
                app = Application.objects.create(
                    job=job,
                    candidate=candidate,
                    cover_letter=f'I am very interested in the {job.title} role at {job.company.name}.',
                    expected_salary=candidate.candidate_profile.expected_salary,
                    notice_period_days=random.choice([15, 30, 60, 90]),
                    status=app_status,
                    rating=random.randint(3, 5) if app_status in [
                        ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEWED,
                        ApplicationStatus.OFFERED, ApplicationStatus.HIRED
                    ] else None,
                )
                # Increment job applications_count
                job.applications_count += 1
                job.save()

                # Create status history
                ApplicationStatusHistory.objects.create(
                    application=app,
                    from_status='',
                    to_status=ApplicationStatus.APPLIED,
                    changed_by=candidate,
                    note='Application submitted',
                )
                if app_status != ApplicationStatus.APPLIED:
                    ApplicationStatusHistory.objects.create(
                        application=app,
                        from_status=ApplicationStatus.APPLIED,
                        to_status=app_status,
                        changed_by=job.posted_by,
                        note=f'Moved to {app_status}',
                    )
                count += 1
        self.stdout.write(f'  ✓ {count} applications created')

    def print_summary(self):
        self.stdout.write('=' * 60)
        self.stdout.write(self.style.SUCCESS('📊 Database Summary'))
        self.stdout.write('=' * 60)
        self.stdout.write(f'  Users:         {User.objects.count()}')
        self.stdout.write(f'    - Candidates: {User.objects.filter(role=UserRole.CANDIDATE).count()}')
        self.stdout.write(f'    - HR:         {User.objects.filter(role=UserRole.HR).count()}')
        self.stdout.write(f'    - SuperAdmin: {User.objects.filter(role=UserRole.SUPER_ADMIN).count()}')
        self.stdout.write(f'  Companies:     {Company.objects.count()}')
        self.stdout.write(f'  Jobs:          {Job.objects.count()}')
        self.stdout.write(f'  Applications:  {Application.objects.count()}')
        self.stdout.write(f'  Plans:         {SubscriptionPlan.objects.count()}')
        self.stdout.write('=' * 60)
        self.stdout.write('\n🔑 Test Credentials (all use password: TestPass@123)')
        self.stdout.write('  HR:        hr1@techcorpsolutions.example.com')
        self.stdout.write('  Candidate: candidate1@example.com')
        self.stdout.write('  SuperAdmin: use your existing createsuperuser account')
        self.stdout.write('=' * 60)