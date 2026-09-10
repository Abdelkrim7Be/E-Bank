import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../auth/models/auth.model';
import { AccountService } from '../../../shared/services/account.service';
import { BankAccount, Transaction } from '../../../shared/models/account.model';


Chart.register(...registerables);
Chart.defaults.font.family = "Montserrat, Arial, sans-serif";
Chart.defaults.color = "#62636b";

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
export class CustomerDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  loading = true;
  error: string | null = null;

  accounts: AccountSummary[] = [];
  recentTransactions: RecentTransaction[] = [];

  constructor(
    private authService: AuthService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  private chart?: Chart;
  private chartTimer?: ReturnType<typeof setTimeout>;
  transactionError = false;

  ngOnDestroy(): void {
    clearTimeout(this.chartTimer);
    this.chart?.destroy();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;
    this.transactionError = false;
    this.accounts = [];
    this.recentTransactions = [];
    this.chart?.destroy();
    this.accountService.getCustomerAccounts().subscribe({
      next: (accounts: BankAccount[]) => {
        this.accounts = this.mapBankAccountsToSummary(accounts);
        this.loadRecentTransactions();
      },
      error: () => {
        this.error = 'Your accounts could not be loaded. Please try again.';
        this.loading = false;
      },
    });
  }

  private loadRecentTransactions(): void {
    this.accountService.getCustomerTransactions({ page: 0, size: 5, sortBy: 'operationDate', sortDirection: 'desc' }).subscribe({
      next: (response) => {
        this.recentTransactions = this.mapTransactionsToRecentTransactions(response.content || []);
        this.loading = false;
        this.initializeChart();
      },
      error: () => {
        this.transactionError = true;
        this.recentTransactions = [];
        this.loading = false;
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

  private initializeChart(): void {
    clearTimeout(this.chartTimer);
    this.chartTimer = setTimeout(() => {
      this.createSpendingChart();
    }, 100);
  }

  private createSpendingChart(): void {
    const ctx = document.getElementById('spendingChart') as HTMLCanvasElement;
    if (ctx && this.recentTransactions.length) {
      this.chart?.destroy();
      const totals = new Map<string, number>();
      for (const transaction of this.recentTransactions) {
        const type = transaction.type === 'DEPOSIT' ? 'Credit' : transaction.type === 'WITHDRAWAL' ? 'Debit' : transaction.type;
        totals.set(type, (totals.get(type) || 0) + transaction.amount);
      }
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [...totals.keys()],
          datasets: [
            {
              data: [...totals.values()],
              backgroundColor: [
                '#1f368b',
                '#3b51d5',
                '#98a4df',
                '#727fcc',
                '#dce0f3',
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
    return this.accounts.filter((account) => ['ACTIVATED', 'ACTIVE'].includes(account.status))
      .length;
  }

  getAccountStatusBadge(status: string): string {
    const badges = {
      ACTIVATED: 'bg-success',
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
