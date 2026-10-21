import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Transaction, 
  BudgetCategory, 
  CreditCard, 
  DebtAlert, 
  SyncRecord,
  CurrencyCode 
} from '../types/finance';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_CARDS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SYNC_LOGS, 
  SIMULATED_MERCHANT_FEED,
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
  alerts: DebtAlert[];
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
  addCategory: (category: Omit<BudgetCategory, 'id'>) => void;
  deleteCategory: (categoryId: string) => void;
  addCreditCard: (card: Omit<CreditCard, 'id' | 'statementBalance' | 'minimumPayment' | 'isAutoSyncEnabled' | 'isPaidForCycle'>) => void;
  updateCreditCard: (cardId: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (cardId: string) => void;
  recordPayment: (cardId: string, amount: number) => void;
  markCardPaidEarly: (cardId: string, isPaid: boolean) => void;
  importCSV: (csvContent: string) => { added: number; errors: string[] };
  resetData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENCY: 'clarity_currency_v2',
  CATEGORIES: 'clarity_categories_v2',
  CARDS: 'clarity_cards_v2',
  TRANSACTIONS: 'clarity_transactions_v2',
  SYNC_LOGS: 'clarity_sync_logs_v2',
  AUTO_SYNC: 'clarity_auto_sync_v2',
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

  const [autoSyncActive, setAutoSyncActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastGlobalSync, setLastGlobalSync] = useState<string | null>(() => new Date().toISOString());

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

  // Automated Sync Simulator
  const triggerManualSync = useCallback(async (specificCardId?: string) => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const targetCards = specificCardId 
      ? cards.filter(c => c.id === specificCardId) 
      : cards.filter(c => c.isAutoSyncEnabled);

    if (targetCards.length === 0) {
      setIsSyncing(false);
      return { count: 0, total: 0 };
    }

    const newTransactions: Transaction[] = [];
    let grandTotal = 0;
    const nowIso = new Date().toISOString();

    targetCards.forEach(card => {
      const template = SIMULATED_MERCHANT_FEED[Math.floor(Math.random() * SIMULATED_MERCHANT_FEED.length)];
      const amount = parseFloat((Math.random() * (template.amountMax - template.amountMin) + template.amountMin).toFixed(2));
      
      const newTx: Transaction = {
        id: `tx-sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: getOffsetDate(0),
        amount,
        merchant: template.merchant,
        categoryId: template.categoryId,
        accountId: card.id,
        status: Math.random() > 0.3 ? 'cleared' : 'pending',
        type: 'expense',
        notes: `Auto-synced charge from ${card.bankName}`,
      };

      newTransactions.push(newTx);
      grandTotal += amount;
    });

    setTransactions(prev => [newTransactions[0], ...prev]);
    
    setCards(prevCards => prevCards.map(c => {
      const addedTx = newTransactions.find(t => t.accountId === c.id);
      if (addedTx) {
        return {
          ...c,
          currentBalance: parseFloat((c.currentBalance + addedTx.amount).toFixed(2)),
          isPaidForCycle: false, // new charge restores reminder if unbilled
          lastSyncedAt: nowIso,
        };
      }
      return c;
    }));

    const newLog: SyncRecord = {
      id: `sync-${Date.now()}`,
      timestamp: nowIso,
      cardName: specificCardId ? (cards.find(c => c.id === specificCardId)?.name || 'Credit Card') : 'Connected Cards',
      transactionsImported: newTransactions.length,
      totalAmount: parseFloat(grandTotal.toFixed(2)),
      status: 'completed',
    };

    setSyncLogs(prev => [newLog, ...prev.slice(0, 19)]);
    setLastGlobalSync(nowIso);
    setIsSyncing(false);

    return { count: newTransactions.length, total: grandTotal };
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
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const updateCategoryBudget = (categoryId: string, monthlyBudget: number) => {
    setCategories(prev => prev.map(c => (c.id === categoryId ? { ...c, monthlyBudget } : c)));
  };

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

  const resetData = () => {
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.CARDS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SYNC_LOGS);
    localStorage.removeItem(STORAGE_KEYS.AUTO_SYNC);
    setCategories(INITIAL_CATEGORIES);
    setCards(INITIAL_CARDS);
    setTransactions(INITIAL_TRANSACTIONS);
    setSyncLogs(INITIAL_SYNC_LOGS);
    setAutoSyncActive(true);
    setLastGlobalSync(new Date().toISOString());
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
        alerts,
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
        addCategory,
        deleteCategory,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        recordPayment,
        markCardPaidEarly,
        importCSV,
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
