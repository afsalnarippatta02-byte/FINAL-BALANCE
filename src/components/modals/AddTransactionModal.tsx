import React, { useState, useMemo } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { getOffsetDate } from '../../data/initialData';
import { TransactionType, TransactionStatus } from '../../types/finance';
import { suggestCategoryFromDescription } from '../../utils/categorySuggester';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose }) => {
  const { categories, cards, addTransaction, currencySymbol } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [accountId, setAccountId] = useState(cards[0]?.id || 'checking');
  const [date, setDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [status, setStatus] = useState<TransactionStatus>('cleared');
  const [notes, setNotes] = useState('');
  const [userManuallySelectedCategory, setUserManuallySelectedCategory] = useState(false);

  // Automatic real-time category suggestion matching description/merchant keywords
  const categorySuggestion = useMemo(() => {
    return suggestCategoryFromDescription(merchant, categories);
  }, [merchant, categories]);

  const handleMerchantChange = (value: string) => {
    setMerchant(value);
    if (value.trim()) {
      const suggestion = suggestCategoryFromDescription(value, categories);
      if (suggestion && !userManuallySelectedCategory) {
        setCategoryId(suggestion.category.id);
      }
    }
  };

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    setUserManuallySelectedCategory(true);
  };

  // Keep category and account synchronized whenever modal opens or categories change
  React.useEffect(() => {
    if (isOpen) {
      setUserManuallySelectedCategory(false);
      if (categories.length > 0 && (!categoryId || !categories.some(c => c.id === categoryId))) {
        setCategoryId(categories[0].id);
      }
      if (cards.length > 0 && accountId !== 'checking' && !cards.some(c => c.id === accountId)) {
        setAccountId(cards[0].id);
      }
      if (!date) {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDate(`${y}-${m}-${day}`);
      }
    }
  }, [isOpen, categories, cards]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.abs(parseFloat(amount));
    if (!merchant.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const resolvedCategory = categoryId || (categories[0]?.id ?? 'cat-housing');

    addTransaction({
      amount: parsedAmount,
      merchant: merchant.trim(),
      categoryId: resolvedCategory,
      accountId: accountId || 'checking',
      date: date || new Date().toISOString().split('T')[0],
      status,
      type,
      notes: notes.trim() || undefined,
    });

    // Reset input fields
    setAmount('');
    setMerchant('');
    setNotes('');
    setUserManuallySelectedCategory(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Record Transaction</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Log an expense, payment, or income entry</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Segmented Control */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                type === 'expense' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('payment')}
              className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                type === 'payment' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Card Payment
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                type === 'income' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ({currencySymbol}) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs font-medium">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-3 py-2 text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Merchant / Description *
              </label>
              {categorySuggestion && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Auto-categorized
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={merchant}
              onChange={e => handleMerchantChange(e.target.value)}
              placeholder="e.g. Carrefour, Starbucks, Uber, DEWA, Netflix"
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            {categorySuggestion && (
              <div className="mt-1.5 flex items-center justify-between gap-2 p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 text-[11px] truncate">
                    Matched <span className="font-semibold text-slate-900 dark:text-white">"{categorySuggestion.matchedKeyword}"</span> &rarr; Suggested: <strong className="text-indigo-700 dark:text-indigo-300">{categorySuggestion.category.name}</strong>
                  </span>
                </div>
                {categoryId !== categorySuggestion.category.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryId(categorySuggestion.category.id);
                      setUserManuallySelectedCategory(false);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                  >
                    Apply
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 shrink-0 font-semibold">
                    <Check className="w-3 h-3" /> Selected
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Account Source</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="checking">Checking / Cash</option>
                {cards.map(card => (
                  <option key={card.id} value={card.id}>
                    {card.name} (•••• {card.last4})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Settlement Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TransactionStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="cleared">Cleared</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Receipt memo..."
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
