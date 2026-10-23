import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { FriendLoan } from '../../types/finance';

interface SettleFriendLoanModalProps {
  loan: FriendLoan | null;
  onClose: () => void;
}

export const SettleFriendLoanModal: React.FC<SettleFriendLoanModalProps> = ({ loan, onClose }) => {
  const { settleFriendLoan, cards, formatMoney } = useFinance();
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [restoreCardLimit, setRestoreCardLimit] = useState(true);

  if (!loan) return null;

  const card = cards.find(c => c.id === loan.cardId);

  const handleConfirm = () => {
    settleFriendLoan(loan.id, returnDate, restoreCardLimit);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 sm:p-6 text-slate-900 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                Record Friend Repayment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mark debt as returned and settled
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loan summary banner */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Borrower:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{loan.friendName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Amount Repaid:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatMoney(loan.amount)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Card Used:</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {card ? `${card.name} (•••• ${card.last4})` : 'Credit Card'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Original Purpose:</span>
            <span className="text-slate-700 dark:text-slate-300">{loan.purpose}</span>
          </div>
        </div>

        {/* Return Date */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Date Returned
          </label>
          <input
            type="date"
            value={returnDate}
            onChange={e => setReturnDate(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* Restore Limit Checkbox */}
        <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={restoreCardLimit}
              onChange={e => setRestoreCardLimit(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 dark:bg-slate-800"
            />
            <div className="text-xs">
              <span className="font-medium text-slate-900 dark:text-white block">
                Restore Credit Card Limit
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                Deducts {formatMoney(loan.amount)} from {card?.name || 'card'} current balance to restore your available credit.
              </span>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Mark as Returned
          </button>
        </div>
      </div>
    </div>
  );
};
