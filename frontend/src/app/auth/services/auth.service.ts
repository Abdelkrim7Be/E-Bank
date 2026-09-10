import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { map, catchError, tap } from "rxjs/operators";
import { Router } from "@angular/router";
import {
  User,
  JwtPayload,
  UserRole,
  UserStatus,
  PasswordChangeRequest,
  ProfileUpdateRequest,
} from "../models/auth.model";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "../../shared/models/banking-dtos.model";
import { environment } from "../../../environments/environment";
import { NotificationService } from "../../core/services/notification.service";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = environment.tokenKey;
  private readonly USER_KEY = "current_user";

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService,
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();

    if (token && user && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.logout();
    }
  }

  login(
    credentials: LoginRequest,
    rememberMe: boolean = true,
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.API_URL}${environment.endpoints.auth.login}`,
        credentials,
      )
      .pipe(
        tap((response) => {
          this.setToken(response.token, rememberMe);

          const user: User = {
            id: 0,
            username: response.username,
            email: response.email,
            firstName: (response as any).firstName ?? response.username ?? "",
            lastName: (response as any).lastName ?? "",
            avatarUrl: (response as any).avatarUrl,
            role: response.role as UserRole,
            status: UserStatus.ACTIVE,
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.setCurrentUser(user, rememberMe);

          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);

          this.notificationService.loginSuccess(
            user.firstName || user.username,
          );
        }),
        catchError((error) => {
          console.error("Login error:", error);
          this.notificationService.error(
            "Login failed. Please check your credentials and try again.",
            "Login Failed",
          );
          return throwError(() => error);
        }),
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.API_URL}${environment.endpoints.auth.register}`,
        userData,
      )
      .pipe(
        tap((response) => {
          this.setToken(response.token, true);
          // Convert AuthResponse to User format
          const user: User = {
            id: 0, // Will be set from JWT payload
            username: response.username,
            email: response.email,
            firstName: userData.name || "",
            lastName: "",
            role: response.role as UserRole,
            status: UserStatus.ACTIVE,
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.setCurrentUser(user, true);
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        }),
        catchError((error) => {
          console.error("Registration error:", error);
          return throwError(() => error);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(["/auth/login"]);
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.API_URL}${environment.endpoints.auth.refresh}`,
        {},
      )
      .pipe(
        tap((response) => {
          this.setToken(response.token, true);
          // Convert AuthResponse to User format
          const user: User = {
            id: 0,
            username: response.username,
            email: response.email,
            firstName: "",
            lastName: "",
            role: response.role as UserRole,
            status: UserStatus.ACTIVE,
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.setCurrentUser(user, true);
          this.currentUserSubject.next(user);
        }),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        }),
      );
  }

  changePassword(passwordData: PasswordChangeRequest): Observable<any> {
    return this.http.put(
      `${this.API_URL}${environment.endpoints.auth.changePassword}`,
      passwordData,
    );
  }

  getProfile(): Observable<User> {
    return this.http
      .get<User>(`${this.API_URL}${environment.endpoints.auth.profile}`)
      .pipe(
        tap((user) => {
          this.setCurrentUserInSameStorage(user);
          this.currentUserSubject.next(user);
        }),
        catchError((error) => {
          console.error("Get profile error:", error);
          if (error.status === 401) {
            this.logout();
          }
          return throwError(() => error);
        }),
      );
  }

  updateProfile(profileData: ProfileUpdateRequest): Observable<User> {
    return this.http
      .put<User>(
        `${this.API_URL}${environment.endpoints.auth.profile}`,
        profileData,
      )
      .pipe(
        tap((user) => {
          this.setCurrentUserInSameStorage(user);
          this.currentUserSubject.next(user);
        }),
        catchError((error) => {
          console.error("Update profile error:", error);
          if (error.status === 401) {
            this.logout();
          }
          return throwError(() => error);
        }),
      );
  }

  getToken(): string | null {
    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  private setToken(token: string, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.removeItem(this.TOKEN_KEY);
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  getCurrentUser(): User | null {
    const userStr =
      localStorage.getItem(this.USER_KEY) ||
      sessionStorage.getItem(this.USER_KEY);
    if (!userStr || userStr === "undefined" || userStr === "null") {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch (error) {
      localStorage.removeItem(this.USER_KEY);
      sessionStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  private setCurrentUser(user: User, rememberMe: boolean): void {
    const serialized = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(this.USER_KEY, serialized);
      sessionStorage.removeItem(this.USER_KEY);
    } else {
      sessionStorage.setItem(this.USER_KEY, serialized);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  /** Updates user in whichever storage currently holds the token (for profile updates). */
  private setCurrentUserInSameStorage(user: User): void {
    const serialized = JSON.stringify(user);
    if (sessionStorage.getItem(this.TOKEN_KEY)) {
      sessionStorage.setItem(this.USER_KEY, serialized);
    } else {
      localStorage.setItem(this.USER_KEY, serialized);
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isCustomer(): boolean {
    return this.hasRole(UserRole.CUSTOMER);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  private decodeToken(token: string): JwtPayload {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  }

  getTokenExpirationDate(): Date | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      return new Date(payload.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}
