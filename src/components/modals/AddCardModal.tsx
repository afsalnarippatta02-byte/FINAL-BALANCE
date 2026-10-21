import React, { useState } from 'react';
import { X, Plus, CreditCard as CardIcon } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { getOffsetDate } from '../../data/initialData';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GRADIENT_PRESETS = [
  { name: 'Midnight Indigo', class: 'from-slate-900 via-blue-950 to-indigo-900' },
  { name: 'Emerald Vault', class: 'from-slate-900 via-teal-950 to-emerald-900' },
  { name: 'Onyx Black', class: 'from-zinc-950 via-neutral-900 to-stone-900' },
  { name: 'Imperial Violet', class: 'from-purple-950 via-slate-900 to-indigo-950' },
  { name: 'Crimson Reserve', class: 'from-rose-950 via-slate-900 to-stone-900' },
];

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose }) => {
  const { addCreditCard, currencySymbol } = useFinance();

  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [last4, setLast4] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [apr, setApr] = useState('21.99');
  const [statementDueDate, setStatementDueDate] = useState(getOffsetDate(15));
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].class);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !creditLimit || !last4) return;

    addCreditCard({
      name,
      bankName: bankName || 'Primary Bank',
      last4: last4.slice(-4),
      currentBalance: parseFloat(currentBalance) || 0,
      creditLimit: parseFloat(creditLimit),
      apr: parseFloat(apr) || 21.99,
      statementDueDate,
      colorTheme: selectedGradient,
    });

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

        <div className="mb-5 flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <CardIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Add Credit Card</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track balance, limits, and debt payoff alerts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Card Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Venture X"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Issuing Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="e.g. Capital One"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Last 4 Digits *</label>
              <input
                type="text"
                required
                maxLength={4}
                value={last4}
                onChange={e => setLast4(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Purchase APR (%)</label>
              <input
                type="number"
                step="0.01"
                value={apr}
                onChange={e => setApr(e.target.value)}
                placeholder="21.99"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Credit Limit ({currencySymbol}) *</label>
              <input
                type="number"
                required
                step="100"
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Current Balance ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                value={currentBalance}
                onChange={e => setCurrentBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Next Payment Due Date *</label>
            <input
              type="date"
              required
              value={statementDueDate}
              onChange={e => setStatementDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Card Theme</label>
            <div className="flex items-center gap-2">
              {GRADIENT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedGradient(p.class)}
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${p.class} border-2 transition-transform ${
                    selectedGradient === p.class ? 'scale-110 border-indigo-600 dark:border-indigo-400 shadow-xs' : 'border-transparent'
                  }`}
                  title={p.name}
                  aria-label={p.name}
                />
              ))}
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
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Card</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
