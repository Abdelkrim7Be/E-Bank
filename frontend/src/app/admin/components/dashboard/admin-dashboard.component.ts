import { Component, OnInit, AfterViewInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { Chart, registerables } from "chart.js";
import { map, tap } from "rxjs/operators";
import { Observable } from "rxjs";
import { AuthService } from "../../../auth/services/auth.service";
import { User } from "../../../auth/models/auth.model";
import {
  DashboardService,
  DashboardStats,
  ReconciliationReport,
} from "../../../shared/services/dashboard.service";
import { AdminAccountService } from "../../services/account.service";
import { AccountService } from "../../../shared/services/account.service";

Chart.register(...registerables);
Chart.defaults.font.family = "Montserrat, Arial, sans-serif";
Chart.defaults.color = "#62636b";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./admin-dashboard.component.html",
  styleUrl: "./admin-dashboard.component.css",
})
export class AdminDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  currentUser: User | null = null;
  loading = true;
  error: string | null = null;
  exportingReport = false;

  stats: DashboardStats = {
    totalCustomers: 0,
    totalAccounts: 0,
    totalBalance: 0,
    totalTransactions: 0,
    activeCustomers: 0,
    pendingTransactions: 0,
    monthlyGrowth: 0,
    revenueGrowth: 0,
  };

  recentTransactions: any[] = [];
  reconciliation: ReconciliationReport | null = null;

  accountIdToCustomerName: Record<string, string> = {};

  accountTypesChart: Chart | null = null;
  transactionVolumeChart: Chart | null = null;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private adminAccountService: AdminAccountService,
    private accountService: AccountService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
    this.loadReconciliation();
  }

  private loadReconciliation(): void {
    this.dashboardService.getReconciliationReport().subscribe({
      next: (report) => (this.reconciliation = report),
      error: () => (this.reconciliation = null),
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
      setTimeout(() => {
        
      }, 500);
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.accountTypesChart) {
      this.accountTypesChart.destroy();
    }
    if (this.transactionVolumeChart) {
      this.transactionVolumeChart.destroy();
    }
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    Promise.all([
      this.dashboardService
        .getAdminStats()
        .toPromise()
        .catch(() => null),
      this.adminAccountService
        .getAccountStats()
        .toPromise()
        .catch(() => null),
      this.dashboardService
        .getTransactionsSummary()
        .toPromise()
        .catch(() => null),
      this.adminAccountService
        .getAccounts({ size: 5000 })
        .toPromise()
        .then((r) => r?.content ?? [])
        .catch(() => []),
      this.loadRecentTransactions()
        .toPromise()
        .catch(() => []),
    ])
      .then(
        ([
          dashboardStats,
          accountStats,
          transactionsSummary,
          accounts,
          recentTransactions,
        ]) => {
          this.accountIdToCustomerName = {};
          if (Array.isArray(accounts)) {
            for (const acc of accounts) {
              const name =
                (acc as any).customerName ||
                (acc as any).customerDTO?.name ||
                "Not available";
              this.accountIdToCustomerName[acc.id] = name;
            }
          }

          if (dashboardStats) {
            this.stats = {
              ...dashboardStats,
              totalAccounts:
                accountStats?.totalAccounts || dashboardStats.totalAccounts,
              totalBalance:
                accountStats?.totalBalance || dashboardStats.totalBalance,
              totalTransactions:
                transactionsSummary?.totalTransactions ||
                dashboardStats.totalTransactions,
              pendingTransactions:
                transactionsSummary?.pendingTransactions ||
                dashboardStats.pendingTransactions,
            };
          } else {
            this.stats = {
              totalCustomers: 0,
              totalAccounts: accountStats?.totalAccounts || 0,
              totalBalance: accountStats?.totalBalance || 0,
              totalTransactions: transactionsSummary?.totalTransactions || 0,
              activeCustomers: 0,
              pendingTransactions:
                transactionsSummary?.pendingTransactions || 0,
              monthlyGrowth: 0,
              revenueGrowth: 0,
            };
          }

          if (!this.stats.totalTransactions) {
            this.loadTransactionCountFallback();
          }

          this.recentTransactions = recentTransactions || [];
          this.loading = false;

          console.log("Admin Dashboard Stats:", this.stats);
          console.log("Transactions Summary:", transactionsSummary);

          setTimeout(() => {
            this.updateChartsWithRealData(transactionsSummary);
            this.updateAccountTypesChart(accountStats);
          }, 200);
        },
      )
      .catch((error) => {
        console.error("Error loading dashboard data:", error);
        this.error = "Failed to load dashboard data. Please try again.";
        this.loading = false;
      });
  }

  private loadRecentTransactions(): Observable<any[]> {
    return this.accountService
      .getTransactions({
        page: 0,
        size: 5,
        sortBy: "operationDate",
        sortDirection: "desc",
      })
      .pipe(
        map((response: any) => response.content || []),
        tap((transactions: any[]) => {
          console.log(
            "Admin Dashboard - Recent transactions loaded:",
            transactions,
          );
        }),
      );
  }

  private loadTransactionCountFallback(): void {
    this.accountService
      .getTransactions({
        page: 0,
        size: 1,
        sortBy: "operationDate",
        sortDirection: "desc",
      })
      .subscribe({
        next: (response: any) => {
          if (response && response.totalElements !== undefined) {
            this.stats.totalTransactions = response.totalElements;
            console.log(
              "Fallback transaction count loaded:",
              response.totalElements,
            );
          }
        },
        error: (error) => {
          console.error("Error loading transaction count fallback:", error);
        },
      });
  }

  getTransactionTypeBadge(type: string): string {
    switch (type?.toUpperCase()) {
      case "DEPOSIT":
        return "bg-success";
      case "WITHDRAWAL":
        return "bg-danger";
      case "TRANSFER":
        return "bg-primary";
      default:
        return "bg-secondary";
    }
  }

  getAmountClass(type: string): string {
    switch (type?.toUpperCase()) {
      case "DEPOSIT":
        return "text-success";
      case "WITHDRAWAL":
        return "text-danger";
      case "TRANSFER":
        return "text-primary";
      default:
        return "";
    }
  }

  getCustomerName(transaction: any): string {
    if (transaction.customer && transaction.customer.username) {
      return transaction.customer.username;
    }
    if (transaction.customer && transaction.customer.name) {
      return transaction.customer.name;
    }
    if (transaction.customerName) {
      return transaction.customerName;
    }
    const accountId = transaction.bankAccountId ?? transaction.accountId ?? "";
    if (accountId && this.accountIdToCustomerName[accountId]) {
      return this.accountIdToCustomerName[accountId];
    }
    if (
      transaction.performedBy === "system-demo" ||
      transaction.performedBy === "system"
    ) {
      return "Not available";
    }
    if (transaction.performedBy) {
      return transaction.performedBy;
    }
    return "Not available";
  }

  private initializeCharts(): void {
    this.createAccountTypesChart();
    this.createTransactionVolumeChart();
  }

  private updateChartsWithRealData(transactionsSummary: any): void {
    console.log("Updating charts with real data:", transactionsSummary);

    if (this.transactionVolumeChart) {
      const byType = transactionsSummary?.transactionsByType || {};
      const realData = [byType.CREDIT || 0, byType.DEBIT || 0];

      console.log("Chart data being set:", realData);
      this.transactionVolumeChart.data.datasets[0].data = realData;
      this.transactionVolumeChart.update("active");
    } else {
      console.warn("Transaction volume chart not initialized");
    }
  }

  private updateAccountTypesChart(accountStats: any): void {
    if (!this.accountTypesChart) return;
    const byType = accountStats?.accountsByType || {};
    this.accountTypesChart.data.datasets[0].data = [
      byType.CurrentAccount || 0,
      byType.SavingAccount || 0,
    ];
    this.accountTypesChart.update("active");
  }

  private createAccountTypesChart(): void {
    const ctx = document.getElementById(
      "accountTypesChart",
    ) as HTMLCanvasElement;
    if (ctx) {
      this.accountTypesChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Current", "Savings"],
          datasets: [
            {
              data: [0, 0],
              backgroundColor: ["#1f368b", "#3b51d5"],
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      });
    }
  }

  private createTransactionVolumeChart(): void {
    const ctx = document.getElementById(
      "transactionVolumeChart",
    ) as HTMLCanvasElement;
    if (ctx) {
      this.transactionVolumeChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Credit", "Debit"],
          datasets: [
            {
              label: "Transaction Count",
              data: [0, 0], // Start with zeros, will be updated with real data
              backgroundColor: ["#3b51d5", "#1f368b"],
              borderColor: ["#3b51d5", "#1f368b"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return context.parsed.y + " transactions";
                },
              },
            },
          },
        },
      });
    }
  }

  exportReport(): void {
    this.exportingReport = true;

    const csvContent = this.generateCSVReport();

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `admin-report-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      this.exportingReport = false;
    }, 1000);
  }

  private generateCSVReport(): string {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Customers", (this.stats.totalCustomers || 0).toString()],
      ["Total Accounts", (this.stats.totalAccounts || 0).toString()],
      ["Total Balance", (this.stats.totalBalance || 0).toString()],
      ["Total Transactions", (this.stats.totalTransactions || 0).toString()],
      ["Active Customers", (this.stats.activeCustomers || 0).toString()],
      [
        "Pending Transactions",
        (this.stats.pendingTransactions || 0).toString(),
      ],
      ["Monthly Growth %", (this.stats.monthlyGrowth || 0).toString()],
      ["Revenue Growth %", (this.stats.revenueGrowth || 0).toString()],
      ["Report Generated", new Date().toISOString()],
    ];

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    return csvContent;
  }
}
