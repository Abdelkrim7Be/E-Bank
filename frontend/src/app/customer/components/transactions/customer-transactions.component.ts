import { Component, OnInit } from "@angular/core";
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
      error: (error) => {
        this.accountService.getTransactions(this.filter).subscribe({
          next: (response) => {
            this.pagedResponse = response;
            this.transactions = response.content || [];
            this.loading = false;
          },
          error: () => {
            this.loadDemoTransactions();
          },
        });
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
    // Placeholder for export functionality
    this.successMessage = "Export functionality will be implemented soon.";
    setTimeout(() => {
      this.successMessage = "";
    }, 3000);
  }

  viewTransactionDetails(transaction: Transaction): void {
    // Placeholder for transaction details modal
    alert(
      `Transaction Details:\n\nID: ${transaction.id}\nType: ${transaction.type}\nAmount: ${transaction.amount}\nDate: ${transaction.operationDate}\nStatus: ${transaction.status}`,
    );
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

  private loadDemoTransactions(): void {
    console.log("Loading demo transaction data...");

    // Create demo transactions
    const demoTransactions: Transaction[] = [
      {
        id: 1,
        accountId: "ACC-CA-001",
        type: TransactionType.DEPOSIT,
        amount: 1000,
        balance: 5000,
        description: "Initial Deposit",
        status: TransactionStatus.COMPLETED,
        operationDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        id: 2,
        accountId: "ACC-CA-001",
        type: TransactionType.WITHDRAWAL,
        amount: 200,
        balance: 4800,
        description: "ATM Withdrawal",
        status: TransactionStatus.COMPLETED,
        operationDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
      {
        id: 3,
        accountId: "ACC-CA-001",
        type: TransactionType.TRANSFER,
        amount: 500,
        balance: 4300,
        description: "Transfer to Savings",
        status: TransactionStatus.COMPLETED,
        operationDate: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      },
      {
        id: 4,
        accountId: "ACC-CA-001",
        type: TransactionType.DEPOSIT,
        amount: 2000,
        balance: 6300,
        description: "Salary Deposit",
        status: TransactionStatus.COMPLETED,
        operationDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      },
    ];

    // Create demo paged response
    this.pagedResponse = {
      content: demoTransactions,
      totalElements: demoTransactions.length,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
    };

    this.transactions = demoTransactions;
    this.error = "Showing demo data - API endpoints not available";
    this.loading = false;

    console.log("Demo transaction data loaded:", this.transactions);
  }
}
