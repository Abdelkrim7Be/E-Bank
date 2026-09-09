import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router, ActivatedRoute, RouterModule } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { LoginRequest, UserRole } from "../../models/auth.model";
import { BankingValidators } from "../../../shared/validators/banking-validators";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = "";
  successMessage = "";
  showPassword = false;
  returnUrl = "";

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "";

    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.redirectUser();
    }
  }

  initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ["", [Validators.required, BankingValidators.username()]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = "";

    const loginData: LoginRequest = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    };
    const rememberMe = !!this.loginForm.value.rememberMe;

    this.authService.login(loginData, rememberMe).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = "Login successful! Redirecting...";
        setTimeout(() => {
          this.redirectUser();
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message ||
          "Login failed. Please check your credentials.";
      },
    });
  }

  private redirectUser(): void {
    const user = this.authService.getCurrentUser();
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else if (user?.role === UserRole.ADMIN) {
      this.router.navigate(["/admin/dashboard"]);
    } else {
      this.router.navigate(["/customer/dashboard"]);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  loginAsAdmin(): void {
    this.loginForm.patchValue({
      username: "admin",
      password: "password",
    });
    this.onSubmit();
  }

  loginAsCustomer(): void {
    this.loginForm.patchValue({
      // Use a demo customer that is guaranteed to have seeded accounts
      username: "jean.martin",
      password: "password",
    });
    this.onSubmit();
  }

  // Getter methods for form controls
  get username() {
    return this.loginForm.get("username");
  }
  get password() {
    return this.loginForm.get("password");
  }
}
