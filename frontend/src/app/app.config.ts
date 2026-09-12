import { idempotencyInterceptor } from './core/interceptors/idempotency.interceptor';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import { MockApiInterceptor } from './mocks/mock-api.interceptor';
import { tokenInterceptor } from '../auth/interceptors/token.interceptor';

const interceptors: any[] = [
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
];

if (environment.useMockApi) {
  interceptors.unshift({
    provide: HTTP_INTERCEPTORS,
    useClass: MockApiInterceptor,
    multi: true,
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([tokenInterceptor, idempotencyInterceptor])),
    ...interceptors,
  ],
};
