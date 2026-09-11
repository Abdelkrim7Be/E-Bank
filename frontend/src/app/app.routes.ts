import { Routes } from "@angular/router";
import {
  AuthGuard,
  AdminGuard,
  CustomerGuard,
  GuestGuard,
} from "./auth/guards/auth.guard";
import { UserRole } from "./auth/models/auth.model";
import { AuthDiagnosticComponent } from "./debug/auth-diagnostic.component";

export const routes: Routes = [
  { path: "", redirectTo: "/auth/login", pathMatch: "full" },
  { path: "diagnostic", component: AuthDiagnosticComponent },
  {
    path: "auth",
    canActivate: [GuestGuard],
    children: [
      {
        path: "login",
        loadComponent: () =>
          import("./auth/components/login/login.component").then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: "register",
        loadComponent: () =>
          import("./auth/components/register/register.component").then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: "",
        redirectTo: "login",
        pathMatch: "full",
      },
    ],
  },

  {
    path: "admin",
    canActivate: [AdminGuard],
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./admin/components/dashboard/admin-dashboard.component").then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: "customers",
        loadComponent: () =>
          import("./admin/components/customers/customer-list.component").then(
            (m) => m.CustomerListComponent,
          ),
      },
      {
        path: "customers/new",
        loadComponent: () =>
          import("./admin/components/customers/customer-form.component").then(
            (m) => m.AdminCustomerFormComponent,
          ),
      },
      {
        path: "customers/:id/edit",
        loadComponent: () =>
          import("./admin/components/customers/customer-form.component").then(
            (m) => m.AdminCustomerFormComponent,
          ),
      },
      {
        path: "customers/:id",
        loadComponent: () =>
          import("./admin/components/customers/customer-details.component").then(
            (m) => m.AdminCustomerDetailsComponent,
          ),
      },
      {
        path: "accounts",
        loadComponent: () =>
          import("./admin/components/accounts/account-list.component").then(
            (c) => c.AdminAccountListComponent,
          ),
      },
      {
        path: "accounts/new",
        loadComponent: () =>
          import("./admin/components/accounts/account-form.component").then(
            (m) => m.AdminAccountFormComponent,
          ),
      },
      {
        path: "accounts/:id/edit",
        loadComponent: () =>
          import("./admin/components/accounts/account-form.component").then(
            (m) => m.AdminAccountFormComponent,
          ),
      },
      {
        path: "accounts/:id",
        loadComponent: () =>
          import("./admin/components/accounts/account-details.component").then(
            (m) => m.AdminAccountDetailsComponent,
          ),
      },
      {
        path: "transactions",
        loadComponent: () =>
          import("./admin/components/transactions/admin-transactions.component").then(
            (c) => c.AdminTransactionsComponent,
          ),
      },
      {
        path: "reports",
        loadComponent: () =>
          import("./admin/components/reports/reports.component").then(
            (m) => m.AdminReportsComponent,
          ),
      },
      {
        path: "transfer",
        loadComponent: () =>
          import("./transfer/transfer.component").then(
            (c) => c.TransferComponent,
          ),
      },
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
    ],
  },
  {
    path: "customer",
    canActivate: [CustomerGuard],
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./customer/components/dashboard/customer-dashboard.component").then(
            (m) => m.CustomerDashboardComponent,
          ),
      },
      {
        path: "deposit",
        loadComponent: () =>
          import("./customer/components/transactions/customer-deposit.component").then(
            (c) => c.CustomerDepositComponent,
          ),
      },
      {
        path: "deposit/:accountId",
        loadComponent: () =>
          import("./customer/components/transactions/customer-deposit.component").then(
            (c) => c.CustomerDepositComponent,
          ),
      },
      {
        path: "debit",
        loadComponent: () =>
          import("./customer/components/transactions/customer-debit.component").then(
            (c) => c.CustomerDebitComponent,
          ),
      },
      {
        path: "debit/:accountId",
        loadComponent: () =>
          import("./customer/components/transactions/customer-debit.component").then(
            (c) => c.CustomerDebitComponent,
          ),
      },
      {
        path: "withdraw",
        redirectTo: "debit",
        pathMatch: "full",
      },
      {
        path: "withdraw/:accountId",
        redirectTo: "debit/:accountId",
        pathMatch: "full",
      },
      {
        path: "accounts",
        loadComponent: () =>
          import("./customer/components/accounts/customer-accounts.component").then(
            (c) => c.CustomerAccountsComponent,
          ),
      },
      {
        path: "accounts/new",
        loadComponent: () =>
          import("./customer/components/accounts/customer-account-form.component").then(
            (c) => c.CustomerAccountFormComponent,
          ),
      },
      {
        path: "accounts/:id",
        loadComponent: () =>
          import("./customer/components/accounts/customer-account-details.component").then(
            (c) => c.CustomerAccountDetailsComponent,
          ),
      },
      {
        path: "transaction-history",
        loadComponent: () =>
          import("./customer/components/transactions/customer-transactions.component").then(
            (c) => c.CustomerTransactionsComponent,
          ),
      },
      {
        path: "transfer",
        loadComponent: () =>
          import("./customer/components/transactions/customer-transfer.component").then(
            (c) => c.CustomerTransferComponent,
          ),
      },
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
    ],
  },

  {
    path: "profile",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./shared/components/profile/profile.component").then(
        (m) => m.ProfileComponent,
      ),
  },
  {
    path: "unauthorized",
    loadComponent: () =>
      import("./shared/components/error/unauthorized.component").then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  {
    path: "not-found",
    loadComponent: () =>
      import("./core/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
  { path: "**", redirectTo: "/not-found" },
];
