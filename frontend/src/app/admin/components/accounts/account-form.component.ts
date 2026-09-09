import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { AdminCustomerService } from "../../services/customer.service";
import {
  AdminAccountService,
  CreateAccountRequest,
  BankAccount,
} from "../../services/account.service";
import { User } from "../../../auth/models/auth.model";

@Component({
  selector: "app-admin-account-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./account-form.component.html",
  styleUrl: "./account-form.component.css",
})
export class AdminAccountFormComponent implements OnInit {
  accountForm!: FormGroup;
  customers: User[] = [];
  loading = false;
  submitting = false;
  error: string | null = null;
  success: string | null = null;
  isEditMode = false;
  accountId: string | null = null;
  currentAccount: BankAccount | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private customerService: AdminCustomerService,
    private accountService: AdminAccountService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
    this.loadCustomers();
  }

  private initForm(): void {
    this.accountForm = this.fb.group({
      customerId: ["", [Validators.required]],
      accountType: ["", [Validators.required]],
      initialBalance: [0, [Validators.required, Validators.min(0)]],
      overdraft: [0],
      interestRate: [0],
      description: [""],
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.isEditMode = true;
      this.accountId = id;
      this.loadAccount();
    }
  }

  private loadAccount(): void {
    if (!this.accountId) return;

    this.loading = true;
    this.accountService.getAccountById(this.accountId).subscribe({
      next: (account) => {
        this.currentAccount = account;
        this.populateForm(account);
        this.loading = false;
      },
      error: (err) => {
        this.error = "Failed to load account details";
        console.error("Error loading account:", err);
        this.loading = false;
      },
    });
  }

  private populateForm(account: BankAccount): void {
    this.accountForm.patchValue({
      customerId: account.customerDTO?.id ?? account.customerId ?? "",
      accountType: account.type,
      initialBalance: account.balance,
      overdraft: account.overDraft ?? 0,
      interestRate: account.interestRate ?? 0,
      description: "",
    });

    // Disable customer selection in edit mode
    this.accountForm.get("customerId")?.disable();
    this.accountForm.get("accountType")?.disable();
  }

  private loadCustomers(): void {
    this.loading = true;
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.customers = response.content || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = "Failed to load customers";
        console.error("Error loading customers:", err);
        this.loading = false;
      },
    });
  }

  onAccountTypeChange(): void {
    const accountType = this.accountForm.get("accountType")?.value;

    if (accountType === "CURRENT") {
      this.accountForm.get("overdraft")?.setValidators([Validators.min(0)]);
      this.accountForm.get("interestRate")?.clearValidators();
    } else if (accountType === "SAVING") {
      this.accountForm
        .get("interestRate")
        ?.setValidators([Validators.min(0), Validators.max(100)]);
      this.accountForm.get("overdraft")?.clearValidators();
    }

    this.accountForm.get("overdraft")?.updateValueAndValidity();
    this.accountForm.get("interestRate")?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const formData = this.accountForm.value;

    const accountRequest: CreateAccountRequest = {
      customerId: formData.customerId,
      accountType: formData.accountType,
      initialBalance: formData.initialBalance,
      overdraft: formData.overdraft || 0,
      interestRate: formData.interestRate || 0,
      description: formData.description,
    };

    console.log("AccountFormComponent.onSubmit() - Form data:", formData);
    console.log(
      "AccountFormComponent.onSubmit() - Account request:",
      accountRequest,
    );
    console.log(
      "AccountFormComponent.onSubmit() - Current user:",
      localStorage.getItem("current_user"),
    );
    console.log(
      "AccountFormComponent.onSubmit() - Token:",
      localStorage.getItem("digital-banking-token"),
    );

    if (this.isEditMode && this.accountId) {
      // Update existing account (limited functionality)
      this.accountService
        .updateAccountStatus(this.accountId, "ACTIVATED")
        .subscribe({
          next: () => {
            this.success = "Account updated successfully!";
            this.submitting = false;
            setTimeout(() => {
              this.router.navigate(["/admin/accounts"]);
            }, 1500);
          },
          error: (err) => {
            this.error = "Failed to update account. Please try again.";
            console.error("Error updating account:", err);
            this.submitting = false;
          },
        });
    } else {
      // Create new account
      this.accountService.createAccount(accountRequest).subscribe({
        next: () => {
          this.success = "Bank account created successfully!";
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(["/admin/accounts"]);
          }, 1500);
        },
        error: (err) => {
          this.error = "Failed to create account. Please try again.";
          console.error(
            "AccountFormComponent.onSubmit() - Error creating account:",
            err,
          );
          console.error("AccountFormComponent.onSubmit() - Error details:", {
            status: err.status,
            statusText: err.statusText,
            url: err.url,
            message: err.message,
            error: err.error,
          });
          this.submitting = false;
        },
      });
    }
  }
}
