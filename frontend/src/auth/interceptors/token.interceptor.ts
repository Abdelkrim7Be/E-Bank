import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthService } from "../../app/auth/services/auth.service";

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000;
    return Date.now() >= expirationTime;
  } catch {
    return true;
  }
};

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (req.url.includes("/auth/login") || req.url.includes("/auth/register")) {
    return next(req);
  }

  if (token) {
    if (isTokenExpired(token)) {
      authService.logout();
      router.navigate(["/auth/login"], { queryParams: { expired: "true" } });
      return throwError(() => new Error("Session expired"));
    }

    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && error.error?.message === "Token expired") {
        authService.logout();
        router.navigate(["/auth/login"], { queryParams: { expired: "true" } });
      }
      return throwError(() => error);
    }),
  );
};
