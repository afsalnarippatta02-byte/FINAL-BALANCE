import React, { useMemo } from 'react';
import { 
  Menu, 
  RefreshCw, 
  Plus, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Coins
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CurrencyCode } from '../types/finance';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenAddTransaction: () => void;
  onOpenPaymentModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileMenu,
  onOpenAddTransaction,
  onOpenPaymentModal,
}) => {
  const { 
    currency,
    setCurrency,
    formatMoney,
    categories, 
    cards, 
    transactions, 
    alerts, 
    isSyncing, 
    triggerManualSync 
  } = useFinance();

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Current Month Total Spend
  const monthlySpent = useMemo(() => {
    return transactions
      .filter(tx => tx.type === 'expense' && tx.date.startsWith(currentMonthPrefix))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, currentMonthPrefix]);

  // 2. Total Monthly Budget Ceiling
  const totalBudget = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
  }, [categories]);

  const remainingBudget = totalBudget - monthlySpent;
  const budgetPercentUsed = totalBudget > 0 ? (monthlySpent / totalBudget) * 100 : 0;

  // 3. Total Credit Card Debt
  const totalDebt = useMemo(() => {
    return cards.reduce((sum, card) => sum + card.currentBalance, 0);
  }, [cards]);

  const totalCreditLimit = useMemo(() => {
    return cards.reduce((sum, card) => sum + card.creditLimit, 0);
  }, [cards]);

  const overallCreditUtil = totalCreditLimit > 0 ? (totalDebt / totalCreditLimit) * 100 : 0;

  // Urgent alert check
  const urgentAlert = alerts.find(a => a.severity === 'critical' || a.type === 'due_soon');

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-6 lg:px-8 py-2.5 transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Mobile trigger & Compact Currency Switcher */}
        <div className="flex items-center justify-between md:justify-start gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Currency Selector: UAE AED & India INR ONLY */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setCurrency('AED')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  currency === 'AED'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="UAE Dirham (AED)"
              >
                🇦🇪 AED
              </button>
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  currency === 'INR'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Indian Rupee (₹ INR)"
              >
                🇮🇳 ₹ INR
              </button>
            </div>
          </div>

          {/* Quick Actions on Mobile Header */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={() => triggerManualSync()}
              disabled={isSyncing}
              className="p-1.5 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
              title="Sync Feeds"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onOpenAddTransaction}
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record</span>
            </button>
          </div>
        </div>

        {/* Middle/Right: Compact Key Financial Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          {/* Metric 1: Monthly Spend */}
          <div className="px-2.5 py-1 bg-slate-50/80 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">Monthly Spend</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm tabular-nums">
                {formatMoney(monthlySpent)}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                ({budgetPercentUsed.toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Metric 2: Remaining Budget */}
          <div className="px-2.5 py-1 bg-slate-50/80 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">Budget Capacity</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`font-mono font-bold text-xs sm:text-sm tabular-nums ${
                remainingBudget < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}>
                {formatMoney(remainingBudget)}
              </span>
            </div>
          </div>

          {/* Metric 3: Credit Card Debt */}
          <div className="px-2.5 py-1 bg-slate-50/80 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">Card Balance</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm tabular-nums">
                {formatMoney(totalDebt)}
              </span>
            </div>
          </div>

          {/* Metric 4: Due Date Alert Status */}
          <div className="px-2.5 py-1 bg-slate-50/80 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">Payment Remainder</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {urgentAlert ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 truncate max-w-[100px]">
                    {urgentAlert.title}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-400 truncate">
                    Settled / No Due
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Desktop Actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            onClick={() => triggerManualSync()}
            disabled={isSyncing}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            title="Fetch simulated card charges"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={onOpenPaymentModal}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Pay Card</span>
          </button>

          <button
            onClick={onOpenAddTransaction}
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record</span>
          </button>
        </div>
      </div>
    </header>
  );
};
