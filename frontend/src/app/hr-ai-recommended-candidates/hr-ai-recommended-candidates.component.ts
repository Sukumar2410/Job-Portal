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

import {
  RecommendedCandidate,
  TopCandidatesResponse
} from '../core/models/ai.model';

import { Job } from '../core/models/job.model';


@Component({
  selector: 'app-hr-ai-recommended-candidates',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './hr-ai-recommended-candidates.component.html',

  styleUrl: './hr-ai-recommended-candidates.component.scss'
})
export class HrAiRecommendedCandidatesComponent
  implements OnInit {

  // ==========================================================
  // Services
  // ==========================================================

  private aiService = inject(AIService);

  private jobsService = inject(JobsService);

  private router = inject(Router);


  // ==========================================================
  // State
  // ==========================================================

  jobs = signal<Job[]>([]);

  selectedJobId = signal<number | null>(null);

  candidates = signal<RecommendedCandidate[]>([]);

  selectedJobTitle = signal<string>('');

  loadingJobs = signal(true);

  loadingCandidates = signal(false);

  error = signal<string | null>(null);

  totalCount = signal(0);


  // ==========================================================
  // Lifecycle
  // ==========================================================

  ngOnInit(): void {

    this.loadJobs();

  }


  // ==========================================================
  // Load HR Jobs
  // ==========================================================

  loadJobs(): void {

    this.loadingJobs.set(true);

    this.error.set(null);

    this.jobsService.listJobs({ page: 1 }).subscribe({

      next: (response) => {

        this.jobs.set(
          response.results || []
        );

        this.loadingJobs.set(false);

      },

      error: (err) => {

        console.error(
          'Failed to load HR jobs:',
          err
        );

        this.jobs.set([]);

        this.loadingJobs.set(false);

        this.error.set(
          err?.error?.detail ||
          'Unable to load your jobs.'
        );

      }

    });

  }


  // ==========================================================
  // Job Selection
  // ==========================================================

  selectJob(job: Job): void {

    this.selectedJobId.set(job.id);

    this.selectedJobTitle.set(job.title);

    this.loadTopCandidates(job.id);

  }

  goToCreateJob(): void {

    this.router.navigate([
        '/hr/jobs/new'
    ]);

  }

  // ==========================================================
  // Load AI Candidates
  // ==========================================================

  loadTopCandidates(jobId: number): void {

    this.loadingCandidates.set(true);

    this.error.set(null);

    this.candidates.set([]);

    this.totalCount.set(0);

    this.aiService
      .getTopCandidates(jobId, 10)
      .subscribe({

        next: (response: TopCandidatesResponse) => {

          this.candidates.set(
            response.results || []
          );

          this.totalCount.set(
            response.count || 0
          );

          this.loadingCandidates.set(false);

        },

        error: (err) => {

          console.error(
            'Failed to load AI recommended candidates:',
            err
          );

          this.candidates.set([]);

          this.totalCount.set(0);

          this.loadingCandidates.set(false);

          this.error.set(
            err?.error?.detail ||
            'Unable to load AI recommended candidates.'
          );

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
  // Experience Formatting
  // ==========================================================

  formatExperience(years: number): string {

    if (years === 0) {
      return 'Fresher';
    }

    if (years === 1) {
      return '1 year experience';
    }

    return `${years} years experience`;

  }


  // ==========================================================
  // Back to HR Dashboard
  // ==========================================================

  goBackToDashboard(): void {

    this.router.navigate([
      '/hr-dashboard'
    ]);

  }


  // ==========================================================
  // View Applicant
  // ==========================================================

  viewCandidate(candidate: RecommendedCandidate): void {

    console.log(
      'Selected candidate:',
      candidate
    );

  }

}