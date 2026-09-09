import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../shared/services/account.service';
import {
  BankAccount,
  Transaction,
  TransactionFilter,
} from '../../../shared/models/account.model';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-customer-account-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./customer-account-details.component.html",
  styleUrl: "./customer-account-details.component.css",
})
export class CustomerAccountDetailsComponent implements OnInit {
  account: BankAccount | null = null;
  transactions: Transaction[] = [];
  loading = true;
  transactionsLoading = false;
  error: string | null = null;
  transactionsError: string | null = null;
  accountId: string | null = null;

  transactionFilter: TransactionFilter = {
    page: 0,
    size: 10,
    sortBy: 'operationDate',
    sortDirection: 'desc' as 'desc',
  };

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id');
    if (this.accountId) {
      this.transactionFilter.accountId = this.accountId;
      this.loadAccountDetails();
      this.loadTransactions();
    } else {
      this.error = 'Account ID not provided';
      this.loading = false;
    }
  }

  loadAccountDetails(): void {
    if (!this.accountId) return;

    this.loading = true;
    this.error = null;

    this.accountService.getAccountById(this.accountId).subscribe({
      next: (account) => {
        this.account = account;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading account details:', error);
        this.error = 'Failed to load account details. Please try again.';
        this.loading = false;
      },
    });
  }

  loadTransactions(): void {
    if (!this.accountId) return;

    this.transactionsLoading = true;
    this.transactionsError = null;

    // Try customer-specific method first, then fallback
    this.accountService
      .getCustomerTransactions(this.transactionFilter)
      .subscribe({
        next: (response) => {
          this.transactions = response.content || [];
          this.transactionsLoading = false;
        },
        error: (error) => {
          console.error(
            'Error loading transactions with customer method, trying general method:',
            error
          );

          // Fallback to general method
          this.accountService
            .getTransactions(this.transactionFilter)
            .subscribe({
              next: (response) => {
                this.transactions = response.content || [];
                this.transactionsLoading = false;
              },
              error: (generalError) => {
                console.error(
                  'Error loading transactions (all methods failed):',
                  generalError
                );
                this.transactionsError = 'Failed to load transactions.';
                this.transactions = []; // Initialize empty array on error
                this.transactionsLoading = false;
              },
            });
        },
      });
  }

  formatAccountType(type?: string): string {
    switch (type?.toUpperCase()) {
      case 'CURRENTACCOUNT':
        return 'Checking Account';
      case 'SAVINGACCOUNT':
        return 'Savings Account';
      default:
        return type || 'Unknown Account';
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

  getTransactionIcon(type: string): string {
    const icons = {
      DEPOSIT: 'bi-arrow-down-circle deposit',
      WITHDRAWAL: 'bi-arrow-up-circle withdrawal',
      TRANSFER: 'bi-arrow-left-right transfer',
    };
    return icons[type as keyof typeof icons] || 'bi-circle';
  }

  getTransactionDescription(type: string): string {
    const descriptions = {
      DEPOSIT: 'Money Added',
      WITHDRAWAL: 'Money Withdrawn',
      TRANSFER: 'Money Transferred',
    };
    return descriptions[type as keyof typeof descriptions] || 'Transaction';
  }

  getAmountClass(type: string): string {
    return type === 'WITHDRAWAL' ? 'text-danger' : 'text-success';
  }

  getAmountPrefix(type: string): string {
    return type === 'WITHDRAWAL' ? '-' : '+';
  }

  getTransactionStatusBadge(status: string): string {
    const badges = {
      COMPLETED: 'bg-success',
      PENDING: 'bg-warning',
      FAILED: 'bg-danger',
    };
    return badges[status as keyof typeof badges] || 'bg-secondary';
  }
}
