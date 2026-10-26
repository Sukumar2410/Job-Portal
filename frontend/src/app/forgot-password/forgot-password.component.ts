
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  email = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  onSubmit() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.api.post<any>(API.AUTH.FORGOT_PASSWORD, {
      email: this.email
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.detail || 'Something went wrong. Please try again.';
      }
    });
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}