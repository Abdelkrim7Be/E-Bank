export const environment = {
  production: true,
  testCredentials: { customers: [] as { username: string; password: string }[] },
  // In Docker, Nginx proxies /api/ to the gateway service
  apiUrl: "/api",
  useMockApi: false,
  appName: "E-Bank",
  version: "1.0.0",
  cloudinary: { cloudName: "", uploadPreset: "" },
  tokenKey: "digital-banking-token",
  // Backend endpoint configuration matching TODO.md specifications
  endpoints: {
    // Public endpoints
    auth: {
      login: "/auth/login",
      register: "/auth/register",
      refresh: "/auth/refresh",
      changePassword: "/auth/change-password",
      profile: "/auth/profile",
    },
    // Admin only endpoints
    admin: {
      users: "/admin/users",
      accounts: "/admin/accounts",
      customers: "/admin/customers",
      usersByRole: "/admin/users/role",
      userStatus: "/admin/users",
      dashboard: "/admin/dashboard",
    },
    // Customer endpoints
    customer: {
      accounts: "/customer/accounts",
      transactions: "/customer/transactions",
      dashboard: "/customer/dashboard",
    },
    // Admin + Customer endpoints
    customers: "/customers",
    accounts: "/accounts",
    transactions: "/transactions",
    dashboard: "/dashboard",
    // Banking operations
    operations: {
      debit: "/accounts",
      credit: "/accounts",
      transfer: "/accounts",
      history: "/accounts",
    },
  },
};
