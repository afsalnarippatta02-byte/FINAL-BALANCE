import { BudgetCategory, CreditCard, Transaction, SyncRecord, FriendLoan } from '../types/finance';

export const getOffsetDate = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const INITIAL_CATEGORIES: BudgetCategory[] = [
  {
    id: 'cat-housing',
    name: 'Housing & Rent',
    monthlyBudget: 3500,
    iconName: 'Home',
    color: '#6366F1',
  },
  {
    id: 'cat-groceries',
    name: 'Groceries & Mart',
    monthlyBudget: 1200,
    iconName: 'ShoppingBag',
    color: '#10B981',
  },
  {
    id: 'cat-dining',
    name: 'Dining & Cafes',
    monthlyBudget: 750,
    iconName: 'Utensils',
    color: '#F59E0B',
  },
  {
    id: 'cat-transit',
    name: 'Transit & Fuel',
    monthlyBudget: 450,
    iconName: 'Car',
    color: '#06B6D4',
  },
  {
    id: 'cat-utilities',
    name: 'Utilities & Bills',
    monthlyBudget: 500,
    iconName: 'Zap',
    color: '#8B5CF6',
  },
  {
    id: 'cat-entertainment',
    name: 'Entertainment & Subs',
    monthlyBudget: 300,
    iconName: 'Tv',
    color: '#EC4899',
  },
  {
    id: 'cat-health',
    name: 'Healthcare & Pharma',
    monthlyBudget: 280,
    iconName: 'HeartPulse',
    color: '#14B8A6',
  },
  {
    id: 'cat-shopping',
    name: 'Retail & Electronics',
    monthlyBudget: 600,
    iconName: 'Package',
    color: '#64748B',
  },
];

// Clean empty initial state for user's real financial records
export const INITIAL_CARDS: CreditCard[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_SYNC_LOGS: SyncRecord[] = [];
export const INITIAL_FRIEND_LOANS: FriendLoan[] = [];

