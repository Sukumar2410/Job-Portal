import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex bg-white">

      <!-- ============ LEFT: HERO PANEL ============ -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-primary-700">
        <div class="absolute top-20 -right-20 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div class="absolute bottom-20 -left-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style="animation-delay: 2s;"></div>

        <div class="absolute inset-0 opacity-10" style="background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 40px 40px;"></div>

        <div class="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full animate-fade-in">
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

          <div class="max-w-lg">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 text-sm mb-6 animate-slide-in-right">
              <span class="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
              Join 50,000+ professionals
            </div>
            <h1 class="text-5xl xl:text-6xl font-bold leading-tight mb-6 animate-slide-up">
              Your career
              <span class="bg-gradient-to-r from-yellow-200 via-pink-100 to-white bg-clip-text text-transparent">
                starts here.
              </span>
            </h1>
            <p class="text-lg text-white/80 leading-relaxed animate-slide-up" style="animation-delay: 0.15s;">
              Whether you're seeking your dream job or looking to hire top talent,
              our AI-powered platform makes it effortless.
            </p>
          </div>

          <!-- Feature checkmarks -->
          <div class="space-y-3 animate-slide-up" style="animation-delay: 0.3s;">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span class="text-white/90">Free forever plan</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span class="text-white/90">No credit card required</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span class="text-white/90">Setup in under 2 minutes</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ RIGHT: FORM PANEL ============ -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-y-auto">
        <div class="lg:hidden absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50"></div>

        <div class="relative w-full max-w-md animate-scale-in py-8">
          <!-- Mobile Logo -->
          <div class="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
            </div>
            <span class="text-lg font-bold text-gray-800">Enterprise Job Portal</span>
          </div>

          <div class="mb-6">
            <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Create account</h2>
            <p class="text-gray-500">Join thousands connecting with top opportunities.</p>
          </div>

          <form (submit)="onSubmit($event)" class="space-y-4">
            <!-- Role Selection -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">I am a...</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="cursor-pointer">
                  <input type="radio" [(ngModel)]="role" name="role" value="CANDIDATE" class="peer sr-only" />
                  <div class="border-2 border-gray-200 rounded-xl p-4 text-center transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:shadow-md hover:border-gray-300">
                    <svg class="w-8 h-8 text-gray-400 peer-checked:text-primary-600 mb-2 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <div class="font-semibold text-sm text-gray-800">Job Seeker</div>
                    <div class="text-xs text-gray-500 mt-0.5">Find opportunities</div>
                  </div>
                </label>
                <label class="cursor-pointer">
                  <input type="radio" [(ngModel)]="role" name="role" value="HR" class="peer sr-only" />
                  <div class="border-2 border-gray-200 rounded-xl p-4 text-center transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:shadow-md hover:border-gray-300">
                    <svg class="w-8 h-8 text-gray-400 peer-checked:text-primary-600 mb-2 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <div class="font-semibold text-sm text-gray-800">Recruiter</div>
                    <div class="text-xs text-gray-500 mt-0.5">Hire top talent</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Name Fields -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">First name</label>
                <input type="text" [(ngModel)]="first_name" name="first_name" required placeholder="John"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Last name</label>
                <input type="text" [(ngModel)]="last_name" name="last_name" required placeholder="Doe"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input type="email" [(ngModel)]="email" name="email" required placeholder="you@example.com"
                  class="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
              </div>
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Phone <span class="text-gray-400 font-normal">(optional)</span></label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <input type="tel" [(ngModel)]="phone" name="phone" placeholder="+91 9876543210"
                  class="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required minlength="8" placeholder="Min. 8 characters"
                  class="w-full pl-11 pr-11 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
                <button type="button" (click)="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary-600">
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

            <!-- Confirm Password -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Confirm password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password_confirm" name="password_confirm" required placeholder="Re-enter password"
                  class="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" [disabled]="loading"
              class="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
              <svg *ngIf="loading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              {{ loading ? 'Creating account...' : 'Create account' }}
            </button>

            <!-- Error -->
            <div *ngIf="errorMessage" class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-scale-in">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-sm text-red-700 font-medium">{{ errorMessage }}</p>
            </div>

            <p class="text-center text-sm text-gray-600 pt-2">
              Already have an account?
              <a routerLink="/login" class="text-primary-600 hover:text-primary-700 font-semibold ml-1 transition-colors">Sign in</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
private auth = inject(AuthService);
  private router = inject(Router);

  role = 'CANDIDATE';
  first_name = '';
  last_name = '';
  email = '';
  phone = '';
  password = '';
  password_confirm = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

    onSubmit(event: Event): void {
      event.preventDefault();
      this.errorMessage = '';

      if (this.password !== this.password_confirm) {
        this.errorMessage = 'Passwords do not match.';
        return;
      }

      this.loading = true;
      const payload = {
        role: this.role,
        first_name: this.first_name,
        last_name: this.last_name,
        email: this.email,
        phone: this.phone,
        password: this.password,
        password_confirm: this.password_confirm,
      };

      this.auth.register(payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.router.navigate([this.auth.getDashboardRoute()]);
        },
        error: (err) => {
          this.loading = false;
          const errObj = err.error || {};
          const firstKey = Object.keys(errObj)[0];
          const firstVal = errObj[firstKey];
          this.errorMessage = Array.isArray(firstVal) ? firstVal[0] : (firstVal || 'Registration failed.');
        }
     }); 
    }
}