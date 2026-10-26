import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { ReportService, Report } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-my-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TopNavComponent
  ],
  templateUrl: './my-reports.component.html',
  styleUrls: ['./my-reports.component.scss']
})
export class MyReportsComponent implements OnInit {

  private reportService = inject(ReportService);
  private auth = inject(AuthService);

  reports = signal<Report[]>([]);
  loading = signal(true);

  user = this.auth.currentUser();

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);

    this.reportService.myReports().subscribe({
      next: (response) => {
        this.reports.set(response.results);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load reports', err);
        this.loading.set(false);
      }
    });
  }

  priorityClass(priority: string): string {
    switch (priority) {
      case 'HIGH':
        return 'priority-high';
      case 'MEDIUM':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'RESOLVED':
        return 'status-resolved';
      case 'IN_PROGRESS':
        return 'status-progress';
      default:
        return 'status-open';
    }
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getDashboardRoute(): string {
    return this.user?.role === 'HR'
      ? '/hr-dashboard'
      : '/candidate-dashboard';
  }
}