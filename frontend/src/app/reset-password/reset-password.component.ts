import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = '';
  password = '';
  confirmPassword = '';

  loading = false;
  successMessage = '';
  errorMessage = '';

  showNewPassword = false;
  showConfirmPassword = false;

  constructor() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.token) {
      this.errorMessage = 'Invalid or expired reset link.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    this.api.post(API.AUTH.RESET_PASSWORD, {
     token: this.token,
     new_password: this.password,
     confirm_password: this.confirmPassword,
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.successMessage = res.message;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.detail || 'Unable to reset password.';
      },
    });
  }
}