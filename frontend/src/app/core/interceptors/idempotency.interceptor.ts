import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

export const idempotencyInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.method !== 'POST' || !/\/(credit|debit|transfer)$/.test(request.url) || typeof sessionStorage === 'undefined') {
    return next(request);
  }
  const fingerprint = 'e-bank:pending:' + request.url + ':' + JSON.stringify(request.body);
  const key = sessionStorage.getItem(fingerprint) ?? crypto.randomUUID();
  sessionStorage.setItem(fingerprint, key);
  return next(request.clone({ setHeaders: { 'Idempotency-Key': key } })).pipe(tap({
    next: event => { if (event instanceof HttpResponse) sessionStorage.removeItem(fingerprint); },
    error: error => {
      if (error instanceof HttpErrorResponse && [400, 403, 404, 409, 422].includes(error.status)) {
        sessionStorage.removeItem(fingerprint);
      }
    },
  }));
};
