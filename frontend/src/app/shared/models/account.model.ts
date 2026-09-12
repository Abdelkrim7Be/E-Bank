export interface Account {
  id: string | number; // Backend returns string, but some places expect number
  accountNumber?: string;
  accountType?: AccountType;
  type?: string; // Backend field name
  balance: number;
  currency?: string;
  status: AccountStatus | string;
  customerId?: number;
  customerName?: string;
  createdDate?: string;
  createDate?: string; // Backend field name
  lastModifiedDate?: string;
  interestRate?: number;
  overdraftLimit?: number;
  overDraft?: number; // Backend field name for current accounts
  createdBy?: string;
  lastModifiedBy?: string;
  version?: number;
  customerDTO?: any; // Backend includes customer info
}

export type BankAccount = Account;

export interface CreateAccountDto {
  accountType: AccountType;
  customerId: number;
  initialDeposit: number;
  currency?: string;
}

export interface UpdateAccountDto {
  status?: AccountStatus;
  interestRate?: number;
  overdraftLimit?: number;
}

export enum AccountType {
  SAVINGS = 'SAVINGS',
  CHECKING = 'CHECKING',
  CURRENT = 'CURRENT', // Alternative name for CHECKING used in some backends
  BUSINESS = 'BUSINESS',
  INVESTMENT = 'INVESTMENT',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

export interface AccountSummary {
  totalAccounts: number;
  totalBalance: number;
  accountsByType: { [key: string]: number };
  recentTransactions: Transaction[];
}

export interface Transaction {
  id: number;
  accountId: string | number; // Support both string UUIDs and numeric IDs
  accountNumber?: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description: string;
  reference?: string;
  status: TransactionStatus;
  operationDate: string;
  processedDate?: string;
  fromAccountId?: string | number;
  toAccountId?: string | number;
  fromAccountNumber?: string;
  toAccountNumber?: string;
  requestId?: string;
}

export interface CreateTransactionDto {
  accountId: number;
  type: TransactionType;
  amount: number;
  description: string;
  reference?: string;
  toAccountId?: number; // For transfers
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  FEE = 'FEE',
  INTEREST = 'INTEREST',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface TransferRequest {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  description: string;
  reference?: string;
}

export interface DepositRequest {
  accountId: number;
  amount: number;
  description: string;
  reference?: string;
}

export interface WithdrawalRequest {
  accountId: number;
  amount: number;
  description: string;
  reference?: string;
}

export interface TransactionFilter {
  accountId?: string | number; // Support both string UUIDs and numeric IDs
  type?: TransactionType | string; // Support both enum and string values
  status?: TransactionStatus | string; // Support both enum and string values
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
