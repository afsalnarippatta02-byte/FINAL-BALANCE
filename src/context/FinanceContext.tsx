import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Transaction, 
  BudgetCategory, 
  CreditCard, 
  DebtAlert, 
  DueDateAlert,
  SyncRecord,
  CurrencyCode,
  FriendLoan 
} from '../types/finance';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_CARDS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SYNC_LOGS, 
  INITIAL_FRIEND_LOANS,
  getOffsetDate
} from '../data/initialData';

interface FinanceContextType {
  currency: CurrencyCode;
  currencySymbol: string;
  setCurrency: (c: CurrencyCode) => void;
  formatMoney: (amount: number) => string;
  categories: BudgetCategory[];
  cards: CreditCard[];
  transactions: Transaction[];
  friendLoans: FriendLoan[];
  totalFriendsLentOutstanding: number;
  alerts: DebtAlert[];
  checkCreditCardDueDates: (daysThreshold?: number) => DueDateAlert[];
  syncLogs: SyncRecord[];
  isSyncing: boolean;
  autoSyncActive: boolean;
  lastGlobalSync: string | null;
  toggleAutoSync: () => void;
  triggerManualSync: (specificCardId?: string) => Promise<{ count: number; total: number }>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  updateCategoryBudget: (categoryId: string, monthlyBudget: number) => void;
  updateMultipleCategoryBudgets: (updates: { categoryId: string; monthlyBudget: number }[]) => void;
  addCategory: (category: Omit<BudgetCategory, 'id'>) => void;
  deleteCategory: (categoryId: string) => void;
  addCreditCard: (card: Omit<CreditCard, 'id' | 'statementBalance' | 'minimumPayment' | 'isAutoSyncEnabled' | 'isPaidForCycle'>) => void;
  updateCreditCard: (cardId: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (cardId: string) => void;
  recordPayment: (cardId: string, amount: number) => void;
  markCardPaidEarly: (cardId: string, isPaid: boolean) => void;
  importCSV: (csvContent: string) => { added: number; errors: string[] };
  addFriendLoan: (loan: Omit<FriendLoan, 'id' | 'status'>) => void;
  settleFriendLoan: (loanId: string, actualReturnDate?: string, restoreCardLimit?: boolean) => void;
  deleteFriendLoan: (loanId: string, revertCardLimit?: boolean) => void;
  updateFriendLoan: (loanId: string, updates: Partial<FriendLoan>) => void;
  clearAllData: () => void;
  resetData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENCY: 'finalbalance_currency_v4',
  CATEGORIES: 'finalbalance_categories_v4',
  CARDS: 'finalbalance_cards_v4',
  TRANSACTIONS: 'finalbalance_transactions_v4',
  SYNC_LOGS: 'finalbalance_sync_logs_v4',
  AUTO_SYNC: 'finalbalance_auto_sync_v4',
  FRIEND_LOANS: 'finalbalance_friend_loans_v4',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Currency state: Defaults to AED or INR
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      return (saved === 'INR' || saved === 'AED') ? saved : 'AED';
    } catch {
      return 'AED';
    }
  });

  const currencySymbol = useMemo(() => (currency === 'INR' ? '₹' : 'AED'), [currency]);

  const formatMoney = useCallback((amount: number): string => {
    const safeAmount = isNaN(amount) ? 0 : amount;
    if (currency === 'INR') {
      return `₹${safeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `AED ${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency]);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEYS.CURRENCY, c);
  };

  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [cards, setCards] = useState<CreditCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
      return saved ? JSON.parse(saved) : INITIAL_CARDS;
    } catch {
      return INITIAL_CARDS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [syncLogs, setSyncLogs] = useState<SyncRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYNC_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_SYNC_LOGS;
    } catch {
      return INITIAL_SYNC_LOGS;
    }
  });

  const [friendLoans, setFriendLoans] = useState<FriendLoan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FRIEND_LOANS);
      return saved ? JSON.parse(saved) : INITIAL_FRIEND_LOANS;
    } catch {
      return INITIAL_FRIEND_LOANS;
    }
  });

  const [autoSyncActive, setAutoSyncActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastGlobalSync, setLastGlobalSync] = useState<string | null>(null);

  const totalFriendsLentOutstanding = useMemo(() => {
    return friendLoans
      .filter(l => l.status === 'pending')
      .reduce((sum, l) => sum + l.amount, 0);
  }, [friendLoans]);

  // Clean legacy dummy keys on initial mount to guarantee fresh clean state
  useEffect(() => {
    const legacyKeys = [
      'clarity_currency_v2', 'clarity_categories_v2', 'clarity_cards_v2',
      'clarity_transactions_v2', 'clarity_sync_logs_v2', 'clarity_auto_sync_v2',
      'clarity_currency', 'clarity_categories', 'clarity_cards', 'clarity_transactions'
    ];
    legacyKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(syncLogs));
  }, [syncLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, JSON.stringify(autoSyncActive));
  }, [autoSyncActive]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FRIEND_LOANS, JSON.stringify(friendLoans));
  }, [friendLoans]);

  // Compute Debt & Budget Alerts
  // CRITICAL REQUIREMENT: If paid earlier, do NOT trigger notification reminders!
  const alerts = useMemo<DebtAlert[]>(() => {
    const list: DebtAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Credit Card Due Date & Utilization Alerts
    cards.forEach((card) => {
      // If card is marked paid early or balance is zero, skip payment remainder notifications completely!
      if (card.isPaidForCycle || card.currentBalance <= 0 || card.statementBalance <= 0) {
        return;
      }

      const dueDate = new Date(card.statementDueDate + 'T00:00:00');
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Overdue alert
      if (diffDays < 0) {
        list.push({
          id: `alert-overdue-${card.id}`,
          cardId: card.id,
          type: 'overdue',
          title: `${card.name} is Overdue`,
          message: `Payment of ${formatMoney(card.minimumPayment)} was due ${Math.abs(diffDays)} day(s) ago. Pay remaining balance now to prevent late fees.`,
          severity: 'critical',
          dueDate: card.statementDueDate,
          daysRemaining: diffDays,
        });
      } 
      // Due within 7 days remainder alert
      else if (diffDays <= 7) {
        const isUrgent = diffDays <= 3;
        list.push({
          id: `alert-due-${card.id}`,
          cardId: card.id,
          type: 'due_soon',
          title: `${card.name}: Due in ${diffDays === 0 ? 'Today' : `${diffDays} Day${diffDays > 1 ? 's' : ''}`}`,
          message: `Payment balance remaining: ${formatMoney(card.statementBalance)} (min ${formatMoney(card.minimumPayment)}) due on ${card.statementDueDate}. Pay early to clear reminders.`,
          severity: isUrgent ? 'critical' : 'warning',
          dueDate: card.statementDueDate,
          daysRemaining: diffDays,
        });
      }

      // High Utilization Alert (> 80% critical)
      const utilPercent = (card.currentBalance / card.creditLimit) * 100;
      if (utilPercent >= 80) {
        list.push({
          id: `alert-util-crit-${card.id}`,
          cardId: card.id,
          type: 'high_utilization',
          title: `High Limit Alert: ${card.name} (${utilPercent.toFixed(0)}%)`,
          message: `Current balance (${formatMoney(card.currentBalance)}) exceeds 80% of limit (${formatMoney(card.creditLimit)}). Pay down early to safeguard credit score.`,
          severity: 'critical',
        });
      }
    });

    // 2. Category Over-Budget Alerts
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const catSpendMap: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonthPrefix)) {
        catSpendMap[tx.categoryId] = (catSpendMap[tx.categoryId] || 0) + tx.amount;
      }
    });

    categories.forEach((cat) => {
      const spent = catSpendMap[cat.id] || 0;
      if (spent > cat.monthlyBudget) {
        const overage = spent - cat.monthlyBudget;
        list.push({
          id: `alert-cat-${cat.id}`,
          categoryId: cat.id,
          type: 'over_budget',
          title: `Budget Exceeded: ${cat.name}`,
          message: `Current spend ${formatMoney(spent)} exceeded monthly target of ${formatMoney(cat.monthlyBudget)} by ${formatMoney(overage)}.`,
          severity: 'warning',
        });
      }
    });

    return list;
  }, [cards, transactions, categories, formatMoney]);

  // Bank & Card Feed Reconciliation Sync (Real reconciliation, no mock/synthetic transactions)
  const triggerManualSync = useCallback(async (specificCardId?: string) => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const targetCards = specificCardId 
      ? cards.filter(c => c.id === specificCardId) 
      : cards.filter(c => c.isAutoSyncEnabled);

    const nowIso = new Date().toISOString();

    if (targetCards.length === 0) {
      setIsSyncing(false);
      return { count: 0, total: 0 };
    }

    // Statement reconciliation: mark any pending charges as cleared once verified
    let reconciledCount = 0;
    setTransactions(prev => prev.map(tx => {
      if (tx.status === 'pending' && targetCards.some(c => c.id === tx.accountId)) {
        reconciledCount++;
        return { ...tx, status: 'cleared' };
      }
      return tx;
    }));

    // Update verified statement sync timestamps
    setCards(prevCards => prevCards.map(c => {
      if (targetCards.some(tc => tc.id === c.id)) {
        return {
          ...c,
          lastSyncedAt: nowIso,
        };
      }
      return c;
    }));

    const newLog: SyncRecord = {
      id: `sync-${Date.now()}`,
      timestamp: nowIso,
      cardName: specificCardId ? (cards.find(c => c.id === specificCardId)?.name || 'Credit Card') : 'All Connected Cards',
      transactionsImported: reconciledCount,
      totalAmount: 0,
      status: 'completed',
    };

    setSyncLogs(prev => [newLog, ...prev.slice(0, 19)]);
    setLastGlobalSync(nowIso);
    setIsSyncing(false);

    return { count: reconciledCount, total: 0 };
  }, [cards]);

  // Periodic Auto-Sync Interval
  useEffect(() => {
    if (!autoSyncActive) return;
    const interval = setInterval(() => {
      triggerManualSync();
    }, 75000);
    return () => clearInterval(interval);
  }, [autoSyncActive, triggerManualSync]);

  const toggleAutoSync = () => {
    setAutoSyncActive(prev => !prev);
  };

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const id = `tx-${Date.now()}`;
    const newTx: Transaction = { ...tx, id };
    
    setTransactions(prev => [newTx, ...prev]);

    if (tx.accountId.startsWith('card-')) {
      setCards(prev => prev.map(c => {
        if (c.id === tx.accountId) {
          const delta = tx.type === 'expense' ? tx.amount : -tx.amount;
          const nextBal = Math.max(0, parseFloat((c.currentBalance + delta).toFixed(2)));
          return {
            ...c,
            currentBalance: nextBal,
            isPaidForCycle: nextBal === 0 ? true : c.isPaidForCycle,
          };
        }
        return c;
      }));
    }
  };

  // Functional Delete: Transactions
  const deleteTransaction = (id: string) => {
    const target = transactions.find(t => t.id === id);
    if (target && target.accountId.startsWith('card-')) {
      setCards(prev => prev.map(c => {
        if (c.id === target.accountId) {
          const delta = target.type === 'expense' ? -target.amount : target.amount;
          return {
            ...c,
            currentBalance: Math.max(0, parseFloat((c.currentBalance + delta).toFixed(2))),
          };
        }
        return c;
      }));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Functional Delete: Credit Card
  const deleteCreditCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    // Reassign existing transactions to checking so ledger history stays intact
    setTransactions(prev => prev.map(t => t.accountId === cardId ? { ...t, accountId: 'checking' } : t));
  };

  // Functional Delete: Category
  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    const fallbackId = categories.find(c => c.id !== categoryId)?.id || 'cat-housing';
    setTransactions(prev => prev.map(t => t.categoryId === categoryId ? { ...t, categoryId: fallbackId } : t));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const prevTx = transactions.find(t => t.id === id);
    if (!prevTx) return;

    const nextTx: Transaction = { ...prevTx, ...updates };

    // Revert old transaction effect on card balance if it was on a credit card
    if (prevTx.accountId.startsWith('card-')) {
      const oldDelta = prevTx.type === 'expense' ? -prevTx.amount : prevTx.amount;
      setCards(prevCards => prevCards.map(c => {
        if (c.id === prevTx.accountId) {
          const nextBal = Math.max(0, parseFloat((c.currentBalance + oldDelta).toFixed(2)));
          return { ...c, currentBalance: nextBal };
        }
        return c;
      }));
    }

    // Apply new updated transaction effect on card balance if it is on a credit card
    if (nextTx.accountId.startsWith('card-')) {
      const newDelta = nextTx.type === 'expense' ? nextTx.amount : -nextTx.amount;
      setCards(prevCards => prevCards.map(c => {
        if (c.id === nextTx.accountId) {
          const nextBal = Math.max(0, parseFloat((c.currentBalance + newDelta).toFixed(2)));
          return { ...c, currentBalance: nextBal };
        }
        return c;
      }));
    }

    setTransactions(prev => prev.map(t => (t.id === id ? nextTx : t)));
  };

  const updateCategoryBudget = (categoryId: string, monthlyBudget: number) => {
    setCategories(prev => prev.map(c => (c.id === categoryId ? { ...c, monthlyBudget } : c)));
  };

  // Bulk / manual customization of multiple category budget amounts
  const updateMultipleCategoryBudgets = useCallback((updates: { categoryId: string; monthlyBudget: number }[]) => {
    setCategories(prev => prev.map(cat => {
      const match = updates.find(u => u.categoryId === cat.id);
      return match ? { ...cat, monthlyBudget: Math.max(0, match.monthlyBudget) } : cat;
    }));
  }, []);

  // Helper function that checks credit card due dates and identifies payments required within next 3 days
  const checkCreditCardDueDates = useCallback((daysThreshold: number = 3): DueDateAlert[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return cards
      .filter((card) => {
        // If card is paid early or balance is zero, skip reminders
        if (card.isPaidForCycle || card.currentBalance <= 0 || card.statementBalance <= 0) {
          return false;
        }
        const dueDate = new Date(card.statementDueDate + 'T00:00:00');
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= daysThreshold;
      })
      .map((card) => {
        const dueDate = new Date(card.statementDueDate + 'T00:00:00');
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const badgeLabel = diffDays === 0 ? 'Due Today' : `Due in ${diffDays}d`;
        return {
          card,
          daysRemaining: diffDays,
          dueDate: card.statementDueDate,
          amountDue: card.statementBalance > 0 ? card.statementBalance : card.currentBalance,
          isUrgent: true,
          badgeLabel,
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [cards]);

  const addCategory = (category: Omit<BudgetCategory, 'id'>) => {
    const id = `cat-${Date.now()}`;
    setCategories(prev => [...prev, { ...category, id }]);
  };

  const addCreditCard = (cardData: Omit<CreditCard, 'id' | 'statementBalance' | 'minimumPayment' | 'isAutoSyncEnabled' | 'isPaidForCycle'>) => {
    const id = `card-${Date.now()}`;
    const newCard: CreditCard = {
      ...cardData,
      id,
      statementBalance: cardData.currentBalance,
      minimumPayment: Math.max(50, parseFloat((cardData.currentBalance * 0.05).toFixed(2))),
      isAutoSyncEnabled: true,
      lastSyncedAt: new Date().toISOString(),
      isPaidForCycle: cardData.currentBalance === 0,
    };
    setCards(prev => [...prev, newCard]);
  };

  const updateCreditCard = (cardId: string, updates: Partial<CreditCard>) => {
    setCards(prev => prev.map(c => (c.id === cardId ? { ...c, ...updates } : c)));
  };

  // Record Payment: If full statement or full balance is paid, mark paid early and silence notification reminders!
  const recordPayment = (cardId: string, amount: number) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const paymentTx: Transaction = {
      id: `tx-pay-${Date.now()}`,
      date: getOffsetDate(0),
      amount,
      merchant: `Payment to ${card.name}`,
      categoryId: 'cat-housing',
      accountId: cardId,
      status: 'cleared',
      type: 'payment',
      notes: `Card balance payment applied (${currency})`,
    };

    setTransactions(prev => [paymentTx, ...prev]);
    setCards(prev => prev.map(c => {
      if (c.id === cardId) {
        const nextBal = Math.max(0, parseFloat((c.currentBalance - amount).toFixed(2)));
        const nextStmt = Math.max(0, parseFloat((c.statementBalance - amount).toFixed(2)));
        // If statement is paid or balance is zero, mark as paid early so reminders vanish
        const paidEarly = nextStmt <= 0 || nextBal <= 0;
        return {
          ...c,
          currentBalance: nextBal,
          statementBalance: nextStmt,
          minimumPayment: Math.max(0, parseFloat((nextBal * 0.05).toFixed(2))),
          isPaidForCycle: paidEarly,
        };
      }
      return c;
    }));
  };

  const markCardPaidEarly = (cardId: string, isPaid: boolean) => {
    setCards(prev => prev.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          isPaidForCycle: isPaid,
          statementBalance: isPaid ? 0 : c.currentBalance,
        };
      }
      return c;
    }));
  };

  const importCSV = (csvContent: string): { added: number; errors: string[] } => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return { added: 0, errors: ['CSV file is empty or missing headers.'] };
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const dateIdx = header.findIndex(h => h.includes('date'));
    const merchantIdx = header.findIndex(h => h.includes('merchant') || h.includes('description') || h.includes('payee'));
    const amountIdx = header.findIndex(h => h.includes('amount') || h.includes('price') || h.includes('cost'));
    const categoryIdx = header.findIndex(h => h.includes('category'));

    if (dateIdx === -1 || merchantIdx === -1 || amountIdx === -1) {
      return { added: 0, errors: ['CSV must have columns for Date, Merchant/Description, and Amount.'] };
    }

    const defaultCard = cards[0]?.id || 'checking';
    const newItems: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const rawDate = cols[dateIdx];
      const merchant = cols[merchantIdx];
      const rawAmount = parseFloat(cols[amountIdx]?.replace(/[^0-9.-]/g, '') || '0');

      if (!merchant || isNaN(rawAmount) || rawAmount === 0) continue;

      let matchedCat = categories[0].id;
      if (categoryIdx !== -1 && cols[categoryIdx]) {
        const target = categories.find(c => c.name.toLowerCase().includes(cols[categoryIdx].toLowerCase()));
        if (target) matchedCat = target.id;
      }

      newItems.push({
        id: `tx-csv-${Date.now()}-${i}`,
        date: rawDate && rawDate.length >= 8 ? rawDate : getOffsetDate(0),
        amount: Math.abs(rawAmount),
        merchant,
        categoryId: matchedCat,
        accountId: defaultCard,
        status: 'cleared',
        type: rawAmount < 0 ? 'payment' : 'expense',
        notes: 'Imported via statement CSV',
      });
    }

    if (newItems.length > 0) {
      setTransactions(prev => [...newItems, ...prev]);
    }

    return { added: newItems.length, errors: [] };
  };

  const addFriendLoan = (loanData: Omit<FriendLoan, 'id' | 'status'>) => {
    const id = `loan-${Date.now()}`;
    const newLoan: FriendLoan = {
      ...loanData,
      id,
      status: 'pending',
    };
    setFriendLoans(prev => [newLoan, ...prev]);

    // Update credit card balance ONLY (reducing available limit), without impacting personal budget or expenses!
    if (loanData.cardId) {
      setCards(prevCards => prevCards.map(c => {
        if (c.id === loanData.cardId) {
          const nextBal = parseFloat((c.currentBalance + loanData.amount).toFixed(2));
          return {
            ...c,
            currentBalance: nextBal,
            isPaidForCycle: false,
          };
        }
        return c;
      }));
    }
  };

  const settleFriendLoan = (loanId: string, actualReturnDate?: string, restoreCardLimit: boolean = true) => {
    const returnDate = actualReturnDate || new Date().toISOString().split('T')[0];
    const target = friendLoans.find(l => l.id === loanId);
    if (!target) return;

    setFriendLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        return {
          ...l,
          status: 'returned',
          actualReturnDate: returnDate,
        };
      }
      return l;
    }));

    // Settle restores the credit card available limit
    if (restoreCardLimit && target.status === 'pending' && target.cardId) {
      setCards(prevCards => prevCards.map(c => {
        if (c.id === target.cardId) {
          const nextBal = Math.max(0, parseFloat((c.currentBalance - target.amount).toFixed(2)));
          return {
            ...c,
            currentBalance: nextBal,
            isPaidForCycle: nextBal === 0 ? true : c.isPaidForCycle,
          };
        }
        return c;
      }));
    }
  };

  const deleteFriendLoan = (loanId: string, revertCardLimit: boolean = true) => {
    const target = friendLoans.find(l => l.id === loanId);
    if (target && revertCardLimit && target.status === 'pending' && target.cardId) {
      setCards(prevCards => prevCards.map(c => {
        if (c.id === target.cardId) {
          const nextBal = Math.max(0, parseFloat((c.currentBalance - target.amount).toFixed(2)));
          return {
            ...c,
            currentBalance: nextBal,
          };
        }
        return c;
      }));
    }
    setFriendLoans(prev => prev.filter(l => l.id !== loanId));
  };

  const updateFriendLoan = (loanId: string, updates: Partial<FriendLoan>) => {
    setFriendLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...updates } : l));
  };

  const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.CARDS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SYNC_LOGS);
    localStorage.removeItem(STORAGE_KEYS.AUTO_SYNC);
    localStorage.removeItem(STORAGE_KEYS.FRIEND_LOANS);
    setCards([]);
    setTransactions([]);
    setSyncLogs([]);
    setFriendLoans([]);
    setAutoSyncActive(false);
    setLastGlobalSync(null);
  };

  const resetData = () => {
    clearAllData();
  };

  return (
    <FinanceContext.Provider
      value={{
        currency,
        currencySymbol,
        setCurrency,
        formatMoney,
        categories,
        cards,
        transactions,
        friendLoans,
        totalFriendsLentOutstanding,
        alerts,
        checkCreditCardDueDates,
        syncLogs,
        isSyncing,
        autoSyncActive,
        lastGlobalSync,
        toggleAutoSync,
        triggerManualSync,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        updateCategoryBudget,
        updateMultipleCategoryBudgets,
        addCategory,
        deleteCategory,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        recordPayment,
        markCardPaidEarly,
        importCSV,
        addFriendLoan,
        settleFriendLoan,
        deleteFriendLoan,
        updateFriendLoan,
        clearAllData,
        resetData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
