import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import {
  ReportService,
  AdminReport
} from '../../core/services/report.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss']
})
export class AdminReportsComponent implements OnInit {

  private service = inject(ReportService);

  loading = signal(true);

  reports = signal<AdminReport[]>([]);

  search = signal('');

  statusFilter = signal('ALL');

  priorityFilter = signal('ALL');

  selectedReport = signal<AdminReport | null>(null);

  remarks = '';

  filteredReports = computed(() => {

    return this.reports().filter(r => {

      const matchSearch =
        r.subject.toLowerCase().includes(this.search().toLowerCase()) ||
        r.reporter_email.toLowerCase().includes(this.search().toLowerCase());

      const matchStatus =
        this.statusFilter() === 'ALL' ||
        r.status === this.statusFilter();

      const matchPriority =
        this.priorityFilter() === 'ALL' ||
        r.priority === this.priorityFilter();

      return matchSearch && matchStatus && matchPriority;

    });

  });

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports() {

    this.service.adminReports().subscribe({
      next: res => {
        this.reports.set(res.results);
        this.loading.set(false);
      }
    });

  }

  open(report: AdminReport) {
    this.selectedReport.set(report);
    this.remarks = report.admin_remarks || '';
  }

  close() {
    this.selectedReport.set(null);
  }

  resolve(status: string) {

    const report = this.selectedReport();

    if (!report) return;

    this.service.resolveReport(report.id, {
      status,
      admin_remarks: this.remarks
    }).subscribe(() => {

      this.close();

      this.loadReports();

    });

  }

}