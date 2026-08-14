import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { PaymentsService } from '../core/services/payments.service';
import { Subscription, SubscriptionPlan } from '../core/models/payment.model';

interface AssessmentOption {
  title: string;
  summary: string;
  duration: string;
  level: string;
  slug: string;
}

@Component({
  selector: 'app-candidate-assessments',
  standalone: true,
  imports: [CommonModule, TopNavComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white">
      <app-top-nav portalName="Assessments"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Mock Interviews & Skill Tests</h1>
          <p class="mt-2 text-gray-600">Strengthen your profile with interview practice and assessments unlocked by your plan.</p>
        </div>

        <div class="rounded-3xl border border-indigo-100 bg-white p-6 shadow-soft">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Your access</p>
              <h2 class="mt-2 text-xl font-semibold text-gray-900">{{ subscription()?.plan?.name || 'No active subscription' }}</h2>
              <p class="mt-1 text-sm text-gray-600">{{ subscription()?.plan?.description || 'Upgrade to unlock premium assessments.' }}</p>
            </div>
            <div class="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              {{ canAccessAssessments() ? 'Assessments unlocked for your plan' : 'Upgrade to unlock mock interviews and tests' }}
            </div>
          </div>
        </div>

        <div class="mt-8 grid gap-6 lg:grid-cols-3">
          <div *ngFor="let item of assessments" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-indigo-600">{{ item.level }}</p>
                <h3 class="mt-2 text-xl font-semibold text-gray-900">{{ item.title }}</h3>
              </div>
              <span
                [class]="canAccessAssessments() ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700' : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700'"
              >
                {{ canAccessAssessments() ? 'Available' : 'Locked' }}
              </span>
            </div>

            <p class="mt-4 text-sm text-gray-600">{{ item.summary }}</p>
            <div class="mt-4 text-sm text-gray-500">Duration: {{ item.duration }}</div>

            <ng-container *ngIf="canAccessAssessments(); else upgradeLink">
              <a [routerLink]="['/assessments', 'session', item.slug]" class="mt-6 block w-full rounded-2xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700">
                Start Practice
              </a>
            </ng-container>
            <ng-template #upgradeLink>
              <a routerLink="/billing" class="mt-6 block w-full rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
                Upgrade Plan
              </a>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CandidateAssessmentsComponent implements OnInit {
  private paymentsService = inject(PaymentsService);

  subscription = signal<Subscription | null>(null);
  assessments: AssessmentOption[] = [
    {
      title: 'Mock Interview Sprint',
      summary: 'Practice an AI-guided mock interview with recruiter-style questions and instant feedback.',
      duration: '15 min',
      level: 'Core',
      slug: 'mock-interview-sprint',
    },
    {
      title: 'Aptitude Challenge',
      summary: 'Measure your reasoning and technical aptitude with a timed challenge designed for hiring readiness.',
      duration: '20 min',
      level: 'Pro',
      slug: 'aptitude-challenge',
    },
    {
      title: 'Behavioral Readiness Test',
      summary: 'Prepare for real hiring scenarios with a structured behavioral assessment and scorecard.',
      duration: '10 min',
      level: 'Premium',
      slug: 'behavioral-readiness-test',
    },
  ];

  ngOnInit(): void {
    this.paymentsService.getMySubscription().subscribe({
      next: (sub) => this.subscription.set(sub),
      error: () => null,
    });
  }

  canAccessAssessments(): boolean {
    const plan = this.subscription()?.plan;
    if (!plan) return false;
    const features = [plan.tier_code, ...(plan.features_list || []), plan.name].join(' ').toLowerCase();
    return !/free|basic/.test(features);
  }
}
