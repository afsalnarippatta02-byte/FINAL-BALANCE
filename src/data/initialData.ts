import { BudgetCategory, CreditCard, Transaction, SyncRecord } from '../types/finance';

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

// Retained as optional demo fixtures if user requests demo data
export const SAMPLE_DEMO_CARDS: CreditCard[] = [
  {
    id: 'card-enbd',
    name: 'Emirates NBD Duo',
    bankName: 'Emirates NBD (UAE)',
    last4: '4892',
    currentBalance: 2450.00,
    creditLimit: 12000,
    apr: 22.00,
    statementDueDate: getOffsetDate(4),
    statementBalance: 2150.00,
    minimumPayment: 110.00,
    colorTheme: 'from-slate-900 via-blue-950 to-indigo-900',
    isAutoSyncEnabled: true,
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    isPaidForCycle: false,
  },
  {
    id: 'card-hdfc',
    name: 'HDFC Regalia Gold',
    bankName: 'HDFC Bank (India)',
    last4: '9104',
    currentBalance: 8400.00,
    creditLimit: 10000,
    apr: 24.50,
    statementDueDate: getOffsetDate(12),
    statementBalance: 7800.00,
    minimumPayment: 420.00,
    colorTheme: 'from-sky-950 via-cyan-900 to-slate-900',
    isAutoSyncEnabled: true,
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    isPaidForCycle: false,
  },
  {
    id: 'card-mashreq',
    name: 'Mashreq Platinum Cashback',
    bankName: 'Mashreq Bank (UAE)',
    last4: '6172',
    currentBalance: 0.00,
    creditLimit: 8500,
    apr: 21.00,
    statementDueDate: getOffsetDate(20),
    statementBalance: 0.00,
    minimumPayment: 0.00,
    colorTheme: 'from-zinc-900 via-neutral-800 to-stone-900',
    isAutoSyncEnabled: true,
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    isPaidForCycle: true,
  },
];

export const SAMPLE_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    date: getOffsetDate(0),
    amount: 185.50,
    merchant: 'Lulu Hypermarket',
    categoryId: 'cat-groceries',
    accountId: 'card-enbd',
    status: 'pending',
    type: 'expense',
    notes: 'Weekly fresh produce & kitchen pantry',
  },
  {
    id: 'tx-2',
    date: getOffsetDate(-1),
    amount: 32.00,
    merchant: 'Carrefour Express',
    categoryId: 'cat-groceries',
    accountId: 'card-mashreq',
    status: 'cleared',
    type: 'expense',
  },
  {
    id: 'tx-3',
    date: getOffsetDate(-1),
    amount: 120.00,
    merchant: 'ENOC Petrol Station',
    categoryId: 'cat-transit',
    accountId: 'card-enbd',
    status: 'cleared',
    type: 'expense',
    notes: 'Fuel top-up',
  },
];

export const SAMPLE_DEMO_SYNC_LOGS: SyncRecord[] = [
  {
    id: 'sync-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    cardName: 'Emirates NBD Duo',
    transactionsImported: 2,
    totalAmount: 305.50,
    status: 'completed',
  },
];

export const SIMULATED_MERCHANT_FEED = [
  { merchant: 'Lulu Hypermarket', categoryId: 'cat-groceries', amountMin: 65, amountMax: 280, accountId: 'card-enbd' },
  { merchant: 'Carrefour Market', categoryId: 'cat-groceries', amountMin: 45, amountMax: 210, accountId: 'card-enbd' },
  { merchant: 'ENOC / Emarat Fuel', categoryId: 'cat-transit', amountMin: 80, amountMax: 160, accountId: 'card-enbd' },
  { merchant: 'Swiggy Gourmet Dining', categoryId: 'cat-dining', amountMin: 60, amountMax: 180, accountId: 'card-hdfc' },
  { merchant: 'DEWA / Electricity Board', categoryId: 'cat-utilities', amountMin: 180, amountMax: 420, accountId: 'card-enbd' },
  { merchant: 'Noon / Amazon India', categoryId: 'cat-shopping', amountMin: 90, amountMax: 350, accountId: 'card-hdfc' },
  { merchant: 'Aster / Apollo Healthcare', categoryId: 'cat-health', amountMin: 40, amountMax: 150, accountId: 'card-hdfc' },
];
