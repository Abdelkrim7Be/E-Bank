import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AdminCustomerService } from "../../services/customer.service";
import { User, UserStatus } from "../../../auth/models/auth.model";

@Component({
  selector: "app-customer-list",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./customer-list.component.html",
  styleUrl: "./customer-list.component.css",
})
export class CustomerListComponent implements OnInit {
  customers: User[] = [];
  filteredCustomers: User[] = [];
  paginatedCustomers: User[] = [];

  searchTerm = "";
  selectedStatus = "";
  sortBy = "createdAt";
  sortOrder: "asc" | "desc" = "desc";

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(private customerService: AdminCustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getCustomers({ size: 10000 }).subscribe({
      next: (response) => {
        this.customers = response.content.map((customer) => ({
          ...customer,
          status: customer.enabled ? UserStatus.ACTIVE : UserStatus.INACTIVE,
          accountCount: 0,
          totalBalance: 0,
          selected: false,
        }));

        this.filterCustomers();
        this.totalPages = Math.ceil(
          this.filteredCustomers.length / this.pageSize,
        );
      },
      error: (err) => {
        console.error("Error loading customers:", err);
        this.customers = [];
        this.filteredCustomers = [];
        this.updatePagination();
      },
    });
  }

  private loadCustomerAccountInfo(): void {
    this.loadCustomerAccountInfoFor(this.paginatedCustomers);
  }

  private loadCustomerAccountInfoFor(customersToLoad: User[]): void {
    customersToLoad.forEach((customer) => {
      this.customerService.getCustomerAccounts(customer.id).subscribe({
        next: (accounts) => {
          customer.accountCount = accounts.length;
          customer.totalBalance = accounts.reduce(
            (sum, account) => sum + (account.balance || 0),
            0,
          );
        },
        error: (err) => {
          console.error(
            `Error loading accounts for customer ${customer.id}:`,
            err,
          );
          customer.accountCount = 0;
          customer.totalBalance = 0;
        },
      });
    });
  }

  filterCustomers(): void {
    this.filteredCustomers = this.customers.filter((customer) => {
      const searchLower = (this.searchTerm || "").trim().toLowerCase();
      const fullName = [
        (customer as any).firstName,
        (customer as any).lastName,
        (customer as any).name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !searchLower ||
        fullName.includes(searchLower) ||
        (customer.email || "").toLowerCase().includes(searchLower) ||
        (customer.username || "").toLowerCase().includes(searchLower);

      const matchesStatus =
        !this.selectedStatus || customer.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });

    this.sortCustomers();
  }

  sortCustomers(): void {
    this.filteredCustomers.sort((a, b) => {
      const aValue = a[this.sortBy as keyof User];
      const bValue = b[this.sortBy as keyof User];

      let comparison = 0;

      if (this.sortBy === "createdAt" || this.sortBy === "updatedAt") {
        const aDate = aValue ? new Date(aValue as string).getTime() : 0;
        const bDate = bValue ? new Date(bValue as string).getTime() : 0;
        comparison = aDate - bDate;
        if (comparison === 0 && (a.id != null || b.id != null)) {
          comparison = (a.id ?? 0) - (b.id ?? 0);
        }
      } else if (aValue == null && bValue == null) {
        comparison = 0;
      } else if (aValue == null) {
        comparison = -1;
      } else if (bValue == null) {
        comparison = 1;
      } else {
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        if (aStr < bStr) comparison = -1;
        else if (aStr > bStr) comparison = 1;
        else comparison = 0;
      }

      return this.sortOrder === "desc" ? -comparison : comparison;
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCustomers = this.filteredCustomers.slice(
      startIndex,
      endIndex,
    );
    this.loadCustomerAccountInfoFor(this.paginatedCustomers);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getStatusBadge(status: string): string {
    const badges = {
      ACTIVE: "bg-success",
      INACTIVE: "bg-warning",
      SUSPENDED: "bg-danger",
    };
    return badges[status as keyof typeof badges] || "bg-secondary";
  }

  toggleCustomerStatus(customer: any): void {
    const newEnabled = !customer.enabled;
    this.customerService
      .updateCustomerStatus(customer.id, newEnabled)
      .subscribe({
        next: (updatedCustomer) => {
          customer.enabled = updatedCustomer.enabled;
          customer.status = updatedCustomer.enabled
            ? UserStatus.ACTIVE
            : UserStatus.INACTIVE;
        },
        error: (err) => {
          console.error("Error updating customer status:", err);
        },
      });
  }

  deleteCustomer(customer: User): void {
    const customerName =
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
      customer.username;

    if (
      confirm(
        `Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`,
      )
    ) {
      this.customerService.deleteCustomer(customer.id).subscribe({
        next: () => {
          this.customers = this.customers.filter((c) => c.id !== customer.id);
          this.filterCustomers();
        },
        error: (err) => {
          console.error("Error deleting customer:", err);
          if (err.status === 400) {
            alert(
              "Cannot delete customer with existing accounts. Please close all accounts first.",
            );
          } else {
            alert("Failed to delete customer. Please try again.");
          }
        },
      });
    }
  }

  refreshCustomers(): void {
    this.loadCustomers();
  }

  exportCustomers(): void {
    console.log("Exporting customers...");
    this.customerService
      .exportCustomers({
        search: this.searchTerm,
        status: this.selectedStatus as UserStatus,
        sortBy: this.sortBy,
        sortOrder: this.sortOrder,
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `customers-${
            new Date().toISOString().split("T")[0]
          }.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error("Error exporting customers:", err);
        },
      });
  }

  trackByCustomerId(index: number, customer: User): number {
    return customer.id;
  }
}
