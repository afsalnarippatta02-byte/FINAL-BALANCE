import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { BudgetCategory } from '../../types/finance';

interface BudgetEditModalProps {
  category: BudgetCategory | null;
  onClose: () => void;
}

export const BudgetEditModal: React.FC<BudgetEditModalProps> = ({ category, onClose }) => {
  const { updateCategoryBudget, currencySymbol, formatMoney } = useFinance();
  const [budget, setBudget] = useState(category ? category.monthlyBudget.toString() : '');

  if (!category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(budget);
    if (!isNaN(parsed) && parsed >= 0) {
      updateCategoryBudget(category.id, parsed);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-6 text-slate-900 dark:text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Adjust Monthly Budget</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{category.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Monthly Spending Target ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs font-medium">{currencySymbol}</span>
              <input
                type="number"
                step="25"
                min="0"
                required
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full pl-12 pr-3 py-2 text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Previous target was {formatMoney(category.monthlyBudget)}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
              <Check className="w-3.5 h-3.5" />
              <span>Save Budget</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
