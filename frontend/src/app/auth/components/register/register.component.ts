import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { UserRole } from "../../models/auth.model";
import { RegisterRequest } from "../../../shared/models/banking-dtos.model";
import { BankingValidators } from "../../../shared/validators/banking-validators";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.css",
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  errorMessage = "";
  successMessage = "";
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    if (this.authService.isAuthenticated()) {
      this.redirectUser();
    }
  }

  initializeForm(): void {
    this.registerForm = this.fb.group({
      firstName: ["", [Validators.required, Validators.minLength(2)]],
      lastName: ["", [Validators.required, Validators.minLength(2)]],
      username: ["", [Validators.required, BankingValidators.username()]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, BankingValidators.strongPassword()]],
      confirmPassword: [
        "",
        [Validators.required, BankingValidators.passwordMatch("password")],
      ],
      phone: [""], // Optional phone field as per TODO.md
      acceptTerms: [false, [Validators.requiredTrue]],
    });
  }

  passwordMatchValidator(
    control: AbstractControl,
  ): { [key: string]: boolean } | null {
    const password = control.get("password");
    const confirmPassword = control.get("confirmPassword");

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = "";

    const registerData: RegisterRequest = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      role: UserRole.CUSTOMER,
      name: `${this.registerForm.value.firstName} ${this.registerForm.value.lastName}`, // Combined name as per DTO
      phone: this.registerForm.value.phone || undefined, // Optional phone
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = "Account created successfully! Redirecting...";
        setTimeout(() => {
          this.redirectUser();
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message || "Registration failed. Please try again.";
      },
    });
  }

  private redirectUser(): void {
    const user = this.authService.getCurrentUser();
    if (user?.role === UserRole.ADMIN) {
      this.router.navigate(["/admin/dashboard"]);
    } else {
      this.router.navigate(["/customer/dashboard"]);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get firstName() {
    return this.registerForm.get("firstName");
  }
  get lastName() {
    return this.registerForm.get("lastName");
  }
  get username() {
    return this.registerForm.get("username");
  }
  get email() {
    return this.registerForm.get("email");
  }
  get phone() {
    return this.registerForm.get("phone");
  }
  get password() {
    return this.registerForm.get("password");
  }
  get confirmPassword() {
    return this.registerForm.get("confirmPassword");
  }
  get acceptTerms() {
    return this.registerForm.get("acceptTerms");
  }

  checkPasswordRequirement(requirement: string): boolean {
    const password = this.password?.value || "";

    switch (requirement) {
      case "length":
        return password.length >= 8;
      case "lowercase":
        return /[a-z]/.test(password);
      case "uppercase":
        return /[A-Z]/.test(password);
      case "digit":
        return /\d/.test(password);
      case "special":
        return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      default:
        return false;
    }
  }

  getPasswordRequirementClass(requirement: string): string {
    const isValid = this.checkPasswordRequirement(requirement);
    return isValid ? "text-success" : "text-muted";
  }
}
