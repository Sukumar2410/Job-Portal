import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { JobsService } from '../core/services/jobs.service';

@Component({
  selector: 'app-saved-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <app-top-nav portalName="Job Portal"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Saved Jobs ❤️</h1>
          <p class="text-gray-600">Jobs you've bookmarked for later.</p>
        </div>

        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <div *ngIf="!loading() && saved().length === 0"
          class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in">
          <div class="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg class="w-12 h-12 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">No saved jobs yet</h3>
          <p class="text-gray-500 mb-6">Bookmark jobs you're interested in to review later.</p>
          <a routerLink="/jobs"
            class="inline-block px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
            Browse Jobs →
          </a>
        </div>

        <div *ngIf="!loading() && saved().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let item of saved(); let i = index"
            class="group bg-white rounded-2xl shadow-soft hover:shadow-xl transition-all overflow-hidden animate-slide-up cursor-pointer border-2 border-transparent hover:border-primary-200"
            [style.animation-delay]="(i * 0.05) + 's'"
            [routerLink]="['/jobs', item.job.slug]">
            <div class="p-5">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div class="w-12 h-12 bg-gradient-to-br from-primary-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl font-bold text-primary-700">
                    {{ item.job.company?.name?.[0] || '?' }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-gray-600 truncate">{{ item.job.company?.name }}</div>
                    <div class="text-xs text-gray-400">{{ item.job.company?.industry }}</div>
                  </div>
                </div>
                <button (click)="unsave(item, $event)"
                  class="p-2 text-pink-500 hover:bg-pink-50 rounded-lg transition-all">
                  <svg class="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </button>
              </div>

              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {{ item.job.title }}
              </h3>

              <div class="flex flex-wrap gap-2 mb-3 text-xs">
                <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">📍 {{ item.job.location }}</span>
                <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">{{ item.job.work_mode }}</span>
              </div>

              <div class="pt-3 border-t border-gray-100 text-xs text-gray-500">
                Saved {{ timeSince(item.saved_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SavedJobsComponent implements OnInit {
  private jobsService = inject(JobsService);

  saved = signal<any[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.jobsService.getSavedJobs().subscribe({
      next: (res) => {
        this.saved.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  unsave(item: any, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.jobsService.unsaveJob(item.job.slug).subscribe({
      next: () => {
        this.saved.set(this.saved().filter(x => x.id !== item.id));
      }
    });
  }

  timeSince(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
}