
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: "ADMIN" | "CUSTOMER";
  name?: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
  email: string;
  message?: string;
}

export interface CustomerDTO {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdDate?: Date;
  bankAccounts?: BankAccountDTO[];
}

export interface BankAccountDTO {
  id: string;
  balance: number;
  createDate: Date;
  status: "CREATED" | "ACTIVATED" | "SUSPENDED" | "BLOCKED";
  customer: CustomerDTO;
  type: "CURRENT" | "SAVING";
  customerUsername?: string; // Added for dropdown selection
  customerName?: string; // Added for better display
}

export interface CurrentBankAccountDTO extends BankAccountDTO {
  overDraft: number;
}

export interface SavingBankAccountDTO extends BankAccountDTO {
  interestRate: number;
}

export interface AccountOperationDTO {
  id: number;
  operationDate: Date;
  amount: number;
  description: string;
  type: "CREDIT" | "DEBIT";
}

export interface DebitRequest {
  amount: number;
  description: string;
}

export interface CreditRequest {
  amount: number;
  description: string;
}

export interface AccountSelectionDTO {
  accountId: string;
  customerUsername: string;
  customerName: string;
  accountType: string;
  balance: number;
  status: "CREATED" | "ACTIVATED" | "SUSPENDED" | "BLOCKED";
  displayText?: string; // Computed display format
}

export interface TransferRequestDTO {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description?: string;
}

export interface TransferRequest {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description: string;
}

export interface BankingStatsDTO {
  totalCustomers: number;
  totalAccounts: number;
  totalBalance: number;
  totalCurrentAccounts: number;
  totalSavingAccounts: number;
  totalOperations: number;
}

export interface AccountsSummaryDTO {
  totalAccounts: number;
  totalCurrentAccounts: number;
  totalSavingAccounts: number;
  totalBalance: number;
  averageBalance: number;
}

export interface CustomersSummaryDTO {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  customersWithAccounts: number;
}

export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
  direction?: "ASC" | "DESC";
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface CustomerSearchRequest {
  name?: string;
  email?: string;
  phone?: string;
  page?: number;
  size?: number;
}

export interface AccountSearchRequest {
  customerId?: number;
  accountType?: "CURRENT" | "SAVING";
  status?: "CREATED" | "ACTIVATED" | "SUSPENDED" | "BLOCKED";
  minBalance?: number;
  maxBalance?: number;
  page?: number;
  size?: number;
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  enabled: boolean;
  createdDate: Date;
  lastLoginDate?: Date;
}

export interface UserStatusUpdateRequest {
  enabled: boolean;
}

export interface CreateCurrentAccountRequest {
  initialBalance: number;
  overDraft: number;
  customerId: number;
}

export interface CreateSavingAccountRequest {
  initialBalance: number;
  interestRate: number;
  customerId: number;
}

export interface TransactionHistoryRequest {
  accountId: string;
  page?: number;
  size?: number;
  startDate?: Date;
  endDate?: Date;
  operationType?: "CREDIT" | "DEBIT";
}

export interface TransactionHistoryResponse {
  accountId: string;
  balance: number;
  operations: AccountOperationDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface HealthCheckResponse {
  status: "UP" | "DOWN";
  database: "UP" | "DOWN";
  diskSpace: "UP" | "DOWN";
  timestamp: Date;
}

export interface ErrorResponse {
  timestamp: Date;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface ExportRequest {
  format: "CSV" | "PDF" | "EXCEL";
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  customerId?: number;
}

export interface NotificationDTO {
  id: number;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  read: boolean;
  createdDate: Date;
  userId: number;
}

export interface ChartDataDTO {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export interface AccountDistributionDTO {
  accountType: "CURRENT" | "SAVING";
  count: number;
  percentage: number;
  totalBalance: number;
}

export interface MonthlyTransactionVolumeDTO {
  month: string;
  year: number;
  totalTransactions: number;
  totalAmount: number;
  creditTransactions: number;
  debitTransactions: number;
}

export interface ValidationErrorDTO {
  field: string;
  message: string;
  rejectedValue: any;
}

export interface ValidationResponse {
  valid: boolean;
  errors: ValidationErrorDTO[];
}
