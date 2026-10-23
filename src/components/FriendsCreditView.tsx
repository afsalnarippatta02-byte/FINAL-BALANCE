import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Calendar, 
  ArrowUpRight,
  ShieldCheck,
  Check,
  RotateCcw
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { FriendLoan, FriendLoanStatus } from '../types/finance';
import { AddFriendLoanModal } from './modals/AddFriendLoanModal';
import { SettleFriendLoanModal } from './modals/SettleFriendLoanModal';
import { DeleteConfirmModal, DeleteTarget } from './modals/DeleteConfirmModal';

export const FriendsCreditView: React.FC = () => {
  const { friendLoans, cards, formatMoney, deleteFriendLoan } = useFinance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [settleLoan, setSettleLoan] = useState<FriendLoan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'returned'>('all');
  const [cardFilter, setCardFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Key Aggregates
  const totalPending = useMemo(() => {
    return friendLoans
      .filter(l => l.status === 'pending')
      .reduce((sum, l) => sum + l.amount, 0);
  }, [friendLoans]);

  const totalReturned = useMemo(() => {
    return friendLoans
      .filter(l => l.status === 'returned')
      .reduce((sum, l) => sum + l.amount, 0);
  }, [friendLoans]);

  const uniqueFriendsCount = useMemo(() => {
    const names = new Set(friendLoans.filter(l => l.status === 'pending').map(l => l.friendName.toLowerCase()));
    return names.size;
  }, [friendLoans]);

  // Next upcoming repayment date
  const nextRepayment = useMemo(() => {
    const pending = friendLoans
      .filter(l => l.status === 'pending')
      .sort((a, b) => new Date(a.expectedReturnDate).getTime() - new Date(b.expectedReturnDate).getTime());
    return pending.length > 0 ? pending[0] : null;
  }, [friendLoans]);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return friendLoans.filter(l => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (cardFilter !== 'all' && l.cardId !== cardFilter) return false;
      if (q) {
        const matchName = l.friendName.toLowerCase().includes(q);
        const matchPurpose = l.purpose.toLowerCase().includes(q);
        const matchNotes = l.notes?.toLowerCase().includes(q) || false;
        const matchAmount = l.amount.toString().includes(q);
        if (!matchName && !matchPurpose && !matchNotes && !matchAmount) return false;
      }
      return true;
    });
  }, [friendLoans, statusFilter, cardFilter, searchQuery]);

  const getCardDetails = (cardId: string) => {
    return cards.find(c => c.id === cardId);
  };

  const getDueStatus = (expectedReturnDate: string, isReturned: boolean) => {
    if (isReturned) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(expectedReturnDate + 'T00:00:00');
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`,
        severity: 'critical' as const,
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Due Today',
        severity: 'warning' as const,
      };
    }
    if (diffDays <= 3) {
      return {
        label: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
        severity: 'warning' as const,
      };
    }
    return {
      label: `Due in ${diffDays} days`,
      severity: 'info' as const,
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Action */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                Friends Using My Credit Card
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Track swipes made on your credit cards by friends who will pay you back later. 
              These swipes utilize your credit limit but are <strong>100% excluded</strong> from your personal living expenses and monthly budget.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record Friend Card Swipe</span>
          </button>
        </div>

        {/* 2. Key Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Outstanding (To Collect)
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 mt-1 block tabular-nums">
              {formatMoney(totalPending)}
            </span>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Settled / Recovered
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block tabular-nums">
              {formatMoney(totalReturned)}
            </span>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Pending Friends
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 block">
              {uniqueFriendsCount} {uniqueFriendsCount === 1 ? 'person' : 'people'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Earliest Due Date
            </span>
            <span className="font-mono text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1.5 block truncate">
              {nextRepayment ? `${nextRepayment.friendName} (${nextRepayment.expectedReturnDate})` : 'None pending'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by friend, purpose, amount..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({friendLoans.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending ({friendLoans.filter(l => l.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('returned')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'returned'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Returned ({friendLoans.filter(l => l.status === 'returned').length})
            </button>
          </div>

          {/* Card Filter dropdown if multiple cards */}
          {cards.length > 1 && (
            <select
              value={cardFilter}
              onChange={e => setCardFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0"
            >
              <option value="all">All Cards</option>
              {cards.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 4. Loans Ledger */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {friendLoans.length === 0 ? 'No Friend Card Swipes Logged' : 'No records match your filter'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
            {friendLoans.length === 0
              ? 'Whenever your friends use your credit card and promise to give back after a few days, record it here to track repayment deadlines and protect your credit card limit.'
              : 'Try clearing your search term or switching the status filter.'}
          </p>
          {friendLoans.length === 0 && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Swipe</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors duration-200">
          {/* Mobile View: Touch-Friendly Compact Cards (< sm) */}
          <div className="sm:hidden space-y-3">
            {filteredLoans.map(loan => {
              const card = getCardDetails(loan.cardId);
              const isReturned = loan.status === 'returned';
              const dueInfo = getDueStatus(loan.expectedReturnDate, isReturned);

              return (
                <div
                  key={loan.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {loan.friendName}
                      </span>
                      {isReturned ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-medium">
                          Returned
                        </span>
                      ) : (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-medium ${
                          dueInfo?.severity === 'critical'
                            ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                        }`}>
                          {dueInfo?.label}
                        </span>
                      )}
                    </div>

                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                      {formatMoney(loan.amount)}
                    </span>
                  </div>

                  <div className="text-slate-600 dark:text-slate-300 font-medium">
                    {loan.purpose}
                  </div>

                  {loan.notes && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                      "{loan.notes}"
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{card ? `${card.name} (•••• ${card.last4})` : 'Credit Card'}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isReturned && (
                        <button
                          onClick={() => setSettleLoan(loan)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md transition-colors"
                        >
                          Mark Returned
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setDeleteTarget({
                            type: 'transaction',
                            id: loan.id,
                            title: `Friend Loan: ${loan.friendName}`,
                            details: `${formatMoney(loan.amount)} · Swiped on ${card?.name || 'Card'}`,
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Delete loan record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: Ledger Table (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Friend</th>
                  <th className="py-2.5 px-3">Purpose & Notes</th>
                  <th className="py-2.5 px-3">Card Used</th>
                  <th className="py-2.5 px-3">Swipe Date</th>
                  <th className="py-2.5 px-3">Expected Return</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {filteredLoans.map(loan => {
                  const card = getCardDetails(loan.cardId);
                  const isReturned = loan.status === 'returned';
                  const dueInfo = getDueStatus(loan.expectedReturnDate, isReturned);

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {loan.friendName}
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {loan.purpose}
                        </div>
                        {loan.notes && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {loan.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {card ? `${card.name} (•••• ${card.last4})` : 'Credit Card'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {loan.swipeDate}
                      </td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap">
                        {isReturned ? (
                          <span className="text-slate-400 dark:text-slate-500">
                            Returned {loan.actualReturnDate}
                          </span>
                        ) : (
                          <span className="text-slate-800 dark:text-slate-200">
                            {loan.expectedReturnDate}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isReturned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-medium">
                            <Check className="w-3 h-3" />
                            <span>Returned</span>
                          </span>
                        ) : (
                          <span className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded-md font-medium ${
                            dueInfo?.severity === 'critical'
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                          }`}>
                            {dueInfo?.label}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap tabular-nums text-slate-900 dark:text-white">
                        {formatMoney(loan.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isReturned && (
                            <button
                              onClick={() => setSettleLoan(loan)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md transition-colors"
                              title="Mark as returned and settled"
                            >
                              Returned
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'transaction',
                                id: loan.id,
                                title: `Friend Loan: ${loan.friendName}`,
                                details: `${formatMoney(loan.amount)} · Swiped on ${card?.name || 'Card'}`,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                            title="Delete loan record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      <AddFriendLoanModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <SettleFriendLoanModal
        loan={settleLoan}
        onClose={() => setSettleLoan(null)}
      />

      <DeleteConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteFriendLoan(deleteTarget.id, true);
            setToastMessage(`Deleted ${deleteTarget.title}`);
            setTimeout(() => setToastMessage(null), 3000);
          }
        }}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-40 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
