import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CreditCard } from '../../types/finance';

interface PaymentModalProps {
  cardId: string | null;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ cardId, onClose }) => {
  const { cards, recordPayment, formatMoney, currencySymbol } = useFinance();
  const card = cards.find(c => c.id === cardId);

  const [paymentType, setPaymentType] = useState<'minimum' | 'statement' | 'full' | 'custom'>('statement');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!card) return null;

  const targetAmount = 
    paymentType === 'minimum' ? card.minimumPayment :
    paymentType === 'statement' ? card.statementBalance :
    paymentType === 'full' ? card.currentBalance :
    parseFloat(customAmount) || 0;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAmount <= 0) return;

    recordPayment(card.id, targetAmount);
    setSuccessMessage(`Payment of ${formatMoney(targetAmount)} posted successfully!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-5 sm:p-6 text-slate-900 dark:text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Make Card Payment</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Apply payoff funds to {card.name} (•••• {card.last4})
          </p>
        </div>

        {successMessage ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">Payment Submitted</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('minimum')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  paymentType === 'minimum'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 font-medium'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">Minimum</span>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-white">{formatMoney(card.minimumPayment)}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('statement')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  paymentType === 'statement'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 font-medium'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">Statement</span>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-white">{formatMoney(card.statementBalance)}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('full')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  paymentType === 'full'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 font-medium'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">Entire Balance</span>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-white">{formatMoney(card.currentBalance)}</span>
              </button>
            </div>

            {/* Custom amount toggle */}
            <div className="pt-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Or enter custom payment amount ({currencySymbol}):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs font-medium">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={card.currentBalance}
                  value={paymentType === 'custom' ? customAmount : targetAmount.toFixed(2)}
                  onChange={(e) => {
                    setPaymentType('custom');
                    setCustomAmount(e.target.value);
                  }}
                  className="w-full pl-12 pr-3 py-2 text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Current Balance:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{formatMoney(card.currentBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance after payment:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(Math.max(0, card.currentBalance - targetAmount))}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 dark:text-slate-500 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span>Statement due date:</span>
                <span>{card.statementDueDate}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={targetAmount <= 0}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <span>Confirm Payment ({formatMoney(targetAmount)})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
