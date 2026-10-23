import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Trash2, 
  Clock,
  AlertCircle,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { FriendLoan } from '../types/finance';
import { AddFriendLoanModal } from './modals/AddFriendLoanModal';
import { DeleteConfirmModal, DeleteTarget } from './modals/DeleteConfirmModal';

interface FriendsCreditViewProps {
  isEmbedded?: boolean;
}

export const FriendsCreditView: React.FC<FriendsCreditViewProps> = ({ isEmbedded = false }) => {
  const { friendLoans, cards, formatMoney, settleFriendLoan, deleteFriendLoan } = useFinance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'returned'>('pending');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Key Aggregates
  const pendingLoans = useMemo(() => friendLoans.filter(l => l.status === 'pending'), [friendLoans]);
  const returnedLoans = useMemo(() => friendLoans.filter(l => l.status === 'returned'), [friendLoans]);

  const totalPending = useMemo(() => {
    return pendingLoans.reduce((sum, l) => sum + l.amount, 0);
  }, [pendingLoans]);

  const totalReturned = useMemo(() => {
    return returnedLoans.reduce((sum, l) => sum + l.amount, 0);
  }, [returnedLoans]);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return friendLoans.filter(l => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (q) {
        const matchName = l.friendName.toLowerCase().includes(q);
        const matchPurpose = l.purpose.toLowerCase().includes(q);
        const matchNotes = l.notes?.toLowerCase().includes(q) || false;
        const matchAmount = l.amount.toString().includes(q);
        const card = cards.find(c => c.id === l.cardId);
        const matchCard = card?.name.toLowerCase().includes(q) || false;
        if (!matchName && !matchPurpose && !matchNotes && !matchAmount && !matchCard) return false;
      }
      return true;
    });
  }, [friendLoans, statusFilter, searchQuery, cards]);

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
        label: `Overdue by ${Math.abs(diffDays)}d`,
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
        label: `Due in ${diffDays}d`,
        severity: 'warning' as const,
      };
    }
    return {
      label: `Due in ${diffDays}d`,
      severity: 'info' as const,
    };
  };

  // 1-Tap Instant Settle
  const handleQuickSettle = (loan: FriendLoan) => {
    settleFriendLoan(loan.id);
    setToastMessage(`Marked ${loan.friendName}'s swipe (${formatMoney(loan.amount)}) as paid!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner & Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                Friend Card Swipes
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium">
                Pass-Through
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Money charged on your credit cards by friends. Reduces your available limit until repaid, but is <strong>100% excluded</strong> from your personal budget.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record Friend Swipe</span>
          </button>
        </div>

        {/* Compact Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
            <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 block truncate">
              Awaiting Return
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-amber-950 dark:text-amber-200 mt-0.5 block tabular-nums">
              {formatMoney(totalPending)}
            </span>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
              {pendingLoans.length} active swipe{pendingLoans.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block truncate">
              Settled & Restored
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-emerald-950 dark:text-emerald-200 mt-0.5 block tabular-nums">
              {formatMoney(totalReturned)}
            </span>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
              {returnedLoans.length} returned
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Unique Friends
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {new Set(pendingLoans.map(l => l.friendName.toLowerCase())).size} awaiting
            </span>
            <span className="text-[10px] text-slate-400">
              across {cards.length} credit card{cards.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by friend, card, or reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending ({pendingLoans.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('returned')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'returned'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Paid ({returnedLoans.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({friendLoans.length})
            </button>
          </div>
        </div>
      </div>

      {/* Swipes List */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center text-xs">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            {friendLoans.length === 0 ? 'No Friend Card Swipes Logged' : 'No records match this filter'}
          </h3>
          <p className="text-slate-400 dark:text-slate-500 mt-1 mb-3 max-w-sm">
            {friendLoans.length === 0
              ? 'When friends swipe your credit card and will pay you back, record it here so your budget remains clean.'
              : 'Try clearing your search keyword or switching between Pending and Paid.'}
          </p>
          {friendLoans.length === 0 && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-indigo-600 text-white shadow-xs"
            >
              + Record First Swipe
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLoans.map(loan => {
            const card = getCardDetails(loan.cardId);
            const isReturned = loan.status === 'returned';
            const dueInfo = getDueStatus(loan.expectedReturnDate, isReturned);

            return (
              <div
                key={loan.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between transition-colors space-y-3"
              >
                {/* Top: Friend Avatar + Name + Status + Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60 uppercase">
                      {loan.friendName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {loan.friendName}
                        </span>
                        {isReturned ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-semibold">
                            Paid ✓
                          </span>
                        ) : (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                            dueInfo?.severity === 'critical'
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                          }`}>
                            {dueInfo?.label}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {loan.purpose || 'Card swipe'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums block">
                      {formatMoney(loan.amount)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {loan.swipeDate}
                    </span>
                  </div>
                </div>

                {loan.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg italic">
                    "{loan.notes}"
                  </p>
                )}

                {/* Bottom Row: Card Details & 1-Tap Settle Button */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-[11px] font-medium">
                      {card ? `${card.name} (•••• ${card.last4})` : 'Credit Card'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isReturned ? (
                      <button
                        type="button"
                        onClick={() => handleQuickSettle(loan)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors flex items-center gap-1 shadow-2xs border border-emerald-200/50 dark:border-emerald-800/50"
                        title="1-tap settle: marks repayment and restores credit card available limit"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Paid</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Settled
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTarget({
                          type: 'transaction',
                          id: loan.id,
                          title: `Friend Swipe: ${loan.friendName}`,
                          details: `${formatMoney(loan.amount)} on ${card?.name || 'Credit Card'}`,
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Swipe Modal */}
      <AddFriendLoanModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteFriendLoan(deleteTarget.id, true);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
};
