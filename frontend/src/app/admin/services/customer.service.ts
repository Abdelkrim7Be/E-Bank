import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, BehaviorSubject, throwError } from "rxjs";
import { map, tap, catchError, switchMap } from "rxjs/operators";
import { User, UserStatus } from "../../auth/models/auth.model";
import { environment } from "../../../environments/environment";

export interface CustomerSearchParams {
  search?: string;
  status?: UserStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CustomerResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  suspendedCustomers: number;
  newCustomersThisMonth: number;
  totalBalance: number;
}

// Create payload for POST /api/admin/customers
export interface CustomerCreateDTO {
  password: string;
  username: string;
  name?: string;
  email: string;
  phone?: string;
  address?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  enabled?: boolean;
}

@Injectable({
  providedIn: "root",
})
/** Admin customer CRUD and list/export; normalizes backend array to CustomerResponse. */
export class AdminCustomerService {
  private readonly API_URL = `${environment.apiUrl}${environment.endpoints.admin.customers}`;

  private customersSubject = new BehaviorSubject<User[]>([]);
  public customers$ = this.customersSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCustomers(params?: CustomerSearchParams): Observable<CustomerResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.search) httpParams = httpParams.set("search", params.search);
      if (params.status) httpParams = httpParams.set("status", params.status);
      if (params.page !== undefined)
        httpParams = httpParams.set("page", params.page.toString());
      if (params.size !== undefined)
        httpParams = httpParams.set("size", params.size.toString());
      if (params.sortBy) httpParams = httpParams.set("sortBy", params.sortBy);
      if (params.sortOrder)
        httpParams = httpParams.set("sortOrder", params.sortOrder);
    }

    return this.http.get<User[]>(this.API_URL, { params: httpParams }).pipe(
      map((users) => {
        const totalElements = users.length;
        const size = (params?.size ?? totalElements) || 1;
        const currentPage = params?.page ?? 0;
        const totalPages = Math.max(1, Math.ceil(totalElements / size));

        const response: CustomerResponse = {
          content: users,
          totalElements,
          totalPages,
          currentPage,
          size,
        };

        this.customersSubject.next(response.content);
        return response;
      }),
    );
  }

  getCustomerById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`).pipe(
      map((dto: any) => this.customerDtoToUser(dto)),
      catchError((error) => {
        if (error.message && error.message.includes("parsing")) {
          return this.getCustomerByIdRaw(id).pipe(
            catchError(() => this.getCustomerByIdFromList(id)),
          );
        }
        if (error.status === 500 || error.status === 404) {
          return this.getCustomerByIdFromList(id);
        }
        return throwError(() => error);
      }),
    );
  }

  private customerDtoToUser(dto: any): User {
    const status: UserStatus =
      dto.enabled === false ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    return {
      id: dto.id,
      username: dto.username ?? dto.name ?? "",
      email: dto.email ?? "",
      firstName: dto.firstName ?? "",
      lastName: dto.lastName ?? "",
      role: (dto.role as any) ?? "CUSTOMER",
      status,
      enabled: dto.enabled !== false,
      createdAt: dto.createdAt != null ? String(dto.createdAt) : "",
      updatedAt: dto.updatedAt != null ? String(dto.updatedAt) : "",
      accountCount: dto.accountCount,
      totalBalance: dto.totalBalance,
      selected: dto.selected,
    };
  }

  private getCustomerByIdRaw(id: number): Observable<User> {
    return this.http
      .get(`${this.API_URL}/${id}`, { responseType: "text" })
      .pipe(
        map((response: string) => {
          const cleanedResponse = this.cleanMalformedJSON(response);
          try {
            const dto = JSON.parse(cleanedResponse);
            return this.customerDtoToUser(dto);
          } catch {
            throw new Error("Unable to parse customer data from server");
          }
        }),
        catchError(() =>
          throwError(() => new Error("Failed to load customer data")),
        ),
      );
  }

  private getCustomerByIdFromList(id: number): Observable<User> {
    return this.getCustomers({ size: 1000 }).pipe(
      map((response) => {
        const customer = response.content.find((c) => c.id === id);
        if (!customer) {
          throw new Error(`Customer with ID ${id} not found`);
        }
        return this.customerDtoToUser(customer);
      }),
      catchError(() =>
        throwError(() => new Error(`Failed to find customer with ID ${id}`)),
      ),
    );
  }

  createCustomer(customerData: CustomerCreateDTO): Observable<User> {
    return this.http.post<any>(this.API_URL, customerData).pipe(
      map((dto: any) => this.customerDtoToUser(dto)),
      tap((newCustomer) => {
        const currentCustomers = this.customersSubject.value;
        this.customersSubject.next([...currentCustomers, newCustomer]);
      }),
    );
  }

  updateCustomer(id: number, customerData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, customerData).pipe(
      tap((updatedCustomer) => {
        const currentCustomers = this.customersSubject.value;
        const index = currentCustomers.findIndex((c) => c.id === id);
        if (index !== -1) {
          currentCustomers[index] = updatedCustomer;
          this.customersSubject.next([...currentCustomers]);
        }
      }),
    );
  }

  updateCustomerStatus(id: number, enabled: boolean): Observable<User> {
    return this.http
      .patch<User>(`${this.API_URL}/${id}/status`, { enabled })
      .pipe(
        tap((updatedCustomer) => {
          const currentCustomers = this.customersSubject.value;
          const index = currentCustomers.findIndex((c) => c.id === id);
          if (index !== -1) {
            currentCustomers[index] = updatedCustomer;
            this.customersSubject.next([...currentCustomers]);
          }
        }),
        catchError((error) => {
          if (error.status === 0 || error.status === 405) {
            return this.updateCustomerStatusFallback(id, enabled);
          }
          return throwError(() => error);
        }),
      );
  }

  private updateCustomerStatusFallback(
    id: number,
    enabled: boolean,
  ): Observable<User> {
    const statusUpdate = { enabled };
    return this.http.patch<User>(`${this.API_URL}/${id}`, statusUpdate).pipe(
      tap((updatedCustomer) => {
        const currentCustomers = this.customersSubject.value;
        const index = currentCustomers.findIndex((c) => c.id === id);
        if (index !== -1) {
          currentCustomers[index] = updatedCustomer;
          this.customersSubject.next([...currentCustomers]);
        }
      }),
      catchError(() =>
        this.getCustomerById(id).pipe(
          switchMap((customer) => {
            const completeUpdate = {
              username: customer.username,
              email: customer.email,
              firstName: customer.firstName || "",
              lastName: customer.lastName || "",
              role: customer.role || "CUSTOMER",
              enabled,
            };
            return this.http.put<User>(`${this.API_URL}/${id}`, completeUpdate);
          }),
          tap((updatedCustomer) => {
            const currentCustomers = this.customersSubject.value;
            const index = currentCustomers.findIndex((c) => c.id === id);
            if (index !== -1) {
              currentCustomers[index] = updatedCustomer;
              this.customersSubject.next([...currentCustomers]);
            }
          }),
        ),
      ),
    );
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        const currentCustomers = this.customersSubject.value;
        const filteredCustomers = currentCustomers.filter((c) => c.id !== id);
        this.customersSubject.next(filteredCustomers);
      }),
    );
  }

  /**
   * Bulk update customer status
   */
  bulkUpdateStatus(
    customerIds: number[],
    enabled: boolean,
  ): Observable<User[]> {
    return this.http
      .patch<User[]>(`${this.API_URL}/bulk/status`, {
        customerIds,
        enabled,
      })
      .pipe(
        tap((updatedCustomers) => {
          const currentCustomers = this.customersSubject.value;
          const updatedCustomersMap = new Map(
            updatedCustomers.map((c) => [c.id, c]),
          );

          const newCustomers = currentCustomers.map(
            (customer) => updatedCustomersMap.get(customer.id) || customer,
          );

          this.customersSubject.next(newCustomers);
        }),
      );
  }

  bulkDeleteCustomers(customerIds: number[]): Observable<void> {
    return this.http
      .delete<void>(`${this.API_URL}/bulk`, {
        body: { customerIds },
      })
      .pipe(
        tap(() => {
          const currentCustomers = this.customersSubject.value;
          const filteredCustomers = currentCustomers.filter(
            (c) => !customerIds.includes(c.id),
          );
          this.customersSubject.next(filteredCustomers);
        }),
      );
  }

  /**
   * Get customer statistics
   */
  getCustomerStats(): Observable<CustomerStats> {
    return this.http.get<CustomerStats>(`${this.API_URL}/stats`);
  }

  getCustomerAccounts(customerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/${customerId}/accounts`);
  }

  /**
   * Get customer transactions
   */
  getCustomerTransactions(customerId: number, params?: any): Observable<any> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined)
        httpParams = httpParams.set("page", params.page.toString());
      if (params.size !== undefined)
        httpParams = httpParams.set("size", params.size.toString());
      if (params.startDate)
        httpParams = httpParams.set("startDate", params.startDate);
      if (params.endDate)
        httpParams = httpParams.set("endDate", params.endDate);
      if (params.type) httpParams = httpParams.set("type", params.type);
    }

    return this.http.get<any>(`${this.API_URL}/${customerId}/transactions`, {
      params: httpParams,
    });
  }

  exportCustomers(params?: CustomerSearchParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.search) httpParams = httpParams.set("search", params.search);
      if (params.status) httpParams = httpParams.set("status", params.status);
      if (params.sortBy) httpParams = httpParams.set("sortBy", params.sortBy);
      if (params.sortOrder)
        httpParams = httpParams.set("sortOrder", params.sortOrder);
    }

    return this.http.get(`${this.API_URL}/export`, {
      params: httpParams,
      responseType: "blob",
      observe: "body",
    });
  }

  searchCustomers(term: string): Observable<User[]> {
    return this.getCustomers({ search: term, size: 10 }).pipe(
      map((response) => response.content),
    );
  }

  getRecentCustomers(limit: number = 5): Observable<User[]> {
    return this.getCustomers({
      size: limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    }).pipe(map((response) => response.content));
  }

  /**
   * Validate customer data
   */
  validateCustomerData(data: Partial<User>): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (!data.firstName || data.firstName.trim().length < 2) {
      errors["firstName"] = "First name must be at least 2 characters long";
    }

    if (!data.lastName || data.lastName.trim().length < 2) {
      errors["lastName"] = "Last name must be at least 2 characters long";
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors["email"] = "Please enter a valid email address";
    }

    if (!data.username || data.username.trim().length < 3) {
      errors["username"] = "Username must be at least 3 characters long";
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get current customers from subject
   */
  getCurrentCustomers(): User[] {
    return this.customersSubject.value;
  }

  clearCache(): void {
    this.customersSubject.next([]);
  }

  /**
   * Clean malformed JSON response
   */
  private cleanMalformedJSON(jsonString: string): string {
    let cleaned = jsonString.trim();

    console.log("Cleaning JSON, original length:", cleaned.length);

    // Remove any extra closing braces at the end
    // Look for patterns like }}}}}}}}} and replace with single }
    cleaned = cleaned.replace(/}+$/, "}");

    // Try to find the actual end of the JSON object
    // Count opening and closing braces to find where the JSON should end
    let openBraces = 0;
    let closeBraces = 0;
    let validEndIndex = -1;

    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === "{") {
        openBraces++;
      } else if (cleaned[i] === "}") {
        closeBraces++;

        // If we have equal braces and we're at a valid JSON end
        if (openBraces === closeBraces && openBraces > 0) {
          validEndIndex = i;
          break;
        }
      }
    }

    if (validEndIndex !== -1) {
      cleaned = cleaned.substring(0, validEndIndex + 1);
      console.log("Found valid JSON end at index:", validEndIndex);
    }

    console.log("Cleaned JSON length:", cleaned.length);
    return cleaned;
  }
}
