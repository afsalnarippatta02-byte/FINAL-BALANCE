import React from 'react';
import { AlertTriangle, Edit3 } from 'lucide-react';
import { BudgetCategory } from '../types/finance';
import { useFinance } from '../context/FinanceContext';

interface BudgetProgressBarProps {
  category: BudgetCategory;
  spent: number;
  showDetails?: boolean;
  onEdit?: (category: BudgetCategory) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  category,
  spent,
  showDetails = true,
  onEdit,
  size = 'md',
}) => {
  const { formatMoney } = useFinance();
  const budget = category.monthlyBudget;
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const isOver = spent > budget;
  const isNearLimit = percent >= 80 && !isOver;
  const remaining = budget - spent;

  // Clamped percent for the main track (max 100%)
  const clampedPercent = Math.min(100, Math.max(0, percent));

  // Dynamic status colors based on consumption threshold
  const statusColor = isOver
    ? 'text-rose-600 dark:text-rose-400'
    : isNearLimit
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-slate-700 dark:text-slate-300';

  const barFillColor = isOver
    ? 'bg-rose-500'
    : isNearLimit
    ? 'bg-amber-500'
    : category.color || '#4f46e5';

  const trackHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full space-y-1.5">
      {/* Top Header Labels */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: category.color || '#6366F1' }}
            aria-hidden="true"
          />
          <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
            {category.name}
          </span>
          {isOver && (
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5 shrink-0">
              <AlertTriangle className="w-3 h-3" />
              <span>Over Limit</span>
            </span>
          )}
        </div>

        {/* Consumption Percentage */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`font-mono font-semibold tabular-nums text-xs ${statusColor}`}>
            {percent.toFixed(0)}%
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">consumed</span>
        </div>
      </div>

      {/* Visual Multi-State Progress Bar Track */}
      <div className="relative">
        <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full ${trackHeight} overflow-hidden flex`}>
          {/* Main filled progress track */}
          <div
            className={`${barFillColor} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${clampedPercent}%` }}
            role="progressbar"
            aria-valuenow={spent}
            aria-valuemin={0}
            aria-valuemax={budget}
            aria-label={`${category.name} budget consumption`}
          />
        </div>

        {/* 80% Caution Threshold Marker (subtle guide tick) */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white/70 dark:bg-slate-900/80 pointer-events-none"
          style={{ left: '80%' }}
          title="80% Caution Benchmark"
        />
      </div>

      {/* Bottom Context Details: Spent vs Budget & Remaining Delta */}
      {showDetails && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-mono">
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {formatMoney(spent)}
            </span>
            <span className="text-slate-400 dark:text-slate-500">/</span>
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(category)}
                className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer group"
                title="Click to customise budget amount"
              >
                <span className="tabular-nums font-semibold">{formatMoney(budget)}</span>
                <Edit3 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
              </button>
            ) : (
              <span className="tabular-nums">
                {formatMoney(budget)}
              </span>
            )}
          </div>

          <div>
            {isOver ? (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                +{formatMoney(Math.abs(remaining))} exceeded
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                {formatMoney(remaining)} left
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
