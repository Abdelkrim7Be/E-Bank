import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, ActivatedRoute } from "@angular/router";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";

import { AccountService } from "../../../shared/services/account.service";
import { AdminAccountService } from "../../services/account.service";
import { BankingApiService } from "../../../core/services/banking-api.service";
import {
  Transaction,
  TransactionType,
  TransactionFilter,
  PagedResponse,
  Account,
} from "../../../shared/models/account.model";
import { AccountSelectionDTO } from "../../../shared/models/banking-dtos.model";
import { LoaderComponent } from "../../../shared/components/loader/loader.component";
import { InlineAlertComponent } from "../../../shared/components/inline-alert/inline-alert.component";
import { AdminCustomerService } from "../../services/customer.service";

@Component({
  selector: "app-admin-transactions",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    LoaderComponent,
    InlineAlertComponent,
  ],
  templateUrl: "./admin-transactions.component.html",
  styleUrl: "./admin-transactions.component.css",
})
export class AdminTransactionsComponent implements OnInit {
  transactions: any[] = [];
  allTransactions: any[] = [];
  pagedResponse: PagedResponse<any> | null = null;
  loading = false;
  error = "";
  successMessage = "";
  errorMessage = "";
  accountsForSelection: AccountSelectionDTO[] = [];

  // Client-side pagination
  pageSize = 10;
  currentPage = 0;

  // Quick search & filters (header bar)
  searchTerm = "";
  selectedStatus = "";
  selectedType = "";

  // Operation modal
  currentOperation: "credit" | "debit" = "credit";
  operationLoading = false;
  operationForm: FormGroup;
  showModal = false;

  filter: TransactionFilter = {
    page: 0,
    size: 500,
    sortBy: "operationDate",
    sortDirection: "desc" as "desc",
  };

  Math = Math;

  private customerIdFilter: number | null = null;
  private customerAccountIds: Set<string> | null = null;

