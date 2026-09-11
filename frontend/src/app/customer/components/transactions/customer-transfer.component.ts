import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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

interface TransferRequest {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description: string;
}

@Component({
  selector: 'app-customer-transfer',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: "./customer-transfer.component.html",
  styleUrl: "./customer-transfer.component.css",
})
export class CustomerTransferComponent implements OnInit {
  transferForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  accounts: BankAccount[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private bankingApiService: BankingApiService,
    private accountService: AccountService,
    private authService: AuthService
  ) {
    this.transferForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCustomerAccounts();
  }

  private initializeForm(): FormGroup {
    const form = this.fb.group({
      fromAccountId: ['', [Validators.required]],
      toAccountId: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
    });

    form.get('amount')?.valueChanges.subscribe(() => {
      this.validateAmount();
    });

    form.get('fromAccountId')?.valueChanges.subscribe(() => {
      this.validateAmount();
      this.validateSameAccount();
    });

    form.get('toAccountId')?.valueChanges.subscribe(() => {
      this.validateSameAccount();
    });

    return form;
  }

  private validateAmount(): void {
    const amountControl = this.transferForm.get('amount');
    const fromAccountId = this.transferForm.get('fromAccountId')?.value;
    const amount = amountControl?.value;

    if (amountControl && fromAccountId && amount) {
      const selectedAccount = this.accounts.find(
        (acc) => acc.id === fromAccountId
      );
      if (selectedAccount && amount > selectedAccount.balance) {
        amountControl.setErrors({ insufficientFunds: true });
      } else if (amountControl.errors?.['insufficientFunds']) {
        const errors = { ...amountControl.errors };
        delete errors['insufficientFunds'];
        amountControl.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
  }

  private validateSameAccount(): void {
    const toAccountControl = this.transferForm.get('toAccountId');
    const fromAccountId = this.transferForm.get('fromAccountId')?.value;
    const toAccountId = toAccountControl?.value;

    if (
      toAccountControl &&
      fromAccountId &&
      toAccountId &&
      fromAccountId === toAccountId
    ) {
      toAccountControl.setErrors({ sameAccount: true });
    } else if (toAccountControl?.errors?.['sameAccount']) {
      const errors = { ...toAccountControl.errors };
      delete errors['sameAccount'];
      toAccountControl.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  private loadCustomerAccounts(): void {
    this.loading = true;
    this.errorMessage = '';

    console.log('🔍 [TRANSFER] Loading customer accounts...');
    console.log(
      '🔍 [TRANSFER] Current user:',
      this.authService.getCurrentUser()
    );
    console.log(
      '🔍 [TRANSFER] Is authenticated:',
      this.authService.isAuthenticated()
    );

    this.accountService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        console.log('✅ [TRANSFER] Received accounts:', accounts);
        console.log('✅ [TRANSFER] Number of accounts:', accounts?.length || 0);

        this.accounts = accounts.filter(
          (account) =>
            account.status === 'ACTIVATED' || account.status === 'CREATED'
        );

        console.log(
          '✅ [TRANSFER] Filtered activated accounts:',
          this.accounts
        );
        console.log(
          '✅ [TRANSFER] Number of activated accounts:',
          this.accounts.length
        );

        if (this.accounts.length === 0) {
          this.errorMessage =
            'No active accounts found. Please contact support to create an account.';
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ [TRANSFER] Error loading customer accounts:', error);
        console.error('❌ [TRANSFER] Error status:', error.status);
        console.error('❌ [TRANSFER] Error message:', error.message);
        console.error('❌ [TRANSFER] Error details:', error.error);

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
    const accountId = this.transferForm.get('fromAccountId')?.value;
    return this.accounts.find((account) => account.id === accountId);
  }

  getRemainingBalance(): number {
    const selectedAccount = this.getSelectedAccount();
    const amount = this.transferForm.get('amount')?.value || 0;
    return selectedAccount ? selectedAccount.balance - amount : 0;
  }

  hasInsufficientFunds(): boolean {
    return (
      this.transferForm.get('amount')?.errors?.['insufficientFunds'] || false
    );
  }

  reviewing = false;
  receiptId = '';

  onSubmit(): void {
    if (this.loading) return;
    if (this.transferForm.valid && !this.reviewing) {
      this.reviewing = true;
      return;
    }
    if (this.transferForm.invalid || this.hasInsufficientFunds()) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const transferRequest: TransferRequest = {
      sourceAccountId: this.transferForm.value.fromAccountId,
      destinationAccountId: this.transferForm.value.toAccountId,
      amount: this.transferForm.value.amount,
      description: this.transferForm.value.description,
    };

    this.bankingApiService.transfer(transferRequest).subscribe({
      next: (receipt) => {
        this.loading = false;
        this.successMessage = `Transfer completed successfully!`;
        this.transferForm.reset();

        this.receiptId = receipt.id;
        this.reviewing = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message || 'Transfer failed. Please try again.';
        console.error('Transfer error:', error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/customer/dashboard']);
  }

  get fromAccountId() {
    return this.transferForm.get('fromAccountId');
  }
  get toAccountId() {
    return this.transferForm.get('toAccountId');
  }
  get amount() {
    return this.transferForm.get('amount');
  }
  get description() {
    return this.transferForm.get('description');
  }
}
