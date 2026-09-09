import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { User, PasswordChangeRequest, ProfileUpdateRequest } from '../../../auth/models/auth.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.css"
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  profileLoading = false;
  passwordLoading = false;
  
  profileMessage = '';
  profileMessageType: 'success' | 'error' = 'success';
  
  passwordMessage = '';
  passwordMessageType: 'success' | 'error' = 'success';
  
  showCurrentPassword = false;
  showNewPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForms();
  }

  initializeForms(): void {
    // Profile form
    this.profileForm = this.fb.group({
      firstName: [this.currentUser?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [this.currentUser?.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]]
    });

    // Password form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileLoading = true;
    this.profileMessage = '';

    const profileData: ProfileUpdateRequest = {
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      email: this.profileForm.value.email
    };

    this.authService.updateProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.profileLoading = false;
        this.currentUser = updatedUser;
        this.profileMessage = 'Profile updated successfully!';
        this.profileMessageType = 'success';
        
        setTimeout(() => {
          this.profileMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.profileLoading = false;
        this.profileMessage = error.error?.message || 'Failed to update profile. Please try again.';
        this.profileMessageType = 'error';
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading = true;
    this.passwordMessage = '';

    const passwordData: PasswordChangeRequest = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
      confirmPassword: this.passwordForm.value.confirmPassword
    };

    this.authService.changePassword(passwordData).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordMessage = 'Password changed successfully!';
        this.passwordMessageType = 'success';
        this.resetPasswordForm();
        
        setTimeout(() => {
          this.passwordMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.passwordLoading = false;
        this.passwordMessage = error.error?.message || 'Failed to change password. Please try again.';
        this.passwordMessageType = 'error';
      }
    });
  }

  resetProfileForm(): void {
    this.profileForm.patchValue({
      firstName: this.currentUser?.firstName || '',
      lastName: this.currentUser?.lastName || '',
      email: this.currentUser?.email || ''
    });
    this.profileForm.markAsUntouched();
    this.profileMessage = '';
  }

  resetPasswordForm(): void {
    this.passwordForm.reset();
    this.passwordForm.markAsUntouched();
    this.passwordMessage = '';
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  getStatusBadge(status: string | undefined): string {
    const badges = {
      'ACTIVE': 'bg-success',
      'INACTIVE': 'bg-warning',
      'SUSPENDED': 'bg-danger'
    };
    return badges[status as keyof typeof badges] || 'bg-secondary';
  }

  // Getter methods for form controls
  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
  get email() { return this.profileForm.get('email'); }
  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}