  constructor(
    private accountService: AccountService,
    private adminAccountService: AdminAccountService,
    private bankingApiService: BankingApiService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private adminCustomerService: AdminCustomerService,
  ) {
    this.operationForm = this.fb.group({
      accountId: ["", [Validators.required]],
      amount: ["", [Validators.required, Validators.min(0.01)]],
      description: ["", [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const customerIdParam = params.get("customerId");
      this.customerIdFilter = customerIdParam ? Number(customerIdParam) : null;
      if (this.customerIdFilter != null) {
        this.loadCustomerAccountIds(this.customerIdFilter);
      } else {
        this.customerAccountIds = null;
      }
      this.loadTransactions();
      this.loadAccounts();
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  private loadCustomerAccountIds(customerId: number): void {
    this.adminCustomerService.getCustomerAccounts(customerId).subscribe({
      next: (accounts) => {
        const ids =
          accounts?.map((a: any) => String(a.id ?? a.accountId ?? "").trim()) ??
          [];
        this.customerAccountIds = new Set(ids.filter((id) => !!id));
        this.applyFilters();
      },
      error: (err) => {
        console.error(
          "AdminTransactionsComponent.loadCustomerAccountIds() - Error:",
          err,
        );
        this.customerAccountIds = null;
      },
    });
  }

  loadAccounts(): void {
    this.bankingApiService.getAccountsForSelection().subscribe({
      next: (accounts: any[]) => {
        this.accountsForSelection = (accounts || []).map((a) => ({
          accountId: a.id ?? a.accountId ?? "",
          customerUsername: a.customerName ?? a.customerDTO?.name ?? "",
          customerName: a.customerName ?? a.customerDTO?.name ?? "",
          accountType: a.type ?? a.accountType ?? "Account",
          balance: a.balance ?? 0,
          status: (a.status ?? "ACTIVATED") as
            | "CREATED"
            | "ACTIVATED"
            | "SUSPENDED"
            | "BLOCKED",
        }));
      },
      error: (error) => {
        console.error("Error loading accounts for selection:", error);
      },
    });
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = "";

    const fetchFilter: TransactionFilter = {
      page: 0,
      size: 100,
      sortBy: this.filter.sortBy || "operationDate",
      sortDirection: (this.filter.sortDirection as "desc") || "desc",
    };

    this.accountService.getTransactions(fetchFilter).subscribe({
      next: (response) => {
        const raw = response.content ?? [];
        // Sort by operationDate desc so newest records appear first (before any filter)
        this.allTransactions = raw.slice().sort((a, b) => {
          const aDate = a.operationDate
            ? new Date(a.operationDate).getTime()
            : 0;
          const bDate = b.operationDate
            ? new Date(b.operationDate).getTime()
            : 0;
          return bDate - aDate;
        });
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(
          "AdminTransactionsComponent.loadTransactions() - Error:",
          err,
        );
        this.error =
          err.status === 500
            ? "Server error while loading transactions. Please try again."
            : err.status === 400
              ? "The transaction list request was invalid. Please refresh and try again."
              : "Failed to load transactions. Please try again.";
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    let list = [...this.allTransactions];

    // If we are in a specific customer context, keep only that customer's accounts
    if (this.customerAccountIds && this.customerAccountIds.size > 0) {
      list = list.filter((t) =>
        this.customerAccountIds!.has(
          String(t.accountId ?? t.bankAccountId ?? "").trim(),
        ),
      );
    }

    const accountId =
      this.filter.accountId != null && this.filter.accountId !== ""
        ? String(this.filter.accountId).trim()
        : "";
    if (accountId) {
      list = list.filter(
        (t) => (t.accountId ?? t.bankAccountId ?? "") === accountId,
      );
    }

    const typeFilter = (this.filter.type ?? "").toString().trim().toUpperCase();
    if (typeFilter) {
      list = list.filter((t) => {
        const tType = (t.type ?? "").toString().toUpperCase();
        if (typeFilter === "DEPOSIT")
          return tType === "DEPOSIT" || tType === "CREDIT";
        if (typeFilter === "WITHDRAWAL")
          return tType === "WITHDRAWAL" || tType === "DEBIT";
        return tType === typeFilter;
      });
    }

    const startDate = (this.filter.startDate ?? "").toString().trim();
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      list = list.filter((t) => {
        const d = t.operationDate ? new Date(t.operationDate) : null;
        return d && d >= start;
      });
    }

    const endDate = (this.filter.endDate ?? "").toString().trim();
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((t) => {
        const d = t.operationDate ? new Date(t.operationDate) : null;
        return d && d <= end;
      });
    }

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((t) => {
        const accountId = (t.accountId ?? t.bankAccountId ?? "")
          .toString()
          .toLowerCase();
        const accountNumber = (t.accountNumber ?? "").toString().toLowerCase();
        const description = (t.description ?? "").toString().toLowerCase();
        return (
          accountId.includes(term) ||
          accountNumber.includes(term) ||
          description.includes(term)
        );
      });
    }

    const statusFilter = this.selectedStatus.trim().toUpperCase();
    if (statusFilter) {
      list = list.filter(
        (t) => (t.status ?? "").toString().toUpperCase() === statusFilter,
      );
    }

    const quickTypeFilter = this.selectedType.trim().toUpperCase();
    if (quickTypeFilter) {
      list = list.filter((t) => {
        const tType = (t.type ?? "").toString().toUpperCase();
        if (quickTypeFilter === "DEPOSIT") {
          return tType === "DEPOSIT" || tType === "CREDIT";
        }
        if (quickTypeFilter === "WITHDRAWAL") {
          return tType === "WITHDRAWAL" || tType === "DEBIT";
        }
        return tType === quickTypeFilter;
      });
    }

    const totalElements = list.length;
    const size = Number(this.pageSize) || 20;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    if (this.currentPage >= totalPages)
      this.currentPage = Math.max(0, totalPages - 1);
    const start = this.currentPage * size;
    this.transactions = list.slice(start, start + size);

    this.pagedResponse = {
      content: this.transactions,
      totalElements,
      totalPages,
      size,
      number: this.currentPage,
      first: this.currentPage === 0,
      last: this.currentPage >= totalPages - 1,
    };
  }

  clearFilters(): void {
    this.filter.accountId = undefined;
    this.filter.type = undefined;
    this.filter.startDate = undefined;
    this.filter.endDate = undefined;
    this.currentPage = 0;
    this.applyFilters();
  }

  loadTransactionsWithoutFilters(): void {
    this.error = "";
    this.loadTransactions();
  }

  refreshTransactions(): void {
    this.loadTransactions();
  }

  showBackendTroubleshooting(): void {
    this.error = "Transactions are loaded from the gateway. If this persists, check the gateway and transaction-service health checks.";
  }

  goToPage(page: number): void {
    const totalPages = this.pagedResponse?.totalPages ?? 0;
    if (page >= 0 && page < totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  getStartRecord(): number {
    if (!this.pagedResponse) return 0;
    return this.pagedResponse.number * this.pagedResponse.size + 1;
  }

  getEndRecord(): number {
    if (!this.pagedResponse) return 0;
    const start = this.getStartRecord();
    const remaining = this.pagedResponse.totalElements - (start - 1);
    return start - 1 + Math.min(this.pagedResponse.size, remaining);
  }

  getVisiblePages(): (number | string)[] {
    if (!this.pagedResponse) return [];

    const totalPages = this.pagedResponse.totalPages;
    const currentPage = this.pagedResponse.number + 1; // Convert to 1-based
    const visiblePages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      // Always show first page
      visiblePages.push(1);

      if (currentPage > 4) {
        visiblePages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        visiblePages.push(i);
      }

      if (currentPage < totalPages - 3) {
        visiblePages.push("...");
      }

      // Always show last page
      if (totalPages > 1) {
        visiblePages.push(totalPages);
      }
    }

    return visiblePages;
  }

  changePageSize(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  jumpToPage(event: any): void {
    const target = event.target || event.currentTarget;
    const pageNumber = parseInt(
      target.value || target.previousElementSibling?.value,
      10,
    );

    if (
      pageNumber &&
      pageNumber >= 1 &&
      pageNumber <= (this.pagedResponse?.totalPages || 0)
    ) {
      this.goToPage(pageNumber - 1); // Convert to 0-based
    }
  }

  getPageNumbers(): number[] {
    if (!this.pagedResponse) return [];
    const totalPages = this.pagedResponse.totalPages;
    const currentPage = this.pagedResponse.number;
    const pages: number[] = [];

    // Show max 5 pages around current page
    const start = Math.max(0, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Banking Operations
  openOperationModal(operation: "credit" | "debit"): void {
    this.currentOperation = operation;
    this.operationForm.reset();
    this.errorMessage = "";
    this.successMessage = "";
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.operationForm.reset();
    this.errorMessage = "";
  }

  performOperation(): void {
    if (this.operationForm.invalid) return;

    const { accountId, amount, description } = this.operationForm.value;
    if (!accountId || String(accountId).trim() === "") {
      this.errorMessage = "Please select an account.";
      return;
    }

    this.operationLoading = true;
    this.errorMessage = "";

    let operation$;
    switch (this.currentOperation) {
      case "credit":
        operation$ = this.bankingApiService.credit(
          accountId,
          amount,
          description,
        );
        break;
      case "debit":
        operation$ = this.bankingApiService.debit(
          accountId,
          amount,
          description,
        );
        break;
    }

    operation$.subscribe({
      next: () => {
        this.operationLoading = false;
        this.successMessage = `${this.getOperationTitle()} completed successfully!`;

        // Close modal
        this.closeModal();

        // Reload transactions
        this.loadTransactions();
      },
      error: (error) => {
        this.operationLoading = false;
        const msg = error.error?.message || error.message;
        if (
          error.status === 404 ||
          (msg && msg.toLowerCase().includes("not found"))
        ) {
          this.errorMessage =
            msg ||
            "Account not found. It may have been deleted or the ID is invalid.";
        } else if (
          error.status === 400 ||
          (msg && msg.toLowerCase().includes("balance"))
        ) {
          this.errorMessage = msg || "Insufficient balance or invalid amount.";
        } else {
          this.errorMessage =
            msg || `${this.getOperationTitle()} failed. Please try again.`;
        }
        console.error("Operation error:", error);
      },
    });
  }

  getOperationTitle(): string {
    switch (this.currentOperation) {
      case "credit":
        return "Credit Account";
      case "debit":
        return "Debit Account";
      default:
        return "Banking Operation";
    }
  }

  getOperationButtonClass(): string {
    switch (this.currentOperation) {
      case "credit":
        return "btn-success";
      case "debit":
        return "btn-warning";
      default:
        return "btn-primary";
    }
  }

  // Helper methods for display
  getCustomerName(transaction: any): string {
    if (transaction.customerName) return transaction.customerName;
    if (transaction.customer && transaction.customer.username) {
      return transaction.customer.username;
    }
    if (transaction.customer && transaction.customer.name) {
      return transaction.customer.name;
    }
    const accountId = transaction.bankAccountId ?? transaction.accountId ?? "";
    const account = this.accountsForSelection.find(
      (acc) => acc.accountId === accountId,
    );
    if (account?.customerName) return account.customerName;
    if (account?.customerUsername) return account.customerUsername;
    if (
      transaction.performedBy === "system-demo" ||
      transaction.performedBy === "system"
    ) {
      return "Not available";
    }
    if (transaction.performedBy) return transaction.performedBy;
    return "Not available";
  }

  getAccountDisplayName(accountId: string): string {
    const account = this.accountsForSelection.find(
      (acc) => acc.accountId === accountId,
    );
    if (account) {
      const left = account.customerUsername || "";
      const right = account.customerName || "";
      const showRight =
        right &&
        right.trim().length > 0 &&
        right.trim().toLowerCase() !== left.trim().toLowerCase();
      const label = showRight ? `${left}: ${right}` : left || right || "";
      return `${label} (${account.accountType})`;
    }
    return `Account ${accountId}`;
  }

  getTransactionTypeBadge(type: string): string {
    switch (type?.toUpperCase()) {
      case "DEPOSIT":
      case "CREDIT":
        return "bg-success";
      case "WITHDRAWAL":
      case "DEBIT":
        return "bg-danger";
      case "TRANSFER":
        return "bg-primary";
      default:
        return "bg-secondary";
    }
  }

  getAmountClass(type: string): string {
    switch (type?.toUpperCase()) {
      case "DEPOSIT":
      case "CREDIT":
        return "text-success";
      case "WITHDRAWAL":
      case "DEBIT":
        return "text-danger";
      case "TRANSFER":
        return "text-primary";
      default:
        return "";
    }
  }
}
