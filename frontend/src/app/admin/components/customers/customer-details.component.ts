import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { AdminCustomerService } from "../../services/customer.service";
import { User } from "../../../auth/models/auth.model";

@Component({
  selector: "app-admin-customer-details",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./customer-details.component.html",
  styleUrl: "./customer-details.component.css",
})
export class AdminCustomerDetailsComponent implements OnInit {
  customer: User | null = null;
  accounts: any[] = [];
  loading = false;
  error: string | null = null;
  customerId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: AdminCustomerService,
  ) {}

  ngOnInit(): void {
    this.loadCustomerDetails();
  }

  private loadCustomerDetails(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.error = "Invalid customer ID";
      return;
    }

    this.customerId = parseInt(id, 10);
    this.loading = true;
    this.error = null;

    console.log("Loading customer details for ID:", this.customerId);

    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (customer) => {
        console.log("Customer details loaded successfully:", customer);
        this.customer = {
          ...customer,
          accountCount: 0,
          totalBalance: 0,
        };
        this.loadCustomerAccounts();
      },
      error: (err) => {
        console.error("Error loading customer details:", err);

        let errorMessage = "Failed to load customer details";

        if (err.status === 0) {
          errorMessage =
            "Unable to connect to server. Please check your connection.";
        } else if (err.status === 404) {
          errorMessage = "Customer not found.";
        } else if (err.status === 403) {
          errorMessage = "You do not have permission to view this customer.";
        } else if (err.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.message && err.message.includes("parsing")) {
          errorMessage =
            "Server returned invalid data. The customer service will attempt to fix this automatically.";
        }

        this.error = errorMessage;
        this.loading = false;
      },
    });
  }

  private loadCustomerAccounts(): void {
    if (!this.customerId) return;

    this.customerService.getCustomerAccounts(this.customerId).subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        if (this.customer) {
          this.customer.accountCount = accounts.length;
          this.customer.totalBalance = accounts.reduce(
            (sum, account) => sum + (account.balance || 0),
            0,
          );
        }
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading customer accounts:", err);
        this.accounts = [];
        this.loading = false;
      },
    });
  }

  deleteCustomer(): void {
    if (!this.customer || !this.customerId) return;

    const customerName =
      `${this.customer.firstName || ""} ${
        this.customer.lastName || ""
      }`.trim() || this.customer.username;

    if (
      confirm(
        `Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`,
      )
    ) {
      this.customerService.deleteCustomer(this.customerId).subscribe({
        next: () => {
          alert("Customer deleted successfully");
          this.router.navigate(["/admin/customers"]);
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

  toggleCustomerStatus(): void {
    if (!this.customer || !this.customerId) return;

    const newEnabled = !this.customer.enabled;
    this.customerService
      .updateCustomerStatus(this.customerId, newEnabled)
      .subscribe({
        next: (updatedCustomer) => {
          if (this.customer) {
            this.customer.enabled = updatedCustomer.enabled;
          }
        },
        error: (err) => {
          console.error("Error updating customer status:", err);
          console.error("Error details:", {
            status: err.status,
            statusText: err.statusText,
            url: err.url,
            error: err.error,
          });

          if (err.error && err.error.errors) {
            console.error("Validation errors:", err.error.errors);
          }

          let errorMessage =
            "Failed to update customer status. Please try again.";

          if (err.status === 0) {
            errorMessage =
              "Connection error. The backend server may not be running or there may be a CORS issue. Please check the server status.";
          } else if (err.status === 400) {
            if (err.error && err.error.errors) {
              const validationErrors = err.error.errors;
              let errorMessages: string[] = [];

              Object.keys(validationErrors).forEach((field) => {
                const fieldErrors = validationErrors[field];
                if (Array.isArray(fieldErrors)) {
                  fieldErrors.forEach((error) => {
                    errorMessages.push(
                      `• ${this.formatFieldName(field)}: ${error}`,
                    );
                  });
                } else {
                  errorMessages.push(
                    `• ${this.formatFieldName(field)}: ${fieldErrors}`,
                  );
                }
              });

              if (errorMessages.length > 0) {
                errorMessage = `Validation errors:\n${errorMessages.join(
                  "\n",
                )}`;
              } else {
                errorMessage =
                  err.error.message ||
                  "Invalid request. Please check the customer data.";
              }
            } else if (err.error && err.error.message) {
              errorMessage = `Bad request: ${err.error.message}`;
            } else {
              errorMessage = "Invalid request. Please check the customer data.";
            }
          } else if (err.status === 403) {
            errorMessage =
              "You do not have permission to update customer status.";
          } else if (err.status === 404) {
            errorMessage = "Customer not found.";
          } else if (err.status === 500) {
            errorMessage = "Server error. Please try again later.";
          }

          alert(errorMessage);
        },
      });
  }

  getFullName(customer: User): string {
    const first = (customer.firstName || "").trim();
    const last = (customer.lastName || "").trim();
    if (first || last) return `${first} ${last}`.trim();
    return (customer as { name?: string }).name || "Not provided";
  }

  getStatusBadge(status: string): string {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "bg-success";
      case "SUSPENDED":
        return "bg-warning";
      case "INACTIVE":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  }

  getAccountTypeBadge(type: string): string {
    switch (type?.toUpperCase()) {
      case "CURRENT":
        return "bg-primary";
      case "SAVING":
        return "bg-success";
      default:
        return "bg-secondary";
    }
  }

  getAccountStatusBadge(status: string): string {
    switch (status?.toUpperCase()) {
      case "CREATED":
      case "ACTIVE":
        return "bg-success";
      case "SUSPENDED":
        return "bg-warning";
      case "CLOSED":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  }

  editAccount(account: any): void {
    this.router.navigate(["/admin/accounts", account.id, "edit"]);
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
