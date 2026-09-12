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

interface DebitRequest {
  amount: number;
  description: string;
}

@Component({
  selector: 'app-customer-debit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: "./customer-debit.component.html",
  styleUrl: "./customer-debit.component.css",
})
export class CustomerDebitComponent implements OnInit {
  debitForm: FormGroup;
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
    this.debitForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.preSelectedAccountId = this.route.snapshot.paramMap.get('accountId');
    this.loadCustomerAccounts();
  }

  private initializeForm(): FormGroup {
    const form = this.fb.group({
      accountId: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
    });

    form.get('amount')?.valueChanges.subscribe(() => {
      this.validateAmount();
    });

    form.get('accountId')?.valueChanges.subscribe(() => {
      this.validateAmount();
    });

    return form;
  }

  private validateAmount(): void {
    const amountControl = this.debitForm.get('amount');
    const accountId = this.debitForm.get('accountId')?.value;
    const amount = amountControl?.value;

    if (amountControl && accountId && amount) {
      const selectedAccount = this.accounts.find((acc) => acc.id === accountId);
      if (selectedAccount && amount > selectedAccount.balance) {
        amountControl.setErrors({ insufficientFunds: true });
      } else if (amountControl.errors?.['insufficientFunds']) {
        const errors = { ...amountControl.errors };
        delete errors['insufficientFunds'];
        amountControl.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
  }

  private loadCustomerAccounts(): void {
    this.loading = true;
    this.errorMessage = '';

    console.log('🔍 [DEBIT] Loading customer accounts...');
    console.log('🔍 [DEBIT] Current user:', this.authService.getCurrentUser());
    console.log(
      '🔍 [DEBIT] Is authenticated:',
      this.authService.isAuthenticated()
    );

    this.accountService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        console.log('✅ [DEBIT] Received accounts:', accounts);
        console.log('✅ [DEBIT] Number of accounts:', accounts?.length || 0);

        this.accounts = accounts.filter(
          (account) =>
            account.status === 'ACTIVATED' || account.status === 'CREATED'
        );

        console.log('✅ [DEBIT] Filtered activated accounts:', this.accounts);
        console.log(
          '✅ [DEBIT] Number of activated accounts:',
          this.accounts.length
        );

        if (this.accounts.length === 0) {
          this.errorMessage =
            'No active accounts found. Please contact support to create an account.';
        }

        if (this.preSelectedAccountId && this.accounts.length > 0) {
          const account = this.accounts.find(
            (acc) => acc.id === this.preSelectedAccountId
          );
          if (account) {
            this.debitForm.patchValue({ accountId: account.id });
          }
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ [DEBIT] Error loading customer accounts:', error);
        console.error('❌ [DEBIT] Error status:', error.status);
        console.error('❌ [DEBIT] Error message:', error.message);
        console.error('❌ [DEBIT] Error details:', error.error);

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
    const accountId = this.debitForm.get('accountId')?.value;
    return this.accounts.find((account) => account.id === accountId);
  }

  getRemainingBalance(): number {
    const selectedAccount = this.getSelectedAccount();
    const amount = this.debitForm.get('amount')?.value || 0;
    return selectedAccount ? selectedAccount.balance - amount : 0;
  }

  hasInsufficientFunds(): boolean {
    return this.debitForm.get('amount')?.errors?.['insufficientFunds'] || false;
  }

  onSubmit(): void {
    if (this.debitForm.invalid || this.hasInsufficientFunds()) {
      this.debitForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const debitRequest: DebitRequest = {
      amount: this.debitForm.value.amount,
      description: this.debitForm.value.description,
    };

    this.bankingApiService
      .debit(
        this.debitForm.value.accountId,
        debitRequest.amount,
        debitRequest.description
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = `Debit completed successfully!`;
          this.debitForm.reset();

          setTimeout(() => {
            this.router.navigate(['/customer/accounts']);
          }, 3000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error.error?.message || 'Debit failed. Please try again.';
          console.error('Debit error:', error);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/customer/dashboard']);
  }

  get accountId() {
    return this.debitForm.get('accountId');
  }
  get amount() {
    return this.debitForm.get('amount');
  }
  get description() {
    return this.debitForm.get('description');
  }
}
