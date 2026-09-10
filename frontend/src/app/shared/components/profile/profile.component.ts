import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
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
  avatarUploading = false;
  avatarError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient
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
      email: this.profileForm.value.email,
      avatarUrl: this.currentUser?.avatarUrl,
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

  uploadAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      this.avatarError = 'Choose an image smaller than 5 MB.';
      return;
    }
    const config = environment.cloudinary;
    if (!config.cloudName || !config.uploadPreset) {
      this.avatarError = 'Profile photo storage is not configured yet.';
      return;
    }
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', config.uploadPreset);
    form.append('folder', 'e-bank/profiles');
    this.avatarUploading = true;
    this.avatarError = '';
    this.http.post<{ secure_url: string }>(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, form)
      .pipe(finalize(() => this.avatarUploading = false))
      .subscribe({
        next: ({ secure_url }) => {
          this.currentUser = { ...this.currentUser!, avatarUrl: secure_url };
          this.profileForm.markAsDirty();
          this.updateProfile();
        },
        error: () => this.avatarError = 'The photo could not be uploaded. Try again.'
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
