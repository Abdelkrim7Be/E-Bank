import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/**
 * HTTP Error Interceptor as specified in TODO.md
 * Handles global error responses and provides user feedback
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        let shouldRedirect = false;

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Network Error: ${error.error.message}`;
        } else {
          // Server-side error - Enhanced handling as per TODO.md
          switch (error.status) {
            case 400:
              if (error.error?.message) {
                errorMessage = error.error.message;
              } else if (error.error?.errors) {
                // Handle validation errors
                const validationErrors = error.error.errors;
                if (Array.isArray(validationErrors)) {
                  errorMessage = validationErrors
                    .map((err: any) => err.message || err)
                    .join(', ');
                } else {
                  errorMessage = 'Validation error occurred';
                }
              } else {
                errorMessage = 'Bad request';
              }
              break;
            case 401:
              errorMessage = 'Unauthorized access - Please login again';
              shouldRedirect = true;
              // Clear stored tokens as per TODO.md specifications
              localStorage.removeItem(environment.tokenKey);
              localStorage.removeItem('current_user');
              sessionStorage.removeItem(environment.tokenKey);
              sessionStorage.removeItem('current_user');
              break;
            case 403:
              errorMessage = 'Access forbidden - You do not have permission';
              break;
            case 404:
              errorMessage = 'Resource not found';
              break;
            case 409:
              errorMessage = error.error?.message || 'Conflict occurred';
              break;
            case 422:
              errorMessage = 'Validation failed';
              if (error.error?.errors) {
                const validationErrors = error.error.errors;
                if (Array.isArray(validationErrors)) {
                  errorMessage = validationErrors
                    .map((err: any) => `${err.field}: ${err.message}`)
                    .join(', ');
                }
              }
              break;
            case 500:
              errorMessage = 'Internal server error - Please try again later';
              break;
            case 502:
              errorMessage = 'Service temporarily unavailable';
              break;
            case 503:
              errorMessage = 'Service unavailable - Please try again later';
              break;
            case 0:
              errorMessage = 'Network error - Please check your connection';
              break;
            default:
              errorMessage =
                error.error?.message || `Error Code: ${error.status}`;
          }
        }

        // Log the error for debugging
        console.error('HTTP Error:', {
          status: error.status,
          message: errorMessage,
          url: error.url,
          error: error.error,
        });

        // Show user notification (console for now, can be replaced with toast/snackbar)
        console.error('User Error:', errorMessage);

        // Redirect to login if unauthorized
        if (shouldRedirect) {
          this.router.navigate(['/auth/login']);
        }

        // Return enhanced error with user message
        const enhancedError = {
          ...error,
          userMessage: errorMessage,
        };

        return throwError(() => enhancedError);
      })
    );
  }
}
