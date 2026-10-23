import React, { useState, useEffect } from 'react';
import { X, Check, Sliders, DollarSign, RotateCcw } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface CustomizeBudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomizeBudgetsModal: React.FC<CustomizeBudgetsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { categories, updateMultipleCategoryBudgets, currencySymbol, formatMoney } = useFinance();

  // Local state for each category budget
  const [budgetValues, setBudgetValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, number> = {};
      categories.forEach(c => {
        initial[c.id] = c.monthlyBudget;
      });
      setBudgetValues(initial);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleValueChange = (id: string, val: string) => {
    const num = parseFloat(val);
    setBudgetValues(prev => ({
      ...prev,
      [id]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleQuickAdjust = (id: string, delta: number) => {
    setBudgetValues(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const totalCalculatedBudget = Object.values(budgetValues).reduce((sum, val) => sum + val, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updates = Object.entries(budgetValues).map(([categoryId, monthlyBudget]) => ({
      categoryId,
      monthlyBudget,
    }));
    updateMultipleCategoryBudgets(updates);
    onClose();
  };

  const handleResetToDefaults = () => {
    const initial: Record<string, number> = {};
    categories.forEach(c => {
      initial[c.id] = c.monthlyBudget;
    });
    setBudgetValues(initial);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 sm:p-6 text-slate-900 dark:text-slate-100 my-auto flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                Customise Budget Amounts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manually adjust spending limits for each category
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Total Ceiling Summary Banner */}
        <div className="mt-4 p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs">
          <div>
            <span className="text-indigo-900 dark:text-indigo-300 font-medium block">
              Combined Monthly Budget Ceiling:
            </span>
            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 text-sm sm:text-base tabular-nums">
              {formatMoney(totalCalculatedBudget)}
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
            {categories.length} categories
          </span>
        </div>

        {/* Category Inputs List */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto my-4 pr-1 space-y-3">
          {categories.map(cat => {
            const currentVal = budgetValues[cat.id] ?? cat.monthlyBudget;

            return (
              <div 
                key={cat.id}
                className="p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-xs shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {cat.name}
                    </span>
                  </div>

                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-[11px] font-medium pointer-events-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      required
                      value={currentVal}
                      onChange={e => handleValueChange(cat.id, e.target.value)}
                      className="w-full pl-9 pr-2 py-1 text-xs font-mono font-semibold text-right border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Quick adjustment buttons */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/50 dark:border-slate-700/40">
                  <span className="text-slate-400 dark:text-slate-500">Quick adjust:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(cat.id, -100)}
                      className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-mono"
                    >
                      -100
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(cat.id, -50)}
                      className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-mono"
                    >
                      -50
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(cat.id, 50)}
                      className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-mono"
                    >
                      +50
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(cat.id, 100)}
                      className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-mono"
                    >
                      +100
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply All Budgets</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
