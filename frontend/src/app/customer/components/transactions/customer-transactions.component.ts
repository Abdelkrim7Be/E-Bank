import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AccountService } from "../../../shared/services/account.service";
import {
  Transaction,
  TransactionFilter,
  PagedResponse,
  TransactionType,
  TransactionStatus,
  BankAccount,
} from "../../../shared/models/account.model";
import { AuthService } from "../../../auth/services/auth.service";

@Component({
  selector: "app-customer-transactions",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./customer-transactions.component.html",
  styleUrl: "./customer-transactions.component.css",
})
export class CustomerTransactionsComponent implements OnInit {
  @ViewChild("details") details!: ElementRef<HTMLDialogElement>;
  selectedTransaction: Transaction | null = null;
  audit: any = null;
  auditLoading = false;
  transactions: Transaction[] = [];
  pagedResponse: PagedResponse<Transaction> | null = null;
  loading = true;
  error: string | null = null;
  successMessage = "";
  customerAccounts: BankAccount[] = [];

  filter: TransactionFilter = {
    page: 0,
    size: 20,
    sortBy: "operationDate",
    sortDirection: "desc" as "desc",
  };

  constructor(
    private accountService: AccountService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadCustomerAccounts();
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = null;
    this.accountService.getCustomerTransactions(this.filter).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        this.transactions = response.content || [];
        this.loading = false;
      },
      error: () => {
        this.error = "Your transactions could not be loaded. Please try again.";
        this.transactions = [];
        this.pagedResponse = null;
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.filter.page = 0; // Reset to first page when applying filters
    this.loadTransactions();
  }

  clearFilters(): void {
    this.filter = {
      page: 0,
      size: 20,
      sortBy: "operationDate",
      sortDirection: "desc" as "desc",
    };
    this.loadTransactions();
  }

  toggleSortDirection(): void {
    this.filter.sortDirection =
      this.filter.sortDirection === "asc" ? "desc" : "asc";
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < (this.pagedResponse?.totalPages || 0)) {
      this.filter.page = page;
      this.loadTransactions();
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
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      visiblePages.push(1);

      if (currentPage > 4) {
        visiblePages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        visiblePages.push(i);
      }

      if (currentPage < totalPages - 3) {
        visiblePages.push("...");
      }

      if (totalPages > 1) {
        visiblePages.push(totalPages);
      }
    }

    return visiblePages;
  }

  changePageSize(): void {
    this.filter.page = 0; // Reset to first page when changing page size
    this.loadTransactions();
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

  exportTransactions(): void {
    if (!this.transactions.length) return;
    const cell = (value: unknown) => {
      let text = String(value ?? "");
      if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const rows = [["ID", "Account", "Type", "Amount", "Date", "Description"],
      ...this.transactions.map(t => [t.id, t.accountId, t.type, t.amount, t.operationDate, t.description])];
    const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'e-bank-transactions-page.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  viewTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.audit = null;
    this.details.nativeElement.showModal();
  }

  loadAuditTrail(requestId: string): void {
    this.auditLoading = true;
    this.accountService.getTransactionAudit(requestId).subscribe({
      next: (result) => {
        this.audit = result;
        this.auditLoading = false;
      },
      error: () => {
        this.auditLoading = false;
      },
    });
  }

  getTransactionTypeBadge(type: string): string {
    const badges = {
      DEPOSIT: "bg-success",
      WITHDRAWAL: "bg-warning",
      TRANSFER: "bg-primary",
    };
    return badges[type as keyof typeof badges] || "bg-secondary";
  }

  getTransactionTypeIcon(type: string): string {
    const icons = {
      DEPOSIT: "bi-arrow-down-circle",
      WITHDRAWAL: "bi-arrow-up-circle",
      TRANSFER: "bi-arrow-left-right",
    };
    return icons[type as keyof typeof icons] || "bi-circle";
  }

  getTransactionDescription(type: string): string {
    const descriptions = {
      DEPOSIT: "Money Added",
      WITHDRAWAL: "Money Withdrawn",
      TRANSFER: "Money Transferred",
    };
    return descriptions[type as keyof typeof descriptions] || "Transaction";
  }

  getAmountClass(type: string): string {
    return type === "WITHDRAWAL" ? "text-danger" : "text-success";
  }

  getAmountPrefix(type: string): string {
    return type === "WITHDRAWAL" ? "-" : "+";
  }

  getTransactionStatusBadge(status: string): string {
    const badges = {
      COMPLETED: "bg-success",
      PENDING: "bg-warning",
      FAILED: "bg-danger",
    };
    return badges[status as keyof typeof badges] || "bg-secondary";
  }

  getAccountIdSuffix(accountId: string | number): string {
    const accountIdStr = accountId.toString();
    return accountIdStr.length >= 4 ? accountIdStr.slice(-4) : accountIdStr;
  }

  private loadCustomerAccounts(): void {
    this.accountService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.customerAccounts = accounts || [];
      },
      error: (error) => {
        console.error("Failed to load customer accounts for filters:", error);
      },
    });
  }

}
