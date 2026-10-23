import React, { useState } from 'react';
import { X, Users, CreditCard, Calendar, Info, DollarSign } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface AddFriendLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFriendLoanModal: React.FC<AddFriendLoanModalProps> = ({ isOpen, onClose }) => {
  const { cards, addFriendLoan, currencySymbol, formatMoney } = useFinance();

  const [friendName, setFriendName] = useState('');
  const [cardId, setCardId] = useState('');
  const [amount, setAmount] = useState('');
  const [swipeDate, setSwipeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Set default card if empty
  React.useEffect(() => {
    if (cards.length > 0 && !cardId) {
      setCardId(cards[0].id);
    }
  }, [cards, cardId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!friendName.trim()) {
      setError("Please enter the friend's name");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    if (!cardId) {
      setError('Please select which credit card was used');
      return;
    }

    if (!purpose.trim()) {
      setError('Please specify what was purchased or the purpose (e.g., Flight ticket, shopping)');
      return;
    }

    addFriendLoan({
      friendName: friendName.trim(),
      cardId,
      amount: numAmount,
      swipeDate,
      expectedReturnDate,
      purpose: purpose.trim(),
      notes: notes.trim() || undefined,
    });

    // Reset & close
    setFriendName('');
    setAmount('');
    setPurpose('');
    setNotes('');
    onClose();
  };

  const selectedCard = cards.find(c => c.id === cardId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 sm:p-6 text-slate-900 dark:text-slate-100 my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                Record Friend Card Swipe
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track money lent to friends using your credit card
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

        {/* Informative Rule Notice */}
        <div className="p-3 mb-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-300">
          <Info className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Budget Protection:</strong> This will increase your card balance and reduce available credit, but <strong>will NOT count</strong> towards your monthly expense budget.
          </p>
        </div>

        {error && (
          <div className="p-2.5 mb-4 text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Friend Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Friend's Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul, Tariq, Ahmed"
              value={friendName}
              onChange={e => setFriendName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Amount & Currency */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount Lent ({currencySymbol}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full pl-12 pr-3 py-2 text-xs font-mono font-medium border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Card Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Credit Card Used <span className="text-rose-500">*</span>
            </label>
            {cards.length === 0 ? (
              <div className="text-xs text-amber-600 dark:text-amber-400 p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-900">
                No credit cards found. Please add a credit card first from the Cards tab.
              </div>
            ) : (
              <select
                value={cardId}
                onChange={e => setCardId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {cards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (•••• {c.last4}) — Bal: {formatMoney(c.currentBalance)}
                  </option>
                ))}
              </select>
            )}
            {selectedCard && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Available Limit: {formatMoney(Math.max(0, selectedCard.creditLimit - selectedCard.currentBalance))}
              </p>
            )}
          </div>

          {/* Dates: Swipe Date and Expected Repayment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Swipe Date
              </label>
              <input
                type="date"
                value={swipeDate}
                onChange={e => setSwipeDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Expected Return Date
              </label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={e => setExpectedReturnDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Purpose / Purchased Item <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Flight ticket to India, Shopping, Emergency cash"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Promised to return before 5th of this month"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={cards.length === 0}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-xs disabled:opacity-50"
            >
              Record Friend Swipe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
