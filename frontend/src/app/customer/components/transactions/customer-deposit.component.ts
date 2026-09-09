import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { BankingApiService } from '../../../core/services/banking-api.service';
import { AccountService } from '../../../shared/services/account.service';
import { BankAccount } from '../../../shared/models/account.model';
import { AuthService } from '../../../auth/services/auth.service';

interface CreditRequest {
  amount: number;
  description: string;
}

@Component({
  selector: 'app-customer-deposit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: "./customer-deposit.component.html",
  styleUrl: "./customer-deposit.component.css",
})
export class CustomerDepositComponent implements OnInit {
  creditForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  accounts: BankAccount[] = [];
  preSelectedAccountId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private bankingApiService: BankingApiService,
    private accountService: AccountService,
    private authService: AuthService
  ) {
    this.creditForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.preSelectedAccountId = this.route.snapshot.paramMap.get('accountId');
    this.loadCustomerAccounts();
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      accountId: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  private loadCustomerAccounts(): void {
    this.loading = true;
    this.errorMessage = '';

    console.log('🔍 Loading customer accounts...');
    console.log('🔍 Current user:', this.authService.getCurrentUser());
    console.log('🔍 Is authenticated:', this.authService.isAuthenticated());

    this.accountService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        console.log('✅ Received accounts:', accounts);
        console.log('✅ Number of accounts:', accounts?.length || 0);

        this.accounts = accounts.filter(
          (account) =>
            account.status === 'ACTIVATED' || account.status === 'CREATED'
        );

        console.log('✅ Filtered activated accounts:', this.accounts);
        console.log('✅ Number of activated accounts:', this.accounts.length);

        if (this.accounts.length === 0) {
          this.errorMessage =
            'No active accounts found. Please contact support to create an account.';
        }

        // Pre-select account if provided in route
        if (this.preSelectedAccountId && this.accounts.length > 0) {
          const account = this.accounts.find(
            (acc) => acc.id === this.preSelectedAccountId
          );
          if (account) {
            this.creditForm.patchValue({ accountId: account.id });
          }
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading customer accounts:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.error);

        if (error.status === 401) {
          this.errorMessage = 'Authentication failed. Please login again.';
        } else if (error.status === 403) {
          this.errorMessage = 'Access denied. Please check your permissions.';
        } else {
          this.errorMessage = 'Failed to load your accounts. Please try again.';
        }
        this.loading = false;
      },
    });
  }

  formatAccountDisplay(account: BankAccount): string {
    const accountType = this.formatAccountType(account.type || '');
    const balance = account.balance || 0;
    const maskedId = this.maskAccountNumber(account.id);
    return `${accountType} (${maskedId}) - ${balance.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })}`;
  }

  private formatAccountType(type: string): string {
    switch (type?.toUpperCase()) {
      case 'CURRENTACCOUNT':
        return 'Checking';
      case 'SAVINGACCOUNT':
        return 'Savings';
      default:
        return type || 'Account';
    }
  }

  private maskAccountNumber(accountId: string | number): string {
    const accountIdStr = accountId?.toString() || '';
    if (!accountIdStr || accountIdStr.length < 4) return '****';
    return '****' + accountIdStr.slice(-4);
  }

  getSelectedAccount(): BankAccount | undefined {
    const accountId = this.creditForm.get('accountId')?.value;
    return this.accounts.find((account) => account.id === accountId);
  }

  getNewBalance(): number {
    const selectedAccount = this.getSelectedAccount();
    const amount = this.creditForm.get('amount')?.value || 0;
    return selectedAccount ? selectedAccount.balance + amount : 0;
  }

  onSubmit(): void {
    if (this.creditForm.invalid) {
      this.creditForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const creditRequest: CreditRequest = {
      amount: this.creditForm.value.amount,
      description: this.creditForm.value.description,
    };

    this.bankingApiService
      .credit(
        this.creditForm.value.accountId,
        creditRequest.amount,
        creditRequest.description
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = `Credit completed successfully!`;
          this.creditForm.reset();

          // Redirect to accounts page after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/customer/accounts']);
          }, 3000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error.error?.message || 'Credit failed. Please try again.';
          console.error('Credit error:', error);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/customer/dashboard']);
  }

  // Getter methods for form controls
  get accountId() {
    return this.creditForm.get('accountId');
  }
  get amount() {
    return this.creditForm.get('amount');
  }
  get description() {
    return this.creditForm.get('description');
  }
}
