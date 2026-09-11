import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import {
  Account,
  BankAccount,
  CreateAccountDto,
  UpdateAccountDto,
  AccountSummary,
  Transaction,
  CreateTransactionDto,
  TransferRequest,
  DepositRequest,
  WithdrawalRequest,
  TransactionFilter,
  PagedResponse,
} from "../models/account.model";
import { AuthService } from "../../auth/services/auth.service";
import { UserRole } from "../../auth/models/auth.model";

@Injectable({
  providedIn: "root",
})
export class AccountService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(
      `${this.apiUrl}${environment.endpoints.accounts}`,
    );
  }

  getAccountById(id: string | number): Observable<Account> {
    return this.http.get<Account>(
      `${this.apiUrl}${environment.endpoints.accounts}/${id}`,
    );
  }

  getAccountsByCustomerId(customerId: number): Observable<Account[]> {
    return this.http.get<Account[]>(
      `${this.apiUrl}${environment.endpoints.accounts}/customer/${customerId}`,
    );
  }

  createAccount(account: CreateAccountDto): Observable<Account> {
    return this.http.post<Account>(
      `${this.apiUrl}${environment.endpoints.accounts}`,
      account,
    );
  }

  updateAccount(id: number, account: UpdateAccountDto): Observable<Account> {
    return this.http.put<Account>(
      `${this.apiUrl}${environment.endpoints.accounts}/${id}`,
      account,
    );
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}${environment.endpoints.accounts}/${id}`,
    );
  }

  getAccountSummary(): Observable<AccountSummary> {
    return this.http.get<AccountSummary>(
      `${this.apiUrl}${environment.endpoints.accounts}/summary`,
    );
  }

  getCustomerAccountSummary(): Observable<AccountSummary> {
    return this.http.get<AccountSummary>(
      `${this.apiUrl}${environment.endpoints.customer.accounts}/summary`,
    );
  }

  getTransactions(
    filter?: TransactionFilter,
  ): Observable<PagedResponse<Transaction>> {
    let params = new HttpParams();

    if (filter) {
      if (filter.accountId !== undefined && filter.accountId !== null) {
        const accountIdStr =
          typeof filter.accountId === "string"
            ? filter.accountId.trim()
            : filter.accountId.toString();
        if (accountIdStr.trim() !== "") {
          params = params.set("accountId", accountIdStr);
        }
      }
      if (filter.type) {
        const typeStr =
          typeof filter.type === "string"
            ? filter.type.trim()
            : String(filter.type);
        if (typeStr !== "") {
          params = params.set("type", typeStr);
        }
      }
      if (filter.status) {
        const statusStr =
          typeof filter.status === "string"
            ? filter.status.trim()
            : String(filter.status);
        if (statusStr !== "") {
          params = params.set("status", statusStr);
        }
      }
      if (filter.startDate && filter.startDate.trim() !== "") {
        params = params.set("startDate", filter.startDate.trim());
      }
      if (filter.endDate && filter.endDate.trim() !== "") {
        params = params.set("endDate", filter.endDate.trim());
      }
      if (filter.minAmount !== undefined && filter.minAmount !== null) {
        params = params.set("minAmount", filter.minAmount.toString());
      }
      if (filter.maxAmount !== undefined && filter.maxAmount !== null) {
        params = params.set("maxAmount", filter.maxAmount.toString());
      }
      if (filter.page !== undefined && filter.page !== null) {
        params = params.set("page", filter.page.toString());
      }
      if (filter.size !== undefined && filter.size !== null) {
        params = params.set("size", filter.size.toString());
      }
      if (filter.sortBy && filter.sortBy.trim() !== "") {
        params = params.set("sortBy", filter.sortBy.trim());
      }
      if (filter.sortDirection) {
        params = params.set("sortDirection", filter.sortDirection);
      }
    }

    const currentUser = this.authService.getCurrentUser();
    let endpoint: string;
    if (currentUser?.role === UserRole.ADMIN) {
      endpoint = `${this.apiUrl}/admin/transactions`;
    } else if (currentUser?.role === UserRole.CUSTOMER) {
      endpoint = `${this.apiUrl}/customer/transactions`;
    } else {
      endpoint = `${this.apiUrl}/admin/transactions`;
    }

    return this.http.get<PagedResponse<Transaction>>(endpoint, { params }).pipe(
      map((response: any) => {
        const content = (response?.content ?? []).map((op: any) =>
          this.normalizeOperationToTransaction(op),
        );
        return {
          content,
          totalElements: response?.totalElements ?? content.length,
          totalPages: response?.totalPages ?? 1,
          size: response?.size ?? 20,
          number: response?.number ?? 0,
          first: response?.first ?? true,
          last: response?.last ?? true,
        } as PagedResponse<Transaction>;
      }),
      catchError((error) => {
        if (error.status === 403 && currentUser?.role === UserRole.CUSTOMER) {
          return this.http
            .get<PagedResponse<Transaction>>(`${this.apiUrl}/transactions`, { params })
            .pipe(catchError(() => throwError(() => error)));
        }
        return throwError(() => error);
      }),
    );
  }

  private normalizeOperationToTransaction(op: any): Transaction {
    const type =
      op.type === "CREDIT"
        ? "DEPOSIT"
        : op.type === "DEBIT"
          ? "WITHDRAWAL"
          : op.type;
    return {
      id: op.id,
      accountId: op.accountId ?? op.bankAccountId,
      type: type as any,
      amount: op.amount,
      balance: op.balance ?? 0,
      description: op.description ?? "",
      status: (op.status ?? "COMPLETED") as any,
      operationDate: op.operationDate ?? op.operationDate,
      customerName: op.customerName,
      performedBy: op.performedBy,
      customer: op.customer,
      requestId: op.requestId,
    } as Transaction;
  }

  getTransactionAudit(requestId: string): Observable<{
    request: { id: string; type: string; status: string; accountId: string; destinationId?: string; amount: number; createdAt: string; completedAt?: string };
    legs: { id: number; bankAccountId: string; type: string; amount: number; description: string; operationDate: string }[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/transactions/audit/${requestId}`);
  }

  getTransactionById(id: number): Observable<Transaction> {
    const currentUser = this.authService.getCurrentUser();
    const endpoint =
      currentUser?.role === UserRole.CUSTOMER
        ? `${this.apiUrl}/customer/transactions/${id}`
        : `${this.apiUrl}/admin/transactions/${id}`;
    return this.http.get<Transaction>(endpoint);
  }

  getAccountTransactions(
    accountId: number,
    filter?: TransactionFilter,
  ): Observable<PagedResponse<Transaction>> {
    let params = new HttpParams();

    if (filter) {
      if (filter.type) {
        params = params.set("type", String(filter.type));
      }
      if (filter.status) {
        params = params.set("status", String(filter.status));
      }
      if (filter.startDate && filter.startDate.trim() !== "") {
        params = params.set("startDate", filter.startDate.trim());
      }
      if (filter.endDate && filter.endDate.trim() !== "") {
        params = params.set("endDate", filter.endDate.trim());
      }
      if (filter.minAmount !== undefined && filter.minAmount !== null) {
        params = params.set("minAmount", filter.minAmount.toString());
      }
      if (filter.maxAmount !== undefined && filter.maxAmount !== null) {
        params = params.set("maxAmount", filter.maxAmount.toString());
      }
      if (filter.page !== undefined && filter.page !== null) {
        params = params.set("page", filter.page.toString());
      }
      if (filter.size !== undefined && filter.size !== null) {
        params = params.set("size", filter.size.toString());
      }
      if (filter.sortBy && filter.sortBy.trim() !== "") {
        params = params.set("sortBy", filter.sortBy.trim());
      }
      if (filter.sortDirection) {
        params = params.set("sortDirection", filter.sortDirection);
      }
    }

    return this.http.get<PagedResponse<Transaction>>(
      `${this.apiUrl}/accounts/${accountId}/transactions`,
      { params },
    );
  }

  deposit(request: DepositRequest): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.apiUrl}${environment.endpoints.transactions}/deposit`,
      request,
    );
  }

  withdraw(request: WithdrawalRequest): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.apiUrl}${environment.endpoints.transactions}/withdraw`,
      request,
    );
  }

  transfer(request: TransferRequest): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.apiUrl}${environment.endpoints.transactions}/transfer`,
      request,
    );
  }

  createTransaction(
    transaction: CreateTransactionDto,
  ): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.apiUrl}${environment.endpoints.transactions}`,
      transaction,
    );
  }

  customerDeposit(request: DepositRequest): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.apiUrl}${environment.endpoints.customer.transactions}/deposit`,
      request,
    );
  }

  customerWithdraw(request: WithdrawalRequest): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.apiUrl}${environment.endpoints.customer.transactions}/withdraw`,
      request,
    );
  }

  customerTransfer(request: TransferRequest): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.apiUrl}${environment.endpoints.customer.transactions}/transfer`,
      request,
    );
  }

  getAccountBalance(
    accountId: number,
  ): Observable<{ balance: number; currency: string }> {
    return this.http.get<{ balance: number; currency: string }>(
      `${this.apiUrl}/accounts/${accountId}/balance`,
    );
  }

  getAccountStatement(
    accountId: number,
    startDate: string,
    endDate: string,
  ): Observable<Blob> {
    const params = new HttpParams()
      .set("startDate", startDate)
      .set("endDate", endDate);

    return this.http.get(`${this.apiUrl}/accounts/${accountId}/statement`, {
      params,
      responseType: "blob",
    });
  }

  getCustomerAccounts(): Observable<BankAccount[]> {
    const endpoint = `${this.apiUrl}/customer/accounts`;
    return this.http.get<BankAccount[]>(endpoint).pipe(
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }

  getCustomerAccountById(accountId: string): Observable<BankAccount> {
    const endpoint = `${this.apiUrl}/customer/accounts/${accountId}`;
    return this.http.get<BankAccount>(endpoint).pipe(
      catchError((error) => throwError(() => error)),
    );
  }

  getCustomerTransactions(
    filter?: TransactionFilter,
  ): Observable<PagedResponse<Transaction>> {
    let params = new HttpParams();

    if (filter) {
      if (filter.accountId !== undefined && filter.accountId !== null) {
        const accountIdStr =
          typeof filter.accountId === "string"
            ? filter.accountId.trim()
            : filter.accountId.toString();
        if (accountIdStr.trim() !== "") {
          params = params.set("accountId", accountIdStr);
        }
      }
      if (filter.type) {
        const typeStr =
          typeof filter.type === "string"
            ? filter.type.trim()
            : String(filter.type);
        if (typeStr !== "") {
          params = params.set("type", typeStr);
        }
      }
      if (filter.status) {
        const statusStr =
          typeof filter.status === "string"
            ? filter.status.trim()
            : String(filter.status);
        if (statusStr !== "") {
          params = params.set("status", statusStr);
        }
      }
      if (filter.startDate && filter.startDate.trim() !== "") {
        params = params.set("startDate", filter.startDate.trim());
      }
      if (filter.endDate && filter.endDate.trim() !== "") {
        params = params.set("endDate", filter.endDate.trim());
      }
      if (filter.minAmount !== undefined && filter.minAmount !== null) {
        params = params.set("minAmount", filter.minAmount.toString());
      }
      if (filter.maxAmount !== undefined && filter.maxAmount !== null) {
        params = params.set("maxAmount", filter.maxAmount.toString());
      }
      if (filter.page !== undefined && filter.page !== null) {
        params = params.set("page", filter.page.toString());
      }
      if (filter.size !== undefined && filter.size !== null) {
        params = params.set("size", filter.size.toString());
      }
      if (filter.sortBy && filter.sortBy.trim() !== "") {
        params = params.set("sortBy", filter.sortBy.trim());
      }
      if (filter.sortDirection) {
        params = params.set("sortDirection", filter.sortDirection);
      }
    }

    const customerEndpoint = `${this.apiUrl}/customer/transactions`;
    return this.http.get<any>(customerEndpoint, { params }).pipe(
      map((backendResponse) => {
        const data = backendResponse?.body ?? backendResponse;
        const rawContent = data.content ?? data.transactions ?? [];
        const content = (Array.isArray(rawContent) ? rawContent : []).map(
          (op: any) => this.normalizeOperationToTransaction(op),
        );
        return {
          content,
          totalElements: data.totalElements ?? content.length,
          totalPages: data.totalPages ?? 1,
          size: data.size ?? 10,
          number: data.number ?? data.currentPage ?? 0,
          first: data.first ?? (data.number ?? 0) === 0,
          last:
            (data.last ?? false) ||
            (data.number ?? 0) >= (data.totalPages ?? 1) - 1,
        } as PagedResponse<Transaction>;
      }),
      catchError((error) => {
        return this.http
          .get<PagedResponse<Transaction>>(`${this.apiUrl}/transactions`, { params })
          .pipe(
            map((res: any) => {
              const d = res?.body ?? res;
              const raw = d?.content ?? d?.transactions ?? [];
              const c = (Array.isArray(raw) ? raw : []).map((op: any) =>
                this.normalizeOperationToTransaction(op),
              );
              return {
                content: c,
                totalElements: d?.totalElements ?? c.length,
                totalPages: d?.totalPages ?? 1,
                size: d?.size ?? 10,
                number: d?.number ?? 0,
                first: d?.first ?? true,
                last: d?.last ?? true,
              } as PagedResponse<Transaction>;
            }),
            catchError(() => throwError(() => error)),
          );
      }),
    );
  }
}
