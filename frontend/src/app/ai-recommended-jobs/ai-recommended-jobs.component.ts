import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { AIService } from '../core/services/ai.service';

import { JobsService } from '../core/services/jobs.service';

import { RecommendedJob } from '../core/models/ai.model';


@Component({
  selector: 'app-ai-recommended-jobs',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './ai-recommended-jobs.component.html',

  styleUrl: './ai-recommended-jobs.component.scss'
})

export class AiRecommendedJobsComponent implements OnInit {

  // ==========================================================
  // Services
  // ==========================================================

  private aiService = inject(AIService);
  private jobsService = inject(JobsService);
  private router = inject(Router);


  // ==========================================================
  // Component State
  // ==========================================================

  recommendations = signal<RecommendedJob[]>([]);

  loading = signal(true);

  error = signal<string | null>(null);

  totalCount = signal(0);

  savedJobs = signal<Set<string>>(new Set());

  // ==========================================================
  // Lifecycle
  // ==========================================================

  ngOnInit(): void {

    this.loadRecommendations();

  }

  goBackToDashboard(): void {
    this.router.navigate(['/candidate-dashboard']);
  }

  viewJob(job: RecommendedJob): void {
    this.router.navigate(['/jobs', job.job_slug]);
  }

  // ==========================================================
  // Load AI Recommended Jobs
  // ==========================================================

  loadRecommendations(): void {

    this.loading.set(true);

    this.error.set(null);

    this.aiService.getRecommendedJobs(10).subscribe({

      next: (response) => {

        this.recommendations.set(
          response.results || []
        );

        this.totalCount.set(
          response.count || 0
        );

        this.loading.set(false);

      },

      error: (err) => {

        console.error(
          'Failed to load AI recommendations:',
          err
        );

        this.recommendations.set([]);

        this.totalCount.set(0);

        this.error.set(
          err?.error?.detail ||
          'Unable to load AI job recommendations.'
        );

        this.loading.set(false);

      }

    });

  }


  // ==========================================================
  // Match Label
  // ==========================================================

  getMatchLabel(score: number): string {

    if (score >= 80) {

      return 'Excellent Match';

    }

    if (score >= 60) {

      return 'Strong Match';

    }

    if (score >= 40) {

      return 'Good Match';

    }

    return 'Potential Match';

  }


  // ==========================================================
  // Work Mode Formatting
  // ==========================================================

  formatWorkMode(mode: string): string {

    const map: Record<string, string> = {

      ONSITE: '🏢 On-site',

      REMOTE: '🌍 Remote',

      HYBRID: '🔄 Hybrid'

    };

    return map[mode] || mode;

  }


  // ==========================================================
  // Job Type Formatting
  // ==========================================================

  formatJobType(type: string): string {

    const map: Record<string, string> = {

      FULL_TIME: 'Full Time',

      PART_TIME: 'Part Time',

      CONTRACT: 'Contract',

      INTERNSHIP: 'Internship',

      FREELANCE: 'Freelance'

    };

    return map[type] || type;

  }


  // ==========================================================
  // Salary Formatting
  // ==========================================================

  formatSalary(
    min: number | null,
    max: number | null
  ): string {

    if (!min && !max) {

      return 'Salary not specified';

    }

    if (min && max) {

      return `₹${this.formatAmount(min)} - ₹${this.formatAmount(max)}`;

    }

    if (min) {

      return `From ₹${this.formatAmount(min)}`;

    }

    return `Up to ₹${this.formatAmount(max!)}`;

  }


  // ==========================================================
  // Amount Formatting
  // ==========================================================

  private formatAmount(amount: number): string {

    if (amount >= 10000000) {

      return `${(amount / 10000000).toFixed(1)}Cr`;

    }

    if (amount >= 100000) {

      return `${(amount / 100000).toFixed(1)}L`;

    }

    if (amount >= 1000) {

      return `${(amount / 1000).toFixed(0)}K`;

    }

    return amount.toString();

  }

  toggleSave(job: RecommendedJob): void {
        const currentlySaved = this.savedJobs().has(job.job_slug);

        if (currentlySaved) {
            this.jobsService.unsaveJob(job.job_slug).subscribe({
            next: () => {
                const updated = new Set(this.savedJobs());
                updated.delete(job.job_slug);
                this.savedJobs.set(updated);
            },

            error: (err) => {
                console.error('Failed to unsave job:', err);
            }
            });

        } else {
            this.jobsService.saveJob(job.job_slug).subscribe({
            next: () => {
                const updated = new Set(this.savedJobs());
                updated.add(job.job_slug);
                this.savedJobs.set(updated);
            },

            error: (err) => {
                console.error('Failed to save job:', err);
            }
            });
        }
    }

}