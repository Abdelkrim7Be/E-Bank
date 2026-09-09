import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import {
  AdminAccountService,
  BankAccount,
  AccountSearchParams,
} from "../../services/account.service";

@Component({
  selector: "app-admin-account-list",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./account-list.component.html",
  styleUrl: "./account-list.component.css",
})
export class AdminAccountListComponent implements OnInit {
  accounts: BankAccount[] = [];
  filteredAccounts: BankAccount[] = [];
  paginatedAccounts: BankAccount[] = [];
  loading = false;

  // Search and filter
  searchTerm = "";
  selectedStatus = "";
  selectedType = "";

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // Expose Math to template
  Math = Math;

  constructor(private accountService: AdminAccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    // Load all accounts; backend returns full list and does not filter by params
    this.accountService.getAccounts({ size: 10000 }).subscribe({
      next: (response) => {
        this.accounts = response.content || [];
        this.applyFiltersAndSort();
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading accounts:", err);
        this.accounts = [];
        this.filteredAccounts = [];
        this.paginatedAccounts = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
      },
    });
  }

  /** Apply client-side filter by search, status, type and sort by createDate desc (newest first). */
  applyFiltersAndSort(): void {
    let list = [...this.accounts];

    const term = (this.searchTerm || "").trim().toLowerCase();
    if (term) {
      list = list.filter((acc) => {
        const id = (acc.id || "").toString().toLowerCase();
        const custName = (acc.customerDTO?.name || "").toLowerCase();
        const custEmail = (acc.customerDTO?.email || "").toLowerCase();
        return (
          id.includes(term) ||
          custName.includes(term) ||
          custEmail.includes(term)
        );
      });
    }

    if (this.selectedStatus) {
      list = list.filter(
        (acc) => (acc.status || "").toUpperCase() === this.selectedStatus,
      );
    }

    if (this.selectedType) {
      const typeNorm = (this.selectedType || "").toUpperCase();
      list = list.filter((acc) => (acc.type || "").toUpperCase() === typeNorm);
    }

    // Sort by createDate desc (newest first)
    list.sort((a, b) => {
      const aDate = a.createDate ? new Date(a.createDate).getTime() : 0;
      const bDate = b.createDate ? new Date(b.createDate).getTime() : 0;
      return bDate - aDate;
    });

    this.filteredAccounts = list;
    this.totalElements = list.length;
    this.totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedAccounts = list.slice(start, start + this.pageSize);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  updateAccountStatus(account: BankAccount, status: string): void {
    if (confirm(`Change account status to ${status}?`)) {
      this.accountService.updateAccountStatus(account.id, status).subscribe({
        next: (updatedAccount) => {
          account.status = updatedAccount.status;
        },
        error: (err) => {
          console.error("Error updating account status:", err);
        },
      });
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFiltersAndSort();
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case "ACTIVATED":
        return "bg-success";
      case "SUSPENDED":
        return "bg-warning";
      case "CLOSED":
        return "bg-danger";
      case "CREATED":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  }

  refreshAccounts(): void {
    this.loadAccounts();
  }

  exportAccounts(): void {
    const params: AccountSearchParams = {
      search: this.searchTerm || undefined,
      status: this.selectedStatus || undefined,
    };

    this.accountService.exportAccounts(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "accounts.csv";
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error("Error exporting accounts:", err);
      },
    });
  }

  closeAccount(account: BankAccount): void {
    const confirmMessage = `Are you sure you want to close this account?

Account: ${account.id}
Customer: ${account.customerDTO?.name || "Unknown"}
Current Balance: ${account.balance}

⚠️ Warning: This action will:
• Set the account status to CLOSED
• Prevent all future transactions
• Allow the customer to be deleted if this is their only account

This action can be reversed by reactivating the account.`;

    if (confirm(confirmMessage)) {
      this.updateAccountStatus(account, "CLOSED");
    }
  }

  deleteAccount(account: BankAccount): void {
    if (account.status !== "CLOSED") {
      alert(
        "Account must be closed before it can be deleted. Please close the account first.",
      );
      return;
    }

    const confirmMessage = `⚠️ DANGER: Delete Account ${account.id}?

Customer: ${account.customerDTO?.name || "Unknown"}
Current Balance: ${account.balance}

This will PERMANENTLY DELETE the account and cannot be undone!

Are you absolutely sure you want to delete this account?`;

    if (confirm(confirmMessage)) {
      this.accountService.deleteAccount(account.id).subscribe({
        next: () => {
          alert("Account deleted successfully");
          this.loadAccounts(); // Refresh the list
        },
        error: (err: any) => {
          console.error("Error deleting account:", err);
          let errorMessage = "Failed to delete account. Please try again.";

          if (err.status === 400) {
            errorMessage =
              "Cannot delete account. It may have pending transactions or other dependencies.";
          } else if (err.status === 403) {
            errorMessage = "You do not have permission to delete this account.";
          }

          alert(errorMessage);
        },
      });
    }
  }
}
