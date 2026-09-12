import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { BankingApiService } from "../core/services/banking-api.service";
import {
  AccountSelectionDTO,
  TransferRequest,
} from "../shared/models/banking-dtos.model";

import { InlineAlertComponent } from "../shared/components/inline-alert/inline-alert.component";

@Component({
  selector: "app-transfer",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InlineAlertComponent],
  templateUrl: "./transfer.component.html",
  styleUrl: "./transfer.component.css",
})
export class TransferComponent implements OnInit {
  transferForm!: FormGroup;
  accounts: AccountSelectionDTO[] = [];
  loading = false;
  successMessage = "";
  errorMessage = "";

  constructor(
    private fb: FormBuilder,
    private bankingApiService: BankingApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadAccounts();
  }

  initializeForm(): void {
    this.transferForm = this.fb.group({
      fromAccountId: ["", [Validators.required]],
      toAccountId: ["", [Validators.required]],
      amount: ["", [Validators.required, Validators.min(0.01)]],
      description: ["", [Validators.required, Validators.minLength(3)]],
      reference: [""],
    });

    this.transferForm.get("amount")?.valueChanges.subscribe(() => {
      this.validateAmount();
    });

    this.transferForm.get("fromAccountId")?.valueChanges.subscribe(() => {
      this.validateAmount();
    });
  }

  validateAmount(): void {
    const amountControl = this.transferForm.get("amount");
    const fromAccountId = this.transferForm.get("fromAccountId")?.value;

    if (amountControl && fromAccountId) {
      const fromAccount = this.accounts.find(
        (acc) => acc.accountId == fromAccountId,
      );
      if (fromAccount && amountControl.value > fromAccount.balance) {
        amountControl.setErrors({ max: true });
      } else if (amountControl.errors?.["max"]) {
        delete amountControl.errors["max"];
        if (Object.keys(amountControl.errors).length === 0) {
          amountControl.setErrors(null);
        }
      }
    }
  }

  loadAccounts(): void {
    this.bankingApiService.getActiveAccountsForSelection().subscribe({
      next: (raw: any[]) => {
        console.log("Loaded accounts:", raw); // Debug log

        const mapped: AccountSelectionDTO[] = (raw || []).map((a) => ({
          accountId: a.id ?? a.accountId ?? "",
          customerUsername: a.customerName ?? a.customerDTO?.name ?? "",
          customerName: a.customerName ?? a.customerDTO?.name ?? "",
          accountType: a.type ?? a.accountType ?? "Account",
          balance: a.balance ?? 0,
          status: a.status ?? "CREATED",
        }));

        this.accounts = mapped.filter((acc) => acc.status === "ACTIVATED");
        console.log("Filtered active accounts:", this.accounts); // Debug log

        if (this.accounts.length === 0) {
          console.warn("No active accounts found, trying all accounts");
          this.loadAllAccounts();
        }
      },
      error: (error) => {
        console.error(
          "Error loading active accounts, trying all accounts:",
          error,
        );
        this.loadAllAccounts();
      },
    });
  }

  loadAllAccounts(): void {
    this.bankingApiService.getAccountsForSelection().subscribe({
      next: (raw: any[]) => {
        this.accounts = (raw || []).map((a) => ({
          accountId: a.id ?? a.accountId ?? "",
          customerUsername: a.customerName ?? a.customerDTO?.name ?? "",
          customerName: a.customerName ?? a.customerDTO?.name ?? "",
          accountType: a.type ?? a.accountType ?? "Account",
          balance: a.balance ?? 0,
          status: a.status ?? "CREATED",
        }));
        if (this.accounts.length === 0) {
          this.errorMessage = "No accounts available for transfer.";
        }
      },
      error: (error) => {
        this.errorMessage = "Failed to load accounts. Please try again.";
        console.error("Error loading all accounts:", error);
      },
    });
  }

  getAvailableToAccounts(): AccountSelectionDTO[] {
    const fromAccountId = this.transferForm.get("fromAccountId")?.value;
    return this.accounts.filter(
      (account) => account.accountId != fromAccountId,
    );
  }

  getSelectedFromAccount(): AccountSelectionDTO | undefined {
    const fromAccountId = this.transferForm.get("fromAccountId")?.value;
    return this.accounts.find((account) => account.accountId == fromAccountId);
  }

  getSelectedToAccount(): AccountSelectionDTO | undefined {
    const toAccountId = this.transferForm.get("toAccountId")?.value;
    return this.accounts.find((account) => account.accountId == toAccountId);
  }

  getAccountTypeDisplay(type: string): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  reviewing = false;
  receiptId = '';

  onSubmit(): void {
    if (this.loading) return;
    if (this.transferForm.valid && !this.reviewing) {
      this.reviewing = true;
      return;
    }
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    this.successMessage = "";

    const transferRequest: TransferRequest = {
      sourceAccountId: this.transferForm.value.fromAccountId,
      destinationAccountId: this.transferForm.value.toAccountId,
      amount: this.transferForm.value.amount,
      description: this.transferForm.value.description ?? "",
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
        const msg = error.error?.message || error.message;
        if (
          error.status === 404 ||
          (msg && msg.toLowerCase().includes("not found"))
        ) {
          this.errorMessage =
            "One or both accounts not found. They may have been deleted.";
        } else if (
          error.status === 400 ||
          (msg && msg.toLowerCase().includes("balance"))
        ) {
          this.errorMessage = msg || "Insufficient balance in source account.";
        } else {
          this.errorMessage = msg || "Transfer failed. Please try again.";
        }
        console.error("Transfer error:", error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(["/accounts"]);
  }

  get fromAccountId() {
    return this.transferForm.get("fromAccountId");
  }
  get toAccountId() {
    return this.transferForm.get("toAccountId");
  }
  get amount() {
    return this.transferForm.get("amount");
  }
  get description() {
    return this.transferForm.get("description");
  }
  get reference() {
    return this.transferForm.get("reference");
  }
}
