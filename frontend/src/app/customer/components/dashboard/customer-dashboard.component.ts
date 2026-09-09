import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../auth/models/auth.model';
import { AccountService } from '../../../shared/services/account.service';
import { BankAccount, Transaction } from '../../../shared/models/account.model';
import {
  DashboardService,
  CustomerDashboardData,
} from '../../../shared/services/dashboard.service';

Chart.register(...registerables);

interface AccountSummary {
  id: string | number;
  accountNumber: string;
  accountType: string;
  balance: number;
  status: string;
}

interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: Date;
  status: string;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./customer-dashboard.component.html",
  styleUrl: "./customer-dashboard.component.css",
})
export class CustomerDashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;
  error: string | null = null;

  accounts: AccountSummary[] = [];
  recentTransactions: RecentTransaction[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Debug: Check authentication status
    console.log('Current user:', this.currentUser);
    console.log('Auth token:', localStorage.getItem('digital-banking-token'));

    // Load customer accounts using the enhanced account service
    this.accountService.getCustomerAccounts().subscribe({
      next: (accounts: BankAccount[]) => {
        console.log('Customer accounts received:', accounts);
        this.accounts = this.mapBankAccountsToSummary(accounts);
        this.loadRecentTransactions();
      },
      error: (error) => {
        console.error('Error loading customer accounts:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
        });

        // Try fallback with dashboard service
        this.loadDashboardDataFallback();
      },
    });
  }

  private loadRecentTransactions(): void {
    // Load recent transactions for the customer
    const transactionFilter = {
      page: 0,
      size: 5,
      sortBy: 'operationDate',
      sortDirection: 'desc' as 'desc',
    };

    // Try customer-specific method first, then fallback
    this.accountService.getCustomerTransactions(transactionFilter).subscribe({
      next: (response) => {
        console.log('Recent transactions received:', response);
        this.recentTransactions = this.mapTransactionsToRecentTransactions(
          response.content || []
        );
        this.loading = false;
        this.initializeChart();
      },
      error: (error) => {
        console.error(
          'Error loading recent transactions with customer method, trying general method:',
          error
        );

        // Fallback to general method
        this.accountService.getTransactions(transactionFilter).subscribe({
          next: (response) => {
            console.log('Recent transactions received (fallback):', response);
            this.recentTransactions = this.mapTransactionsToRecentTransactions(
              response.content || []
            );
            this.loading = false;
            this.initializeChart();
          },
          error: (generalError) => {
            console.error(
              'Error loading recent transactions (all methods failed):',
              generalError
            );
            // Continue without recent transactions
            this.recentTransactions = [];
            this.loading = false;
            this.initializeChart();
          },
        });
      },
    });
  }

  private loadDashboardDataFallback(): void {
    // Fallback to original dashboard service
    this.dashboardService.getCustomerDashboard().subscribe({
      next: (data: any) => {
        console.log('Customer dashboard data received (fallback):', data);
        this.accounts = this.mapBackendAccountsData(data.accounts || []);
        this.recentTransactions = data.recentTransactions || [];
        this.loading = false;
        this.initializeChart();
      },
      error: (error) => {
        console.error(
          'Error loading customer dashboard data (fallback):',
          error
        );
        this.error = 'Failed to load dashboard data. Please try again.';
        this.loading = false;
        // Load default data for demo
        this.loadDefaultData();
        this.initializeChart();
      },
    });
  }

  private mapBankAccountsToSummary(accounts: BankAccount[]): AccountSummary[] {
    return accounts.map((account) => ({
      id: account.id,
      accountNumber: this.maskAccountNumber(account.id),
      accountType: this.formatAccountType(account.type),
      balance: account.balance || 0,
      status: account.status || 'ACTIVATED',
    }));
  }

  private mapTransactionsToRecentTransactions(
    transactions: Transaction[]
  ): RecentTransaction[] {
    return transactions.map((transaction) => ({
      id: transaction.id?.toString() || '',
      type: transaction.type,
      amount: transaction.amount,
      description:
        transaction.description ||
        this.getTransactionDescription(transaction.type),
      date: new Date(transaction.operationDate),
      status: transaction.status || 'COMPLETED',
    }));
  }

  private getTransactionDescription(type: string): string {
    const descriptions = {
      DEPOSIT: 'Money Added',
      WITHDRAWAL: 'Money Withdrawn',
      TRANSFER: 'Money Transferred',
    };
    return descriptions[type as keyof typeof descriptions] || 'Transaction';
  }

  private mapBackendAccountsData(accounts: any[]): AccountSummary[] {
    return accounts.map((account) => ({
      id: account.id,
      accountNumber: this.maskAccountNumber(account.id),
      accountType: this.formatAccountType(account.type),
      balance: account.balance || 0,
      status: account.status || 'ACTIVE',
    }));
  }

  private mapAccountsData(accountsSummary: any): AccountSummary[] {
    // Convert backend data to component format - fallback method
    return [
      {
        id: 'demo-account-1',
        accountNumber: '****1234',
        accountType: 'Checking',
        balance: 5420.5,
        status: 'ACTIVE',
      },
      {
        id: 'demo-account-2',
        accountNumber: '****5678',
        accountType: 'Savings',
        balance: 12750.25,
        status: 'ACTIVE',
      },
    ];
  }

  private maskAccountNumber(accountId: string | number): string {
    const accountIdStr = accountId?.toString() || '';
    if (!accountIdStr || accountIdStr.length < 4) return '****';
    return '****' + accountIdStr.slice(-4);
  }

  private formatAccountType(type?: string): string {
    switch (type?.toUpperCase()) {
      case 'CURRENT':
      case 'CURRENTACCOUNT':
        return 'Checking';
      case 'SAVING':
      case 'SAVINGACCOUNT':
        return 'Savings';
      default:
        return type || 'Unknown';
    }
  }

  private loadDefaultData(): void {
    this.accounts = [
      {
        id: 'demo-account-1',
        accountNumber: '****1234',
        accountType: 'Checking',
        balance: 5420.5,
        status: 'ACTIVE',
      },
      {
        id: 'demo-account-2',
        accountNumber: '****5678',
        accountType: 'Savings',
        balance: 12750.25,
        status: 'ACTIVE',
      },
    ];

    this.recentTransactions = [
      {
        id: '1',
        type: 'DEPOSIT',
        amount: 1500.0,
        description: 'Salary Deposit',
        date: new Date(),
        status: 'COMPLETED',
      },
      {
        id: '2',
        type: 'WITHDRAWAL',
        amount: 250.0,
        description: 'ATM Withdrawal',
        date: new Date(Date.now() - 86400000),
        status: 'COMPLETED',
      },
    ];
  }

  private initializeChart(): void {
    setTimeout(() => {
      this.createSpendingChart();
    }, 100);
  }

  private createSpendingChart(): void {
    const ctx = document.getElementById('spendingChart') as HTMLCanvasElement;
    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [
            'Food & Dining',
            'Shopping',
            'Transportation',
            'Bills',
            'Entertainment',
          ],
          datasets: [
            {
              data: [30, 25, 15, 20, 10],
              backgroundColor: [
                '#e63946',
                '#2a9d8f',
                '#e9c46a',
                '#e76f51',
                '#264653',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
            },
          },
        },
      });
    }
  }

  getTotalBalance(): number {
    return this.accounts.reduce((total, account) => total + account.balance, 0);
  }

  getActiveAccountsCount(): number {
    return this.accounts.filter((account) => account.status === 'ACTIVE')
      .length;
  }

  getAccountStatusBadge(status: string): string {
    const badges = {
      ACTIVE: 'bg-success',
      INACTIVE: 'bg-warning',
      SUSPENDED: 'bg-danger',
    };
    return badges[status as keyof typeof badges] || 'bg-secondary';
  }

  getTransactionIcon(type: string): string {
    const icons = {
      DEPOSIT: 'bi-arrow-down-circle deposit',
      WITHDRAWAL: 'bi-arrow-up-circle withdrawal',
      TRANSFER: 'bi-arrow-left-right transfer',
    };
    return icons[type as keyof typeof icons] || 'bi-circle';
  }

  getAmountClass(type: string): string {
    return type === 'WITHDRAWAL' ? 'text-danger' : 'text-success';
  }

  getAmountPrefix(type: string): string {
    return type === 'WITHDRAWAL' ? '-' : '+';
  }

  getTransactionStatusBadge(status: string): string {
    const badges = {
      COMPLETED: 'bg-success',
      PENDING: 'bg-warning',
      FAILED: 'bg-danger',
    };
    return badges[status as keyof typeof badges] || 'bg-secondary';
  }
}
