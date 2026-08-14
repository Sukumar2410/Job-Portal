import { HttpInterceptorFn } from '@angular/common/http';
import { STORAGE_KEYS } from '../constants/api.constants';

/**
 * Automatically attaches JWT access token to every outgoing request.
 * Skips login/register/refresh endpoints.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const skipUrls = ['/auth/login/', '/auth/register/', '/auth/token/refresh/',
                    '/auth/forgot-password/', '/auth/reset-password/',
                    '/auth/verify-email/', '/auth/resend-verification/'];

  const shouldSkip = skipUrls.some(url => req.url.includes(url));

  if (shouldSkip) {
    return next(req);
  }

  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};