import { Routes } from '@angular/router';
import { AiRecommendedJobsComponent } from './ai-recommended-jobs/ai-recommended-jobs.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { CandidateDashboardComponent } from './candidate-dashboard/candidate-dashboard.component';
import { HrDashboardComponent } from './hr-dashboard/hr-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { JobsListComponent } from './jobs/jobs-list/jobs-list.component';
import { JobDetailsComponent } from './jobs/job-details/job-details.component';
import { MyApplicationsComponent } from './my-applications/my-applications.component';
import { SavedJobsComponent } from './saved-jobs/saved-jobs.component';
import { ProfileComponent } from './profile/profile.component';
import { HrCompanyComponent } from './hr/hr-company/hr-company.component';
import { authGuard } from './guards/auth.guard';
import { HrJobsComponent } from './hr/hr-jobs/hr-jobs.component';
import { HrJobFormComponent } from './hr/hr-job-form/hr-job-form.component';
import { HrApplicantsComponent } from './hr/hr-applicants/hr-applicants.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { HrAnalyticsComponent } from './hr/hr-analytics/hr-analytics.component';
import { CandidateAnalyticsComponent } from './candidate-analytics/candidate-analytics.component';
import { AdminAnalyticsComponent } from './admin/admin-analytics/admin-analytics.component';
import { AdminUsersComponent } from './admin/admin-users/admin-users.component';
import { AdminCompaniesComponent } from './admin/admin-companies/admin-companies.component';
import { AdminBroadcastComponent } from './admin/admin-broadcast/admin-broadcast.component';
import { AdminAuditLogsComponent } from './admin/admin-audit-logs/admin-audit-logs.component';
import { BillingComponent } from './billing/billing.component';
import { PaymentsComponent } from './payments/payments.component';
import { RevenueComponent } from './revenue/revenue.component';
import { CandidateAssessmentsComponent } from './candidate-assessments/candidate-assessments.component';
import { AssessmentSessionComponent } from './candidate-assessments/assessment-session.component';
import { AIChatbotComponent } from './candidate-assessments/ai-chatbot.component';
import { AiCareerCenterComponent } from './features/ai-career-center/ai-career-center.component';
import { SocialFeedComponent } from './social-feed/social-feed.component';
import { HrAiRecommendedCandidatesComponent } from './hr-ai-recommended-candidates/hr-ai-recommended-candidates.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'candidate-dashboard', component: CandidateDashboardComponent, canActivate: [authGuard] },
  { path: 'hr-dashboard', component: HrDashboardComponent, canActivate: [authGuard] },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'jobs', component: JobsListComponent, canActivate: [authGuard] },
  { path: 'jobs/:slug', component: JobDetailsComponent, canActivate: [authGuard] },
  { path: 'my-applications', component: MyApplicationsComponent, canActivate: [authGuard] },
  { path: 'my-applications/:id', component: MyApplicationsComponent, canActivate: [authGuard] },
  { path: 'saved-jobs', component: SavedJobsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'billing', component: BillingComponent, canActivate: [authGuard] },
  { path: 'payments', component: PaymentsComponent, canActivate: [authGuard] },
  { path: 'revenue', component: RevenueComponent, canActivate: [authGuard] },
  { path: 'assessments', component: CandidateAssessmentsComponent, canActivate: [authGuard] },
  { path: 'assessments/session/:slug', component: AIChatbotComponent, canActivate: [authGuard] },
  { path: 'hr/company', component: HrCompanyComponent, canActivate: [authGuard] },
  { path: 'hr/jobs', component: HrJobsComponent, canActivate: [authGuard] },
  { path: 'hr/jobs/new', component: HrJobFormComponent, canActivate: [authGuard] },
  { path: 'hr/jobs/edit/:slug', component: HrJobFormComponent, canActivate: [authGuard] },
  { path: 'hr/applicants', component: HrApplicantsComponent, canActivate: [authGuard] },
  { path: 'hr-ai-assistant', component: AiCareerCenterComponent, canActivate: [authGuard] },
  { path: 'hr-ai-recommended-candidates', component: HrAiRecommendedCandidatesComponent, canActivate: [authGuard] },
  { path: 'admin-ai-assistant', component: AiCareerCenterComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'hr/analytics', component: HrAnalyticsComponent, canActivate: [authGuard] },
  { path: 'candidate/analytics', component: CandidateAnalyticsComponent, canActivate: [authGuard] },
  { path: 'admin/analytics', component: AdminAnalyticsComponent, canActivate: [authGuard] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [authGuard] },
  { path: 'admin/companies', component: AdminCompaniesComponent, canActivate: [authGuard] },
  { path: 'admin/broadcast', component: AdminBroadcastComponent, canActivate: [authGuard] },
  { path: 'admin/audit-logs', component: AdminAuditLogsComponent, canActivate: [authGuard] },
  { path: 'ai-career-center', component: AiCareerCenterComponent, canActivate: [authGuard] },
  { path: 'ai-recommended-jobs', component: AiRecommendedJobsComponent, canActivate: [authGuard]},
  { path: 'social', component: SocialFeedComponent, canActivate: [authGuard] },
  { path: 'messages', loadComponent: () => import('./messaging/messaging.component') .then(m => m.MessagingComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];