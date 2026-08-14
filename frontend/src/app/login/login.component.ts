import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex bg-white">

      <!-- ============ LEFT: HERO PANEL ============ -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 via-indigo-700 to-purple-800">
        <!-- Animated background orbs -->
        <div class="absolute top-20 -left-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div class="absolute bottom-20 -right-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style="animation-delay: 2s;"></div>
        <div class="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style="animation-delay: 4s;"></div>

        <!-- Grid pattern overlay -->
        <div class="absolute inset-0 opacity-10" style="background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 40px 40px;"></div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full animate-fade-in">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <div class="text-xl font-bold">Enterprise</div>
              <div class="text-xs text-white/70 -mt-1">Job Portal</div>
            </div>
          </div>

          <!-- Hero Text -->
          <div class="max-w-lg">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 text-sm mb-6 animate-slide-in-right">
              <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              AI-Powered Recruitment
            </div>
            <h1 class="text-5xl xl:text-6xl font-bold leading-tight mb-6 animate-slide-up">
              Connect talent with
              <span class="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                opportunity.
              </span>
            </h1>
            <p class="text-lg text-white/80 leading-relaxed animate-slide-up" style="animation-delay: 0.15s;">
              Enterprise-grade recruitment platform powered by AI matching,
              real-time analytics, and role-based workflows built for scale.
            </p>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-6 animate-slide-up" style="animation-delay: 0.3s;">
            <div>
              <div class="text-3xl xl:text-4xl font-bold mb-1">10K+</div>
              <div class="text-sm text-white/70">Active Jobs</div>
            </div>
            <div>
              <div class="text-3xl xl:text-4xl font-bold mb-1">500+</div>
              <div class="text-sm text-white/70">Companies</div>
            </div>
            <div>
              <div class="text-3xl xl:text-4xl font-bold mb-1">50K+</div>
              <div class="text-sm text-white/70">Candidates</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ RIGHT: FORM PANEL ============ -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <!-- Mobile background -->
        <div class="lg:hidden absolute inset-0 bg-gradient-to-br from-primary-50 to-purple-50"></div>

        <div class="relative w-full max-w-md animate-scale-in">
          <!-- Mobile Logo -->
          <div class="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="text-lg font-bold text-gray-800">Enterprise Job Portal</span>
          </div>

          <!-- Header -->
          <div class="mb-8">
            <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Welcome back <span class="inline-block animate-pulse">👋</span></h2>
            <p class="text-gray-500">Sign in to continue to your dashboard.</p>
          </div>

          <!-- Form -->
          <form (submit)="onSubmit($event)" class="space-y-5">
            <!-- Email -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  class="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="Enter your password"
                  class="w-full pl-11 pr-11 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                />
                <button type="button" (click)="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary-600 transition-colors">
                  <svg *ngIf="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <svg *ngIf="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Forgot Password Link -->
            <div class="flex justify-end">
              <a href="#" class="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                Forgot password?
              </a>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loading"
              class="w-full py-3.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <svg *ngIf="loading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-scale-in">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-sm text-red-700 font-medium">{{ errorMessage }}</p>
            </div>

            <!-- Divider -->
            <div class="relative py-2">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="px-4 bg-white text-sm text-gray-500">New to our platform?</span>
              </div>
            </div>

            <!-- Register Link Button -->
            <a routerLink="/register"
              class="block w-full py-3.5 text-center border-2 border-gray-200 hover:border-primary-500 text-gray-700 hover:text-primary-600 font-semibold rounded-xl transition-all hover:bg-primary-50">
              Create an account
            </a>
          </form>

          <!-- Test Credentials Helper -->
          <div class="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <span class="text-xs font-bold text-amber-800 uppercase tracking-wide">Demo Accounts</span>
            </div>
            <div class="space-y-1 text-xs text-amber-900">
              <div>👤 <code class="font-mono">candidate1&#64;example.com</code></div>
              <div>💼 <code class="font-mono">hr1&#64;techcorpsolutions.example.com</code></div>
              <div>🔑 Password: <code class="font-mono font-bold">TestPass&#64;123</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

    onSubmit(event: Event): void {
      event.preventDefault();
      this.errorMessage = '';
      this.loading = true;

      this.auth.login(this.email, this.password).subscribe({
        next: (res) => {
          this.loading = false;
          this.router.navigate([this.auth.getDashboardRoute()]);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.detail || 'Invalid email or password.';
        }
      });
    }
}