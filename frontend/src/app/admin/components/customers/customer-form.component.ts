import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router, ActivatedRoute, RouterModule } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import {
  AdminCustomerService,
  CustomerCreateDTO,
} from "../../services/customer.service";
import {
  UserRole,
  CustomerUpdateRequest,
} from "../../../auth/models/auth.model";
import { environment } from "../../../../environments/environment";

@Component({
  selector: "app-admin-customer-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./customer-form.component.html",
  styleUrl: "./customer-form.component.css",
})
export class AdminCustomerFormComponent implements OnInit {
  customerForm!: FormGroup;
  isEditMode = false;
  customerId: number | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private customerService: AdminCustomerService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.customerForm = this.fb.group({
      username: ["", [Validators.required, Validators.minLength(3)]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      firstName: [""],
      lastName: [""],
      name: [""],
      phone: [""],
      address: [""],
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.isEditMode = true;
      this.customerId = parseInt(id, 10);
      this.customerForm.get("password")?.clearValidators();
      this.customerForm.get("password")?.updateValueAndValidity();
      this.loadCustomer();
    }
  }

  private loadCustomer(): void {
    if (!this.customerId) return;

    this.loading = true;
    this.error = null;

    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (customer) => {
        console.log("Customer loaded successfully:", customer);
        this.customerForm.patchValue({
          username: customer.username ?? (customer as any).name ?? "",
          email: customer.email ?? "",
          firstName: customer.firstName ?? "",
          lastName: customer.lastName ?? "",
          name:
            ((customer as any).name ??
              [customer.firstName, customer.lastName]
                .filter(Boolean)
                .join(" ")) ||
            "",
          phone: (customer as any).phone ?? "",
          address: (customer as any).address ?? "",
        });
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading customer:", err);
        console.error("Error details:", {
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          message: err.message,
        });

        // Try to extract useful error information
        let errorMessage = "Failed to load customer details";

        if (err.status === 0) {
          errorMessage =
            "Unable to connect to server. Please check your connection.";
        } else if (err.status === 404) {
          errorMessage = "Customer not found.";
        } else if (err.status === 429) {
          errorMessage =
            "Too many requests. Please wait a moment and try again.";
        } else if (err.status === 403) {
          errorMessage = "You do not have permission to view this customer.";
        } else if (err.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.message && err.message.includes("parsing")) {
          errorMessage =
            "Server returned invalid data. Please contact support.";
        }

        this.error = errorMessage;
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const formData = this.customerForm.value;

    if (this.isEditMode) {
      // Use CustomerUpdateRequest for updates (password optional)
      const customerData: CustomerUpdateRequest = {
        username: formData.username,
        email: formData.email,
        role: UserRole.CUSTOMER,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      };

      this.updateCustomer(customerData);
    } else {
      // Build CustomerDTO payload for customer-service
      const customerData: CustomerCreateDTO = {
        username: formData.username,
        email: formData.email,
        name:
          formData.name ||
          [formData.firstName, formData.lastName]
            .filter((v: string) => !!v && v.trim().length > 0)
            .join(" "),
        phone: formData.phone,
        address: formData.address,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: UserRole.CUSTOMER,
        enabled: true,
      };

      this.createCustomer(customerData);
    }
  }

  private updateCustomer(customerData: CustomerUpdateRequest): void {
    if (!this.customerId) return;

    this.customerService
      .updateCustomer(this.customerId, customerData)
      .subscribe({
        next: () => {
          this.success = "Customer updated successfully!";
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(["/admin/customers"]);
          }, 1500);
        },
        error: (err) => {
          console.error("Error updating customer:", err);
          this.error = this.formatErrorMessage(err, "update");
          this.submitting = false;
        },
      });
  }

  private createCustomer(customerData: CustomerCreateDTO): void {
    this.customerService.createCustomer(customerData).subscribe({
      next: () => {
        this.success = "Customer created successfully!";
        this.submitting = false;
        setTimeout(() => {
          this.router.navigate(["/admin/customers"]);
        }, 1500);
      },
      error: (err) => {
        console.error("Error creating customer:", err);
        this.error = this.formatErrorMessage(err, "create");
        this.submitting = false;
      },
    });
  }

  private formatErrorMessage(err: any, operation: "create" | "update"): string {
    console.log("Formatting error message for:", operation, err);

    // Handle validation errors
    if (err.status === 400 && err.error && err.error.errors) {
      const validationErrors = err.error.errors;
      let errorMessages: string[] = [];

      // Extract field-specific errors
      Object.keys(validationErrors).forEach((field) => {
        const fieldErrors = validationErrors[field];
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach((error) => {
            errorMessages.push(`• ${this.formatFieldName(field)}: ${error}`);
          });
        } else {
          errorMessages.push(
            `• ${this.formatFieldName(field)}: ${fieldErrors}`,
          );
        }
      });

      if (errorMessages.length > 0) {
        return `Validation errors:\n${errorMessages.join("\n")}`;
      }
    }

    // Handle other error types
    if (err.status === 400) {
      return (
        err.error?.message || `Invalid data provided. Please check your input.`
      );
    } else if (err.status === 409) {
      return "A customer with this username or email already exists.";
    } else if (err.status === 403) {
      return "You do not have permission to perform this action.";
    } else if (err.status === 404) {
      return "Customer not found.";
    } else if (err.status === 500) {
      return "Server error. Please try again later.";
    } else {
      return `Failed to ${operation} customer. Please try again.`;
    }
  }

  private formatFieldName(field: string): string {
    // Convert camelCase to readable format
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private debugRawRequest(customerId: number): void {
    const url = `${environment.apiUrl}${environment.endpoints.admin.customers}/${customerId}`;
    console.log("Debug: Making raw HTTP request to:", url);

    this.http.get(url, { responseType: "text" }).subscribe({
      next: (response) => {
        console.log("Debug: Raw response received:", response);
        console.log("Debug: Response length:", response.length);
        console.log("Debug: Response type:", typeof response);

        // Show first and last 100 characters
        if (response.length > 200) {
          console.log("Debug: First 100 chars:", response.substring(0, 100));
          console.log(
            "Debug: Last 100 chars:",
            response.substring(response.length - 100),
          );
        }
      },
      error: (error) => {
        console.error("Debug: Raw request failed:", error);
      },
    });
  }
}
