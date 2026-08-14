import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, Observable, BehaviorSubject, filter, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { STORAGE_KEYS } from '../constants/api.constants';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

/**
 * Handles HTTP errors globally.
 * - 401: Try to refresh token; if refresh fails, logout.
 * - Other errors: Pass through for component to handle.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/login/') ||
                             req.url.includes('/auth/register/') ||
                             req.url.includes('/auth/token/refresh/');

      if (error.status === 401 && !isAuthEndpoint) {
        return handle401(req, next, auth, router);
      }

      return throwError(() => error);
    })
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {

  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject.next(null);

    return auth.refreshToken().pipe(
      switchMap((tokens) => {
        isRefreshing = false;
        refreshSubject.next(tokens.access);
        return next(addToken(req, tokens.access));
      }),
      catchError((err) => {
        isRefreshing = false;
        auth.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  // Queue additional requests until token refresh completes
  return refreshSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => next(addToken(req, token)))
  );
}

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}