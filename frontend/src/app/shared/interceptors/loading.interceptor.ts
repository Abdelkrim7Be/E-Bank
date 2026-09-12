import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoaderService } from '../services/loader.service';
import { AlertService } from '../services/alert.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  const alertService = inject(AlertService);

  if (!req.url.includes('skip-loader')) {
    loaderService.show();
  }

  return next(req).pipe(
    catchError((error) => {
      let errorMessage = 'An error occurred. Please try again later.';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage =
              'Unable to connect to the server. Please check your network connection.';
            break;
          case 400:
            errorMessage =
              error.error?.message || 'Bad request. Please check your input.';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please log in again.';
            break;
          case 403:
            errorMessage =
              'Access denied. You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            break;
          case 500:
            errorMessage =
              'Internal server error. Please try again later or contact support.';
            break;
          default:
            if (error.error?.message) {
              errorMessage = error.error.message;
            }
            break;
        }
      }

      alertService.error(errorMessage);
      console.error('HTTP Error:', error);
      return throwError(() => error);
    }),
    finalize(() => {
      if (!req.url.includes('skip-loader')) {
        loaderService.hide();
      }
    })
  );
};
