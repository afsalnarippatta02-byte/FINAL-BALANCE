export type TransactionStatus = 'cleared' | 'pending';
export type TransactionType = 'expense' | 'income' | 'payment';
export type CurrencyCode = 'AED' | 'INR';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  merchant: string;
  categoryId: string;
  accountId: string; // matches CreditCard.id or 'checking'
  status: TransactionStatus;
  type: TransactionType;
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  monthlyBudget: number;
  iconName: string;
  color: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bankName: string;
  last4: string;
  currentBalance: number;
  creditLimit: number;
  apr: number; // e.g. 21.99
  statementDueDate: string; // YYYY-MM-DD
  statementBalance: number;
  minimumPayment: number;
  colorTheme: string; // css gradient or hex
  isAutoSyncEnabled: boolean;
  lastSyncedAt?: string;
  isPaidForCycle?: boolean; // When paid early, suppress reminders & notifications
}

export interface DebtAlert {
  id: string;
  cardId?: string;
  categoryId?: string;
  type: 'due_soon' | 'overdue' | 'high_utilization' | 'over_budget';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  dueDate?: string;
  daysRemaining?: number;
}

export interface DueDateAlert {
  card: CreditCard;
  daysRemaining: number;
  dueDate: string;
  amountDue: number;
  isUrgent: boolean;
  badgeLabel: string;
}

export interface SyncRecord {
  id: string;
  timestamp: string;
  cardName: string;
  transactionsImported: number;
  totalAmount: number;
  status: 'completed' | 'failed';
}

export type FriendLoanStatus = 'pending' | 'returned';

export interface FriendLoan {
  id: string;
  friendName: string;
  cardId: string; // CreditCard.id used for the friend's charge
  amount: number;
  swipeDate: string; // YYYY-MM-DD
  expectedReturnDate: string; // YYYY-MM-DD
  actualReturnDate?: string; // YYYY-MM-DD
  status: FriendLoanStatus;
  purpose: string; // e.g. "Flight Ticket", "iPhone purchase", "Emergency shopping"
  notes?: string;
  repaymentMethod?: 'direct_to_card' | 'cash_or_bank_transfer';
}
