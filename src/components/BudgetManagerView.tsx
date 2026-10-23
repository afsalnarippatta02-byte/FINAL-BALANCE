import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Edit3, 
  Plus, 
  Sliders,
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { BudgetCategory } from '../types/finance';
import { BudgetProgressBar } from './BudgetProgressBar';
import { BudgetEditModal } from './modals/BudgetEditModal';
import { CustomizeBudgetsModal } from './modals/CustomizeBudgetsModal';
import { DeleteConfirmModal, DeleteTarget } from './modals/DeleteConfirmModal';

export const BudgetManagerView: React.FC = () => {
  const { categories, transactions, addCategory, deleteCategory, formatMoney, currencySymbol } = useFinance();
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isCustomizeAllOpen, setIsCustomizeAllOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('300');
  const [newCatColor, setNewCatColor] = useState('#6366F1');

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Calculate actual spend for each category in current month (or all recorded expenses if new month)
  const categoryStats = useMemo(() => {
    const spendMap: Record<string, number> = {};
    const allExpenses = transactions.filter(tx => tx.type === 'expense');
    const thisMonthExpenses = allExpenses.filter(tx => tx.date.startsWith(currentMonthPrefix));
    const targetList = thisMonthExpenses.length > 0 ? thisMonthExpenses : allExpenses;

    targetList.forEach(tx => {
      const targetCatId = categories.some(c => c.id === tx.categoryId)
        ? tx.categoryId
        : (categories[0]?.id ?? 'cat-housing');
      spendMap[targetCatId] = (spendMap[targetCatId] || 0) + tx.amount;
    });

    return categories.map(cat => {
      const spent = parseFloat((spendMap[cat.id] || 0).toFixed(2));
      const remaining = cat.monthlyBudget - spent;
      const percent = cat.monthlyBudget > 0 ? (spent / cat.monthlyBudget) * 100 : 0;
      const isOver = spent > cat.monthlyBudget;

      return {
        ...cat,
        spent,
        remaining,
        percent,
        isOver,
      };
    });
  }, [categories, transactions, currentMonthPrefix]);

  const totalBudget = useMemo(() => {
    return categories.reduce((sum, c) => sum + c.monthlyBudget, 0);
  }, [categories]);

  const totalSpent = useMemo(() => {
    return categoryStats.reduce((sum, c) => sum + c.spent, 0);
  }, [categoryStats]);

  const totalRemaining = totalBudget - totalSpent;
  const overallPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatBudget) return;

    addCategory({
      name: newCatName,
      monthlyBudget: parseFloat(newCatBudget) || 200,
      iconName: 'Tag',
      color: newCatColor,
    });

    setNewCatName('');
    setIsNewCategoryModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Meter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              Monthly Budget Allocator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set and customise spending targets by category to control your living expenses
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsCustomizeAllOpen(true)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Manually set all budget amounts"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Customise Budgets</span>
            </button>

            <button
              onClick={() => setIsNewCategoryModalOpen(true)}
              className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Overall Monthly Consumption: {overallPercent.toFixed(1)}%
            </span>
            <span className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
              {formatMoney(totalSpent)} of {formatMoney(totalBudget)}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercent > 100 ? 'bg-rose-500' : overallPercent > 85 ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${totalRemaining >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{totalRemaining >= 0 ? 'Remaining capacity:' : 'Current deficit:'}</span>
              <strong className="font-mono text-slate-800 dark:text-slate-200">{formatMoney(Math.abs(totalRemaining))}</strong>
            </span>
            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
              Period: {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryStats.map(cat => {
          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-md shrink-0" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{cat.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1 text-xs"
                      title="Edit Monthly Budget"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium hidden sm:inline">Edit Target</span>
                    </button>

                    <button
                      onClick={() => {
                        setDeleteTarget({
                          type: 'category',
                          id: cat.id,
                          title: cat.name,
                          details: `Monthly limit: ${formatMoney(cat.monthlyBudget)}. Transactions under this category will remain intact.`,
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                      title="Delete category"
                      aria-label={`Delete category ${cat.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Reusable Visual Budget Progress Bar */}
                <div className="my-2">
                  <BudgetProgressBar
                    category={cat}
                    spent={cat.spent}
                    showDetails={false}
                    size="md"
                  />
                </div>
              </div>

              {/* Status footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {cat.isOver ? (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Over by {formatMoney(Math.abs(cat.remaining))}</span>
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{formatMoney(cat.remaining)} remaining</span>
                  </span>
                )}

                <button
                  onClick={() => setSelectedCategory(cat)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                >
                  Adjust Limit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {selectedCategory && (
        <BudgetEditModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}

      {/* Customize All Budgets Modal */}
      <CustomizeBudgetsModal
        isOpen={isCustomizeAllOpen}
        onClose={() => setIsCustomizeAllOpen(false)}
      />

      {/* Add New Category Modal */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-6 text-slate-900 dark:text-slate-100 relative">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight mb-3">
              Add Spending Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Travel & Vacations"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Budget Limit ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="25"
                  min="10"
                  required
                  value={newCatBudget}
                  onChange={e => setNewCatBudget(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Color Marker</label>
                <div className="flex items-center gap-2">
                  {['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#F43F5E', '#64748B'].map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewCatColor(col)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        newCatColor === col ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg shadow-xs"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (100% reliable inside iFrames) */}
      <DeleteConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteCategory(deleteTarget.id);
            setToastMessage(`Deleted category "${deleteTarget.title}"`);
            setTimeout(() => setToastMessage(null), 3000);
          }
        }}
      />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-40 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
