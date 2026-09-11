import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalCustomers: number;
  totalAccounts: number;
  totalBalance: number;
  totalTransactions: number;
  activeCustomers: number;
  pendingTransactions: number;
  monthlyGrowth: number;
  revenueGrowth: number;
}

export interface AccountsSummary {
  totalAccounts: number;
  accountsByType: {
    SAVINGS: number;
    CHECKING: number;
    BUSINESS: number;
    INVESTMENT: number;
  };
  totalBalance: number;
  averageBalance: number;
}

export interface TransactionsSummary {
  totalTransactions: number;
  transactionsByType: {
    DEPOSIT: number;
    WITHDRAWAL: number;
    TRANSFER: number;
  };
  totalVolume: number;
  pendingTransactions: number;
}

export interface CustomerDashboardData {
  accounts: AccountsSummary;
  transactions: TransactionsSummary;
  recentTransactions: any[];
  monthlySpending: {
    category: string;
    amount: number;
  }[];
}

export interface AdminDashboardData {
  stats: DashboardStats;
  accountsSummary: AccountsSummary;
  transactionsSummary: TransactionsSummary;
  recentTransactions: any[];
  customerGrowth: {
    month: string;
    count: number;
  }[];
  transactionVolume: {
    month: string;
    volume: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAdminDashboard(): Observable<AdminDashboardData> {
    return this.http.get<AdminDashboardData>(
      `${this.API_URL}${environment.endpoints.admin.dashboard}`
    );
  }

  getAdminStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(
      `${this.API_URL}${environment.endpoints.admin.dashboard}/stats`
    );
  }

  getAccountsSummary(): Observable<AccountsSummary> {
    return this.http.get<AccountsSummary>(
      `${this.API_URL}${environment.endpoints.admin.dashboard}/accounts-summary`
    );
  }

  getTransactionsSummary(): Observable<TransactionsSummary> {
    return this.http.get<TransactionsSummary>(
      `${this.API_URL}${environment.endpoints.admin.dashboard}/transactions-summary`
    );
  }

  getCustomerDashboard(): Observable<CustomerDashboardData> {
    const url = `${this.API_URL}${environment.endpoints.customer.dashboard}`;
    console.log('Dashboard service calling URL:', url);
    return this.http.get<CustomerDashboardData>(url);
  }

  getCustomerAccountsSummary(): Observable<AccountsSummary> {
    return this.http.get<AccountsSummary>(
      `${this.API_URL}${environment.endpoints.customer.dashboard}/accounts`
    );
  }

  getCustomerTransactionsSummary(): Observable<TransactionsSummary> {
    return this.http.get<TransactionsSummary>(
      `${this.API_URL}${environment.endpoints.customer.dashboard}/transactions`
    );
  }

  getCustomerSpendingBreakdown(): Observable<
    { category: string; amount: number; percentage: number }[]
  > {
    return this.http.get<
      { category: string; amount: number; percentage: number }[]
    >(
      `${this.API_URL}${environment.endpoints.customer.dashboard}/spending-breakdown`
    );
  }

  getRecentTransactions(limit: number = 5): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_URL}${environment.endpoints.transactions}/recent?limit=${limit}`
    );
  }

  getCustomerGrowthData(
    months: number = 12
  ): Observable<{ month: string; count: number }[]> {
    return this.http.get<{ month: string; count: number }[]>(
      `${this.API_URL}${environment.endpoints.admin.dashboard}/customer-growth?months=${months}`
    );
  }

  getTransactionVolumeData(
    months: number = 12
  ): Observable<{ month: string; volume: number }[]> {
    return this.http.get<{ month: string; volume: number }[]>(
      `${this.API_URL}${environment.endpoints.admin.dashboard}/transaction-volume?months=${months}`
    );
  }
}
