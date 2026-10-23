import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  ArrowRight, 
  ReceiptText, 
  TrendingDown, 
  Calendar,
  Search, 
  ExternalLink,
  Trash2,
  Edit3,
  CheckCircle2,
  Users,
  Plus,
  Sliders
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CategorySpendChart } from './CategorySpendChart';
import { DebtAlertBanner } from './DebtAlertBanner';
import { CreditCardCard } from './CreditCardCard';
import { BudgetProgressBar } from './BudgetProgressBar';
import { NavTab } from './Sidebar';
import { DeleteConfirmModal, DeleteTarget } from './modals/DeleteConfirmModal';
import { AddFriendLoanModal } from './modals/AddFriendLoanModal';
import { EditTransactionModal } from './modals/EditTransactionModal';
import { BudgetEditModal } from './modals/BudgetEditModal';
import { CustomizeBudgetsModal } from './modals/CustomizeBudgetsModal';
import { Transaction, BudgetCategory } from '../types/finance';

interface DashboardViewProps {
  onNavigateTab: (tab: NavTab) => void;
  onPayCard: (cardId: string) => void;
  onOpenAddTransaction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onPayCard,
  onOpenAddTransaction,
}) => {
  const { 
    cards, 
    transactions, 
    categories, 
    formatMoney, 
    deleteTransaction,
    friendLoans,
    totalFriendsLentOutstanding
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [selectedCategoryForBudgetEdit, setSelectedCategoryForBudgetEdit] = useState<BudgetCategory | null>(null);
  const [isCustomizeBudgetsOpen, setIsCustomizeBudgetsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddFriendLoanOpen, setIsAddFriendLoanOpen] = useState(false);

  const pendingFriendLoans = useMemo(() => {
    return friendLoans.filter(l => l.status === 'pending');
  }, [friendLoans]);

  const recentTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          tx.merchant.toLowerCase().includes(q) ||
          tx.notes?.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q)
        );
      })
      .slice(0, 6);
  }, [transactions, searchTerm]);

  const getCategory = (catId: string) => {
    return categories.find(c => c.id === catId);
  };

  const getAccountName = (accId: string) => {
    if (accId === 'checking') return 'Checking Account';
    const card = cards.find(c => c.id === accId);
    return card ? `${card.name} (•••• ${card.last4})` : 'Credit Card';
  };

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const categoryConsumption = React.useMemo(() => {
    const spendMap: Record<string, number> = {};
    const currentMonthExpenses = transactions.filter(tx => tx.type === 'expense' && tx.date.startsWith(currentMonthPrefix));
    // If user enters an expense with different date format or outside current month, fallback to all expenses
    const effectiveExpenses = currentMonthExpenses.length > 0 
      ? currentMonthExpenses 
      : transactions.filter(tx => tx.type === 'expense');

    effectiveExpenses.forEach(tx => {
      spendMap[tx.categoryId] = (spendMap[tx.categoryId] || 0) + tx.amount;
    });

    return categories.map(cat => ({
      category: cat,
      spent: parseFloat((spendMap[cat.id] || 0).toFixed(2)),
    })).sort((a, b) => (b.spent / b.category.monthlyBudget) - (a.spent / a.category.monthlyBudget));
  }, [categories, transactions, currentMonthPrefix]);

  return (
    <div className="space-y-6">
      {/* 1. Friends Credit Card Pass-Through Widget (Separate from personal expenses) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                  Friends Using My Credit Card
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium">
                  Separate Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Friends swiping your card. Affects your card available limit only — 100% excluded from your personal budget & expenses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddFriendLoanOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Friend Swipe</span>
            </button>
            <button
              onClick={() => onNavigateTab('friends')}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 group transition-colors px-2 py-1.5"
            >
              <span>View Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {totalFriendsLentOutstanding > 0 ? (
          <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 block">
                Total Currently Lent to Friends (Outstanding)
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-amber-950 dark:text-amber-200 tabular-nums">
                {formatMoney(totalFriendsLentOutstanding)}
              </span>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 block mt-0.5">
                {pendingFriendLoans.length} active friend loan{pendingFriendLoans.length > 1 ? 's' : ''} awaiting return
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {pendingFriendLoans.slice(0, 3).map(l => (
                <div key={l.id} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-[11px] flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900 dark:text-white">{l.friendName}:</span>
                  <span className="font-mono text-amber-700 dark:text-amber-300 font-medium">{formatMoney(l.amount)}</span>
                </div>
              ))}
              {pendingFriendLoans.length > 3 && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  +{pendingFriendLoans.length - 3} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>No pending friend card loans. All swiped amounts have been settled.</span>
            <button
              onClick={() => setIsAddFriendLoanOpen(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              + Record Swipe
            </button>
          </div>
        )}
      </div>

      {/* 1. Real-Time Debt Payoff & Due Date Alerts Banner */}
      <DebtAlertBanner
        onSelectCardForPayment={(cardId) => onPayCard(cardId)}
        onNavigateToCards={() => onNavigateTab('cards')}
      />

      {/* 2. Primary Visualization: Recharts Category Spending Distribution */}
      <CategorySpendChart />

      {/* 2b. Visual Budget Category Consumption Progress Bars */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Monthly Budget Category Consumption
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual progress bars indicating consumed spending vs monthly ceiling. Click amounts to customise.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomizeBudgetsOpen(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Customise category budget targets"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Customise Budgets</span>
            </button>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 group transition-colors"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
          {categoryConsumption.map(({ category, spent }) => (
            <div key={category.id} className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-100/90 dark:border-slate-800">
              <BudgetProgressBar
                category={category}
                spent={spent}
                showDetails={true}
                onEdit={(cat) => setSelectedCategoryForBudgetEdit(cat)}
                size="md"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Credit Card Management & Due Date Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Credit Cards & Debt Management
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time balance tracking, utilization rates, and upcoming statement due dates
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('cards')}
            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 group transition-colors"
          >
            <span>Payoff Calculator & Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No Credit Cards Added</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
              Connect your UAE or Indian credit cards to track live balances, statement due dates, and payoff reminders.
            </p>
            <button
              onClick={() => onNavigateTab('cards')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Add Your First Card</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(card => (
              <CreditCardCard
                key={card.id}
                card={card}
                onPayClick={(id) => onPayCard(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Recent Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal expenses and payment records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search merchant or amount..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-48 sm:w-60"
              />
            </div>

            <button
              onClick={() => onNavigateTab('transactions')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              View All ({transactions.length})
            </button>
          </div>
        </div>

        {/* Mobile View: Compact Cards (< sm) */}
        <div className="sm:hidden space-y-2 pt-1">
          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              No transactions match your search.
            </div>
          ) : (
            recentTransactions.map(tx => {
              const cat = getCategory(tx.categoryId);
              const isPayment = tx.type === 'payment';
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{tx.date}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        tx.status === 'cleared'
                          ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                          : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60'
                      }`}>
                        {tx.status === 'cleared' ? 'Cleared' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditTarget(tx)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 rounded transition-colors"
                        title="Edit transaction"
                        aria-label={`Edit ${tx.merchant}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget({
                            type: 'transaction',
                            id: tx.id,
                            title: tx.merchant,
                            details: `${tx.date} · ${formatMoney(tx.amount)} · ${cat?.name || 'Uncategorized'}`,
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded transition-colors"
                        title="Delete transaction"
                        aria-label={`Delete ${tx.merchant}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                      {tx.merchant}
                    </span>
                    <span className={`font-mono font-bold text-xs shrink-0 tabular-nums ${
                      isPayment 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : isIncome 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {isPayment ? '-' : isIncome ? '+' : ''}{formatMoney(tx.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1 truncate">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat?.color || '#94a3b8' }} />
                      <span className="truncate">{cat?.name || 'Uncategorized'}</span>
                    </div>
                    <span>•</span>
                    <span className="truncate">{getAccountName(tx.accountId)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Ledger Table (sm+) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Merchant / Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Account Source</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No transactions match your search.
                  </td>
                </tr>
              ) : (
                recentTransactions.map(tx => {
                  const cat = getCategory(tx.categoryId);
                  const isPayment = tx.type === 'payment';
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{tx.merchant}</span>
                          {tx.notes && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                              {tx.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {cat ? (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: cat.color }} 
                            />
                            <span>{cat.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Uncategorized</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {getAccountName(tx.accountId)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded ${
                          tx.status === 'cleared'
                            ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                            : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60'
                        }`}>
                          {tx.status === 'cleared' ? 'Cleared' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium whitespace-nowrap tabular-nums">
                        <span className={
                          isPayment 
                            ? 'text-indigo-600 dark:text-indigo-400' 
                            : isIncome 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-slate-900 dark:text-white'
                        }>
                          {isPayment ? '-' : isIncome ? '+' : ''}{formatMoney(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditTarget(tx)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition-colors"
                            title="Edit transaction"
                            aria-label={`Edit transaction from ${tx.merchant}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'transaction',
                                id: tx.id,
                                title: tx.merchant,
                                details: `${tx.date} · ${formatMoney(tx.amount)} · ${cat?.name || 'Uncategorized'}`,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                            title="Delete transaction"
                            aria-label={`Delete transaction from ${tx.merchant}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-App Delete Confirmation Modal (100% reliable inside iFrames) */}
      <DeleteConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteTransaction(deleteTarget.id);
            setToastMessage(`Deleted "${deleteTarget.title}"`);
            setTimeout(() => setToastMessage(null), 3000);
          }
        }}
      />

      {/* Edit Recorded Transaction Modal */}
      <EditTransactionModal
        transaction={editTarget}
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
      />

      {/* Single Category Budget Edit Modal */}
      {selectedCategoryForBudgetEdit && (
        <BudgetEditModal
          category={selectedCategoryForBudgetEdit}
          onClose={() => setSelectedCategoryForBudgetEdit(null)}
        />
      )}

      {/* Customize All Budgets Modal */}
      <CustomizeBudgetsModal
        isOpen={isCustomizeBudgetsOpen}
        onClose={() => setIsCustomizeBudgetsOpen(false)}
      />

      {/* Add Friend Loan Modal */}
      <AddFriendLoanModal
        isOpen={isAddFriendLoanOpen}
        onClose={() => setIsAddFriendLoanOpen(false)}
      />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-40 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
