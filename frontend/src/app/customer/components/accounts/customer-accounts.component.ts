import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../shared/services/account.service';
import { BankAccount } from '../../../shared/models/account.model';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-customer-accounts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./customer-accounts.component.html",
  styleUrl: "./customer-accounts.component.css",
})
export class CustomerAccountsComponent implements OnInit {
  accounts: BankAccount[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private accountService: AccountService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.error = null;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    this.accountService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts || []; // Ensure it's always an array
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customer accounts:', error);
        this.error = 'Failed to load accounts. Please try again.';
        this.accounts = []; // Initialize empty array on error
        this.loading = false;
      },
    });
  }

  formatAccountType(type?: string): string {
    switch (type?.toUpperCase()) {
      case 'CURRENTACCOUNT':
        return 'Checking';
      case 'SAVINGACCOUNT':
        return 'Savings';
      default:
        return type || 'Unknown';
    }
  }

  maskAccountNumber(accountId: string | number): string {
    const accountIdStr = accountId?.toString() || '';
    if (!accountIdStr || accountIdStr.length < 4) return '****';
    return '****' + accountIdStr.slice(-4);
  }

  getAccountStatusBadge(status: string): string {
    const badges = {
      ACTIVATED: 'bg-success',
      SUSPENDED: 'bg-warning',
      CLOSED: 'bg-danger',
      PENDING: 'bg-info',
    };
    return badges[status as keyof typeof badges] || 'bg-secondary';
  }

  getTotalBalance(): number {
    return this.accounts.reduce(
      (total, account) => total + (account.balance || 0),
      0
    );
  }

  getActiveAccountsCount(): number {
    return this.accounts.filter((account) => account.status === 'ACTIVATED')
      .length;
  }

  getTotalOverdraft(): number {
    return this.accounts
      .filter((account) => account.type === 'CURRENTACCOUNT')
      .reduce((total, account) => total + (account.overDraft || 0), 0);
  }
}
