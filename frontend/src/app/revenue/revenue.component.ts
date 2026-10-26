import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import {
  PaymentsService,
  RevenueDashboard
} from '../core/services/payments.service';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, TopNavComponent],
  templateUrl: './revenue.component.html',
  styleUrls: ['./revenue.component.scss']
})

export class RevenueComponent implements OnInit {

  private paymentService = inject(PaymentsService);

  revenue = signal<RevenueDashboard | null>(null);

  loading = signal(true);

  error = signal<string | null>(null);

  selectedPeriod = signal('all');

  selectedFilter = signal('today');
  
  periods = [
    { label: 'Today', value: 'today' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
    { label: 'All Time', value: 'all' },
    { label: 'Trial Users', value: 'trial' }
  ];

  ngOnInit(): void {
    this.loadRevenue("all");
  }

  loadRevenue(period: string = 'all'): void {

    this.selectedPeriod.set(period);

    this.loading.set(true);
    this.error.set(null);

    this.paymentService.getRevenue(period).subscribe({
      next: (res) => {
        this.revenue.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load revenue dashboard');
        this.loading.set(false);
      }
    });

  }

  changePeriod(period: string): void {
    this.selectedPeriod.set(period);
    this.loadRevenue();
  }

}