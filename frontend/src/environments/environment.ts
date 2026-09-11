export const environment = {
  production: false,
  apiUrl: "http://localhost:8080/api",
  useMockApi: false, // Set to true to use mock data during development
  appName: "E-Bank",
  version: "1.0.0",
  cloudinary: { cloudName: "", uploadPreset: "" },
  tokenKey: "digital-banking-token",
  endpoints: {
    auth: {
      login: "/auth/login",
      register: "/auth/register",
      refresh: "/auth/refresh",
      changePassword: "/auth/change-password",
      profile: "/auth/profile",
    },
    admin: {
      users: "/admin/users",
      customers: "/admin/customers",
      accounts: "/admin/accounts",
      usersByRole: "/admin/users/role",
      userStatus: "/admin/users",
      dashboard: "/admin/dashboard",
    },
    customer: {
      accounts: "/customer/accounts",
      transactions: "/customer/transactions",
      dashboard: "/customer/dashboard",
    },
    customers: "/customers",
    accounts: "/accounts",
    transactions: "/transactions",
    dashboard: "/dashboard",
    operations: {
      debit: "/accounts",
      credit: "/accounts",
      transfer: "/accounts",
      history: "/accounts",
    },
    reports: {
      reconciliation: "/reports/reconciliation",
    },
  },
  testCredentials: {
    admin: { username: "admin", password: "password" },
    customers: [
      { username: "marie.dupont", password: "password" },
      { username: "jean.martin", password: "password" },
      { username: "sophie.bernard", password: "password" },
    ],
  },
};
