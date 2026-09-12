export const MOCK_DATA = {
  '/api/accounts': [
    {
      id: 1,
      accountNumber: 'ACCT-10001',
      accountType: 'SAVINGS',
      balance: 5420.75,
      currency: 'USD',
      userId: 101,
      createdDate: '2023-01-15T10:30:00',
    },
    {
      id: 2,
      accountNumber: 'ACCT-10002',
      accountType: 'CHECKING',
      balance: 1250.5,
      currency: 'USD',
      userId: 101,
      createdDate: '2023-01-17T14:20:00',
    },
  ],

  '/api/users/current': {
    id: 101,
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    address: '123 Main Street, New York',
    createdDate: '2023-01-10T09:15:00',
  },

  '/api/transactions': [
    {
      id: 1001,
      amount: 250.0,
      type: 'DEPOSIT',
      description: 'Salary deposit',
      accountId: 1,
      timestamp: '2023-02-01T08:30:00',
      status: 'COMPLETED',
    },
    {
      id: 1002,
      amount: 75.5,
      type: 'WITHDRAWAL',
      description: 'ATM withdrawal',
      accountId: 1,
      timestamp: '2023-02-03T14:45:00',
      status: 'COMPLETED',
    },
    {
      id: 1003,
      amount: 120.25,
      type: 'TRANSFER',
      description: 'Transfer to checking account',
      accountId: 1,
      timestamp: '2023-02-05T10:15:00',
      status: 'COMPLETED',
    },
  ],

  '/api/transactions/transfer': {
    id: 1004,
    amount: 100.0,
    type: 'TRANSFER',
    description: 'Transfer to another account',
    accountId: 1,
    timestamp: new Date().toISOString(),
    status: 'COMPLETED',
  },

  // Auth-related mock data for SSR
  'auth': {
    user: {
      id: 101,
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      roles: ['ROLE_USER']
    },
    token: 'mock-jwt-token-for-testing'
  },
};
