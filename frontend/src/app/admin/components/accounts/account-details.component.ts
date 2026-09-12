import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  AdminAccountService,
  BankAccount,
} from '../../services/account.service';

@Component({
  selector: 'app-admin-account-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./account-details.component.html",
  styleUrl: "./account-details.component.css",
})
export class AdminAccountDetailsComponent implements OnInit {
  account: BankAccount | null = null;
  loading = false;
  error: string | null = null;
  accountId: string | null = null;
  dropdownOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AdminAccountService
  ) {}

  ngOnInit(): void {
    this.loadAccountDetails();
  }

  private loadAccountDetails(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid account ID';
      return;
    }

    this.accountId = id;
    this.loading = true;

    this.accountService.getAccountById(this.accountId).subscribe({
      next: (account) => {
        this.account = account;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load account details';
        console.error('Error loading account:', err);
        this.loading = false;
      },
    });
  }

  editAccount(): void {
    if (this.account) {
      this.router.navigate(['/admin/accounts', this.account.id, 'edit']);
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  updateAccountStatus(status: string): void {
    if (!this.account || !this.accountId) return;

    if (confirm(`Change account status to ${status}?`)) {
      this.accountService
        .updateAccountStatus(this.accountId, status)
        .subscribe({
          next: (updatedAccount) => {
            if (this.account) {
              this.account.status = updatedAccount.status;
            }
          },
          error: (err) => {
            console.error('Error updating account status:', err);
            console.error('Error details:', {
              status: err.status,
              statusText: err.statusText,
              url: err.url,
              error: err.error,
            });

            if (err.error && err.error.errors) {
              console.error('Validation errors:', err.error.errors);
            }

            let errorMessage =
              'Failed to update account status. Please try again.';

            if (err.status === 0) {
              errorMessage =
                'Connection error. The backend server may not be running or there may be a CORS issue. Please check the server status.';
            } else if (err.status === 400) {
              if (err.error && err.error.errors) {
                const validationErrors = err.error.errors;
                let errorMessages: string[] = [];

                Object.keys(validationErrors).forEach((field) => {
                  const fieldErrors = validationErrors[field];
                  if (Array.isArray(fieldErrors)) {
                    fieldErrors.forEach((error) => {
                      errorMessages.push(
                        `• ${this.formatFieldName(field)}: ${error}`
                      );
                    });
                  } else {
                    errorMessages.push(
                      `• ${this.formatFieldName(field)}: ${fieldErrors}`
                    );
                  }
                });

                if (errorMessages.length > 0) {
                  errorMessage = `Validation errors:\n${errorMessages.join(
                    '\n'
                  )}`;
                } else {
                  errorMessage =
                    err.error.message ||
                    'Invalid request. Please check the account data.';
                }
              } else if (err.error && err.error.message) {
                errorMessage = `Bad request: ${err.error.message}`;
              } else {
                errorMessage =
                  'Invalid request. Please check the account data.';
              }
            } else if (err.status === 403) {
              errorMessage =
                'You do not have permission to update account status.';
            } else if (err.status === 404) {
              errorMessage = 'Account not found or endpoint not available.';
            } else if (err.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            }

            if (err.userMessage) {
              errorMessage = err.userMessage;
            }

            alert(errorMessage);
          },
        });
    }
  }

  getAccountTypeBadge(type: string): string {
    switch (type?.toLowerCase()) {
      case 'currentaccount':
        return 'bg-primary';
      case 'savingaccount':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVATED':
        return 'bg-success';
      case 'SUSPENDED':
        return 'bg-warning';
      case 'CLOSED':
        return 'bg-danger';
      case 'CREATED':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  closeAccount(): void {
    if (!this.account || !this.accountId) return;

    const confirmMessage = `Are you sure you want to close this account?

Account: ${this.account.id}
Current Balance: ${this.account.balance}

⚠️ Warning: This action will:
• Set the account status to CLOSED
• Prevent all future transactions
• Allow the customer to be deleted

This action can be reversed by reactivating the account.`;

    if (confirm(confirmMessage)) {
      this.updateAccountStatus('CLOSED');
    }
  }

  deleteAccount(): void {
    if (!this.account || !this.accountId) return;

    if (this.account.status !== 'CLOSED') {
      alert(
        'Account must be closed before it can be deleted. Please close the account first.'
      );
      return;
    }

    const confirmMessage = `⚠️ DANGER: Delete Account ${this.account.id}?

This will PERMANENTLY DELETE the account and cannot be undone!

Current Balance: ${this.account.balance}

Are you absolutely sure you want to delete this account?`;

    if (confirm(confirmMessage)) {
      this.accountService.deleteAccount(this.accountId).subscribe({
        next: () => {
          alert('Account deleted successfully');
          this.router.navigate(['/admin/accounts']);
        },
        error: (err: any) => {
          console.error('Error deleting account:', err);
          let errorMessage = 'Failed to delete account. Please try again.';

          if (err.status === 400) {
            errorMessage =
              'Cannot delete account. It may have pending transactions or other dependencies.';
          } else if (err.status === 403) {
            errorMessage = 'You do not have permission to delete this account.';
          }

          alert(errorMessage);
        },
      });
    }
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
