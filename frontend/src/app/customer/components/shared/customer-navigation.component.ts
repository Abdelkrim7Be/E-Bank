import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../auth/models/auth.model';

@Component({
  selector: 'app-customer-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./customer-navigation.component.html",
  styleUrl: "./customer-navigation.component.css",
})
export class CustomerNavigationComponent implements OnInit {
  currentUser: User | null = null;
  currentPageTitle: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.updatePageTitle();

    // Listen to route changes to update breadcrumb
    this.router.events.subscribe(() => {
      this.updatePageTitle();
    });
  }

  private updatePageTitle(): void {
    const url = this.router.url;

    if (url.includes('/customer/accounts') && url !== '/customer/accounts') {
      this.currentPageTitle = 'Account Details';
    } else if (url.includes('/customer/accounts')) {
      this.currentPageTitle = 'My Accounts';
    } else if (url.includes('/customer/transaction-history')) {
      this.currentPageTitle = 'Transaction History';
    } else if (url.includes('/customer/deposit')) {
      this.currentPageTitle = 'Add Money';
    } else if (url.includes('/customer/debit')) {
      this.currentPageTitle = 'Debit Money';
    } else if (url.includes('/customer/transfer')) {
      this.currentPageTitle = 'Transfer Funds';
    } else if (url.includes('/customer/dashboard')) {
      this.currentPageTitle = '';
    } else {
      this.currentPageTitle = '';
    }
  }

  logout(event: Event): void {
    event.preventDefault();

    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout().subscribe({
        next: () => {
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          console.error('Logout error:', error);
          // Force logout even if server request fails
          this.authService.clearAuthData();
          this.router.navigate(['/auth/login']);
        },
      });
    }
  }

  changePassword(event: Event): void {
    event.preventDefault();
    // Placeholder for change password functionality
    alert('Change password functionality will be implemented soon.');
  }

  viewAccountStatement(event: Event): void {
    event.preventDefault();
    // Placeholder for account statement functionality
    alert('Account statement functionality will be implemented soon.');
  }
}
