import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { BankingApiService } from '../../../core/services/banking-api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AccountService } from '../../../shared/services/account.service';
import {
  CurrentBankAccountDTO,
  SavingBankAccountDTO,
} from '../../../shared/models/banking-dtos.model';

@Component({
  selector: 'app-customer-account-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: "./customer-account-form.component.html",
  styleUrl: "./customer-account-form.component.css",
})
export class CustomerAccountFormComponent implements OnInit {
  accountForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private bankingApiService: BankingApiService,
    private authService: AuthService,
    private accountService: AccountService
  ) {
    this.accountForm = this.initializeForm();
  }

  ngOnInit(): void {
    // Get customer information when component loads
    this.loadCustomerInfo();
  }

  private loadCustomerInfo(): void {
    // Use the account service to get customer accounts, which will give us the customer ID
    this.accountService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        console.log(
          '✅ [ACCOUNT CREATION] Customer accounts loaded:',
          accounts
        );
        console.log(
          '✅ [ACCOUNT CREATION] Number of accounts:',
          accounts?.length || 0
        );

        if (accounts && accounts.length > 0) {
          // Extract customer ID from the first account
          const firstAccount = accounts[0];
          console.log(
            '✅ [ACCOUNT CREATION] First account structure:',
            firstAccount
          );
          console.log(
            '✅ [ACCOUNT CREATION] Available properties:',
            Object.keys(firstAccount)
          );

          // Try to get customer ID from the account
          let foundCustomerId = null;
          if (firstAccount.customerDTO?.id) {
            foundCustomerId = firstAccount.customerDTO.id;
            console.log(
              '✅ [ACCOUNT CREATION] Found customerDTO.id:',
              foundCustomerId
            );
          } else if (firstAccount.customerId) {
            foundCustomerId = firstAccount.customerId;
            console.log(
              '✅ [ACCOUNT CREATION] Found customerId:',
              foundCustomerId
            );
          } else {
            // Let's check what customer-related fields exist
            console.log(
              '🔍 [ACCOUNT CREATION] Checking for customer fields...'
            );
            console.log(
              '🔍 [ACCOUNT CREATION] customerId:',
              firstAccount.customerId
            );
            console.log(
              '🔍 [ACCOUNT CREATION] customerDTO:',
              firstAccount.customerDTO
            );
            console.log(
              '🔍 [ACCOUNT CREATION] customerName:',
              firstAccount.customerName
            );

            // Check if there's any field that contains customer info
            Object.keys(firstAccount).forEach((key) => {
              if (key.toLowerCase().includes('customer')) {
                console.log(
                  `🔍 [ACCOUNT CREATION] Found customer field ${key}:`,
                  (firstAccount as any)[key]
                );
              }
            });
          }

          if (foundCustomerId) {
            console.log(
              '✅ [ACCOUNT CREATION] Storing customer ID:',
              foundCustomerId
            );
            // Store the customer ID for later use
            (this as any).customerIdFromAccounts = foundCustomerId;
          } else {
            console.log(
              '❌ [ACCOUNT CREATION] No customer ID found in account object'
            );
          }
        } else {
          console.log('❌ [ACCOUNT CREATION] No accounts found for customer');
        }
      },
      error: (error) => {
        console.error(
          '❌ [ACCOUNT CREATION] Error loading customer info:',
          error
        );
        // This is not critical, we'll try other methods during account creation
      },
    });
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      accountType: ['', [Validators.required]],
      initialBalance: [0, [Validators.required, Validators.min(0)]],
      overdraft: [0, [Validators.min(0)]],
      interestRate: [2.5, [Validators.min(0), Validators.max(10)]],
    });
  }

  getAccountTypeDisplay(): string {
    const type = this.accountForm.get('accountType')?.value;
    switch (type) {
      case 'CURRENT':
        return 'Checking Account';
      case 'SAVING':
        return 'Savings Account';
      default:
        return '';
    }
  }

  onSubmit(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const currentUser = this.authService.getCurrentUser();
    console.log('🔍 [ACCOUNT CREATION] Current user:', currentUser);

    if (!currentUser) {
      this.errorMessage = 'User not authenticated. Please login again.';
      this.loading = false;
      return;
    }

    // Get customer ID from the user object
    let customerId = currentUser.id;

    // If the user ID is 0 or undefined, try to get it from the customer relationship
    if (!customerId || customerId === 0) {
      console.log(
        '⚠️ [ACCOUNT CREATION] User ID is 0 or undefined, trying alternative methods'
      );

      // Try to get customer ID from existing accounts first
      if ((this as any).customerIdFromAccounts) {
        customerId = (this as any).customerIdFromAccounts;
        console.log(
          '✅ [ACCOUNT CREATION] Found customer ID from existing accounts:',
          customerId
        );
      } else {
        // If still no customer ID, show error
        this.errorMessage =
          'Customer information not found. Please contact support or try logging in again.';
        this.loading = false;
        return;
      }
    }

    console.log('✅ [ACCOUNT CREATION] Using customer ID:', customerId);

    const formValue = this.accountForm.value;
    const initialBalance = formValue.initialBalance;

    let createAccount$: Observable<
      CurrentBankAccountDTO | SavingBankAccountDTO
    >;
    if (formValue.accountType === 'CURRENT') {
      const overdraft = formValue.overdraft || 0;
      createAccount$ = this.bankingApiService.createCurrentAccount(
        initialBalance,
        overdraft,
        customerId
      );
    } else {
      const interestRate = formValue.interestRate || 2.5;
      createAccount$ = this.bankingApiService.createSavingAccount(
        initialBalance,
        interestRate,
        customerId
      );
    }

    createAccount$.subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = `${this.getAccountTypeDisplay()} created successfully!`;
        this.accountForm.reset();

        // Redirect to accounts page after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/customer/accounts']);
        }, 3000);
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message || 'Failed to create account. Please try again.';
        console.error('Account creation error:', error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/customer/accounts']);
  }

  // Getter methods for form controls
  get accountType() {
    return this.accountForm.get('accountType');
  }
  get initialBalance() {
    return this.accountForm.get('initialBalance');
  }
  get overdraft() {
    return this.accountForm.get('overdraft');
  }
  get interestRate() {
    return this.accountForm.get('interestRate');
  }
}
