import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CustomerDTO,
  BankAccountDTO,
  CurrentBankAccountDTO,
  SavingBankAccountDTO,
  AccountOperationDTO,
  BankingStatsDTO,
  AccountsSummaryDTO,
  CustomersSummaryDTO,
  PageResponse,
  CustomerSearchRequest,
  AccountSearchRequest,
  UserDTO,
  UserStatusUpdateRequest,
  CreateCurrentAccountRequest,
  CreateSavingAccountRequest,
  TransactionHistoryRequest,
  TransactionHistoryResponse,
  HealthCheckResponse,
  DebitRequest,
  CreditRequest,
  TransferRequest,
} from "../../shared/models/banking-dtos.model";

/** Central HTTP client for auth, admin, customers, accounts, transactions and dashboard. */
@Injectable({
  providedIn: "root",
})
export class BankingApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}${environment.endpoints.auth.login}`,
      credentials,
    );
  }

  /**
   * User registration with role selection
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}${environment.endpoints.auth.register}`,
      userData,
    );
  }

  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(
      `${this.apiUrl}${environment.endpoints.admin.users}`,
    );
  }

  /**
   * Get all customers (Admin only)
   */
  getAllCustomersAdmin(): Observable<CustomerDTO[]> {
    return this.http.get<CustomerDTO[]>(
      `${this.apiUrl}${environment.endpoints.admin.customers}`,
    );
  }

  getUsersByRole(role: "ADMIN" | "CUSTOMER"): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(
      `${this.apiUrl}${environment.endpoints.admin.usersByRole}/${role}`,
    );
  }

  /**
   * Enable/disable user (Admin only)
   */
  updateUserStatus(
    userId: number,
    statusUpdate: UserStatusUpdateRequest,
  ): Observable<UserDTO> {
    return this.http.put<UserDTO>(
      `${this.apiUrl}${environment.endpoints.admin.userStatus}/${userId}/status`,
      statusUpdate,
    );
  }

  getCustomers(): Observable<CustomerDTO[]> {
    return this.http.get<CustomerDTO[]>(
      `${this.apiUrl}${environment.endpoints.customers}`,
    );
  }

  /**
   * Create new customer
   */
  createCustomer(customer: CustomerDTO): Observable<CustomerDTO> {
    return this.http.post<CustomerDTO>(
      `${this.apiUrl}${environment.endpoints.customers}`,
      customer,
    );
  }

  getCustomerById(id: number): Observable<CustomerDTO> {
    return this.http.get<CustomerDTO>(
      `${this.apiUrl}${environment.endpoints.customers}/${id}`,
    );
  }

  /**
   * Update customer
   */
  updateCustomer(id: number, customer: CustomerDTO): Observable<CustomerDTO> {
    return this.http.put<CustomerDTO>(
      `${this.apiUrl}${environment.endpoints.customers}/${id}`,
      customer,
    );
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}${environment.endpoints.customers}/${id}`,
    );
  }

  /**
   * Get paginated customers
   */
  getCustomersPage(
    page: number = 0,
    size: number = 10,
  ): Observable<PageResponse<CustomerDTO>> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());
    return this.http.get<PageResponse<CustomerDTO>>(
      `${this.apiUrl}${environment.endpoints.customers}/page`,
      { params },
    );
  }

  searchCustomers(
    searchRequest: CustomerSearchRequest,
  ): Observable<PageResponse<CustomerDTO>> {
    let params = new HttpParams();
    if (searchRequest.name) params = params.set("name", searchRequest.name);
    if (searchRequest.email) params = params.set("email", searchRequest.email);
    if (searchRequest.phone) params = params.set("phone", searchRequest.phone);
    if (searchRequest.page !== undefined)
      params = params.set("page", searchRequest.page.toString());
    if (searchRequest.size !== undefined)
      params = params.set("size", searchRequest.size.toString());

    return this.http.get<PageResponse<CustomerDTO>>(
      `${this.apiUrl}${environment.endpoints.customers}/search`,
      { params },
    );
  }

  // ==================== ACCOUNT MANAGEMENT ====================

  /**
   * Get all accounts
   */
  getAccounts(): Observable<BankAccountDTO[]> {
    return this.http.get<BankAccountDTO[]>(
      `${this.apiUrl}${environment.endpoints.accounts}`,
    );
  }

  getAccountById(id: string): Observable<BankAccountDTO> {
    return this.http.get<BankAccountDTO>(
      `${this.apiUrl}${environment.endpoints.accounts}/${id}`,
    );
  }

  /**
   * Get customer accounts
   */
  getCustomerAccounts(customerId: number): Observable<BankAccountDTO[]> {
    return this.http.get<BankAccountDTO[]>(
      `${this.apiUrl}${environment.endpoints.accounts}/customer/${customerId}`,
    );
  }

  createCurrentAccount(
    initialBalance: number,
    overDraft: number,
    customerId: number,
  ): Observable<CurrentBankAccountDTO> {
    const params = new HttpParams()
      .set("initialBalance", initialBalance.toString())
      .set("overDraft", overDraft.toString())
      .set("customerId", customerId.toString());
    return this.http.post<CurrentBankAccountDTO>(
      `${this.apiUrl}${environment.endpoints.accounts}/current`,
      null,
      { params },
    );
  }

  /**
   * Create saving account
   */
  createSavingAccount(
    initialBalance: number,
    interestRate: number,
    customerId: number,
  ): Observable<SavingBankAccountDTO> {
    const params = new HttpParams()
      .set("initialBalance", initialBalance.toString())
      .set("interestRate", interestRate.toString())
      .set("customerId", customerId.toString());
    return this.http.post<SavingBankAccountDTO>(
      `${this.apiUrl}${environment.endpoints.accounts}/saving`,
      null,
      { params },
    );
  }

  debit(
    accountId: string,
    amount: number,
    description: string,
  ): Observable<void> {
    const body = { accountId, amount, description };
    return this.http.post<void>(
      `${this.apiUrl}${environment.endpoints.transactions}/debit`,
      body,
    );
  }

  /**
   * Deposit money (Credit)
   */
  credit(
    accountId: string,
    amount: number,
    description: string,
  ): Observable<void> {
    const body = { accountId, amount, description };
    return this.http.post<void>(
      `${this.apiUrl}${environment.endpoints.transactions}/credit`,
      body,
    );
  }

  transfer(transferRequest: TransferRequest): Observable<{ id: string; status: string }> {
    const body = {
      sourceAccountId: transferRequest.sourceAccountId,
      destinationAccountId: transferRequest.destinationAccountId,
      amount: transferRequest.amount,
      description: transferRequest.description,
    };
    return this.http.post<{ id: string; status: string }>(
      `${this.apiUrl}${environment.endpoints.transactions}/transfer`,
      body,
    );
  }

  /**
   * Get account history
   */
  getAccountHistory(
    accountId: string,
    page: number = 0,
    size: number = 10,
  ): Observable<TransactionHistoryResponse> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());
    return this.http.get<TransactionHistoryResponse>(
      `${this.apiUrl}${environment.endpoints.accounts}/${accountId}/history`,
      { params },
    );
  }

  getAccountsForSelection(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}${environment.endpoints.accounts}`,
    );
  }

  /**
   * Get active accounts for selection dropdown
   */
  getActiveAccountsForSelection(): Observable<any[]> {
    // For now, filter on the client side using the full accounts list.
    return this.getAccountsForSelection();
  }

  // ==================== DASHBOARD ====================

  /**
   * Get banking statistics
   */
  getBankingStats(): Observable<BankingStatsDTO> {
    return this.http.get<BankingStatsDTO>(
      `${this.apiUrl}${environment.endpoints.dashboard}/stats`,
    );
  }

  getAccountsSummary(): Observable<AccountsSummaryDTO> {
    return this.http.get<AccountsSummaryDTO>(
      `${this.apiUrl}${environment.endpoints.dashboard}/accounts-summary`,
    );
  }

  /**
   * Get customers summary
   */
  getCustomersSummary(): Observable<CustomersSummaryDTO> {
    return this.http.get<CustomersSummaryDTO>(
      `${this.apiUrl}${environment.endpoints.dashboard}/customers-summary`,
    );
  }

  getHealthCheck(): Observable<HealthCheckResponse> {
    return this.http.get<HealthCheckResponse>(
      `${this.apiUrl}${environment.endpoints.dashboard}/health`,
    );
  }
}
