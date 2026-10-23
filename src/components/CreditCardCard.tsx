import React, { useState } from 'react';
import { CreditCard as CardIcon, AlertCircle, ArrowUpRight, Check, Trash2, CheckCircle2, Users } from 'lucide-react';
import { CreditCard } from '../types/finance';
import { useFinance } from '../context/FinanceContext';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';

interface CreditCardCardProps {
  card: CreditCard;
  onPayClick: (cardId: string) => void;
  onViewFriendSwipes?: () => void;
}

export const CreditCardCard: React.FC<CreditCardCardProps> = ({
  card,
  onPayClick,
  onViewFriendSwipes,
}) => {
  const { formatMoney, currency, deleteCreditCard, markCardPaidEarly, friendLoans } = useFinance();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const utilPercent = card.creditLimit > 0 ? (card.currentBalance / card.creditLimit) * 100 : 0;
  const availableCredit = Math.max(0, card.creditLimit - card.currentBalance);

  const friendsLentOnThisCard = friendLoans
    .filter(l => l.cardId === card.id && l.status === 'pending')
    .reduce((s, l) => s + l.amount, 0);

  // Compute payment date remainder
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(card.statementDueDate + 'T00:00:00');
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const isDueSoon = diffDays >= 0 && diffDays <= 7;
  const isOverdue = diffDays < 0;
  const isSettledEarly = card.isPaidForCycle || card.currentBalance <= 0 || card.statementBalance <= 0;

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div>
        {/* Visual Mini Card Front */}
        <div className={`rounded-xl p-4 text-white bg-gradient-to-br ${card.colorTheme} shadow-sm relative overflow-hidden mb-3.5`}>
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-8 bottom-0 -mb-8 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

          <div className="flex items-center justify-between mb-4 sm:mb-5 relative z-10">
            <div className="flex items-center gap-1.5">
              <CardIcon className="w-4 h-4 text-white/80" />
              <span className="text-xs font-semibold tracking-wider uppercase text-white/90 truncate max-w-[150px]">
                {card.bankName}
              </span>
            </div>
            <span className="text-xs font-mono tracking-widest text-white/70">
              •••• {card.last4}
            </span>
          </div>

          <div className="relative z-10">
            <div className="text-[11px] uppercase tracking-wider text-white/70">
              {card.name}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono tracking-tight mt-0.5 tabular-nums">
              {formatMoney(card.currentBalance)}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10 text-[10px] sm:text-[11px] text-white/80 relative z-10">
            <span>Limit: {formatMoney(card.creditLimit)}</span>
            <span>APR: {card.apr}%</span>
          </div>
        </div>

        {/* Paid Early Notification Status */}
        {isSettledEarly ? (
          <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-lg flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] font-medium">Paid Earlier · Alerts Suppressed</span>
            </div>
            <button
              onClick={() => markCardPaidEarly(card.id, false)}
              className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
            >
              Undo
            </button>
          </div>
        ) : (
          <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Paid already outside app?</span>
            <button
              onClick={() => markCardPaidEarly(card.id, true)}
              className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <Check className="w-3 h-3" />
              <span>Mark Paid Early (Stop Reminders)</span>
            </button>
          </div>
        )}

        {/* Utilization & Metrics */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400">Credit Utilization</span>
              <span className={`font-mono font-medium ${
                utilPercent > 80 ? 'text-rose-600 dark:text-rose-400' : utilPercent > 50 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {utilPercent.toFixed(1)}% {utilPercent > 30 && <span className="text-[10px] text-slate-400 dark:text-slate-500">(rec: &le;30%)</span>}
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  utilPercent > 80 ? 'bg-rose-500' : utilPercent > 50 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, utilPercent)}%` }}
              />
            </div>
          </div>

          {/* Payment Date Remainder & Payment Balance */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs">
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block">Payment Date Remainder</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">{card.statementDueDate}</span>
              </div>
              <div className="mt-0.5">
                {isSettledEarly ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Settled</span>
                ) : isOverdue ? (
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Overdue ({Math.abs(diffDays)}d ago)</span>
                ) : (
                  <span className={`text-[10px] font-semibold ${isDueSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {diffDays === 0 ? 'Due Today' : `${diffDays} days remaining`}
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block">Statement Balance</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5 block tabular-nums text-xs">
                {formatMoney(card.statementBalance)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                Min: {formatMoney(card.minimumPayment)}
              </span>
            </div>
          </div>

          {/* Available Credit */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
            <span>Available Credit:</span>
            <span className="font-mono text-slate-700 dark:text-slate-200 tabular-nums">
              {formatMoney(availableCredit)}
            </span>
          </div>

          {/* Friends Swiped Balance Info */}
          {friendsLentOnThisCard > 0 && (
            <div className="flex items-center justify-between text-[11px] p-2 bg-amber-50/80 dark:bg-amber-950/50 rounded-lg border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-300">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Friends Borrowed:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tabular-nums">
                  {formatMoney(friendsLentOnThisCard)}
                </span>
                {onViewFriendSwipes && (
                  <button
                    type="button"
                    onClick={onViewFriendSwipes}
                    className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons with Working Delete */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onPayClick(card.id)}
          className="flex-1 py-2 px-2.5 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
        >
          <span>Pay Balance</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        {/* Functional Delete Card Button */}
        <button
          onClick={handleDelete}
          className="p-2 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          title="Delete Card Account"
          aria-label="Delete Card Account"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* In-App Delete Confirmation Modal (100% reliable inside iFrames) */}
      <DeleteConfirmModal
        target={isDeleteModalOpen ? {
          type: 'card',
          id: card.id,
          title: `${card.name} (•••• ${card.last4})`,
          details: `${card.bankName} · Balance: ${formatMoney(card.currentBalance)} · Limit: ${formatMoney(card.creditLimit)}. Existing ledger transactions will be preserved.`,
        } : null}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          deleteCreditCard(card.id);
        }}
      />
    </div>
  );
};
