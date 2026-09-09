export const environment = {
  production: false,
  // Point Angular to the API Gateway, not the monolith
  apiUrl: "http://localhost:8080/api",
  useMockApi: false, // Set to true to use mock data during development
  appName: "E-Bank",
  version: "1.0.0",
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
      customers: "/admin/customers",
      accounts: "/admin/accounts",
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
  // Test credentials from TODO.md
  testCredentials: {
    // Match seeded users in customer-service (see DemoDataLoader logs)
    admin: { username: "admin", password: "password" },
    customers: [
      { username: "marie.dupont", password: "password" },
      { username: "jean.martin", password: "password" },
      { username: "sophie.bernard", password: "password" },
    ],
  },
};
