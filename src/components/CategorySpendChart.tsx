import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps & { currencySymbol: string; formatMoney: (val: number) => string }> = ({ 
  active, 
  payload, 
  currencySymbol, 
  formatMoney 
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isOver = data.spent > data.budget;
    const percent = data.budget > 0 ? ((data.spent / data.budget) * 100).toFixed(1) : '0';

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-3 text-xs min-w-[180px]">
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">{data.fullName}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>Spent:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">
              {formatMoney(data.spent)}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Monthly Budget:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {formatMoney(data.budget)}
            </span>
          </div>
          <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span>Budget Utilized:</span>
            <span className={`font-mono font-medium ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {percent}% {isOver ? '(Exceeded)' : ''}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const CategorySpendChart: React.FC = () => {
  const { categories, transactions, formatMoney, currencySymbol } = useFinance();
  const { isDark } = useTheme();
  const [metricMode, setMetricMode] = useState<'actual' | 'comparison'>('comparison');

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const chartData = useMemo(() => {
    // Tally current month expenses by category
    const catSpendMap: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonthPrefix)) {
        catSpendMap[tx.categoryId] = (catSpendMap[tx.categoryId] || 0) + tx.amount;
      }
    });

    return categories.map(cat => {
      const spent = parseFloat((catSpendMap[cat.id] || 0).toFixed(2));
      const budget = cat.monthlyBudget;
      const isOver = spent > budget;
      return {
        id: cat.id,
        name: cat.name.split(' & ')[0], // short name for clean axis
        fullName: cat.name,
        spent,
        budget,
        color: cat.color,
        isOver,
      };
    }).sort((a, b) => b.spent - a.spent);
  }, [categories, transactions, currentMonthPrefix]);

  const totalMonthlySpent = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.spent, 0);
  }, [chartData]);

  const totalMonthlyBudget = useMemo(() => {
    return categories.reduce((acc, curr) => acc + curr.monthlyBudget, 0);
  }, [categories]);

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const axisColor = isDark ? '#64748b' : '#94a3b8';
  const budgetBarFill = isDark ? '#334155' : '#e2e8f0';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Monthly Spending Distribution by Category
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              ({now.toLocaleString('default', { month: 'long', year: 'numeric' })})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time expenditure tracking compared with target budget ceilings
          </p>
        </div>

        {/* Segmented filter controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('comparison')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              metricMode === 'comparison'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Spent vs Budget
          </button>
          <button
            onClick={() => setMetricMode('actual')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              metricMode === 'actual'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Spending Only
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis 
              dataKey="name" 
              stroke={axisColor} 
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis 
              stroke={axisColor} 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${currencySymbol} ${v}`}
            />
            <Tooltip 
              content={<CustomTooltip currencySymbol={currencySymbol} formatMoney={formatMoney} />} 
              cursor={{ fill: isDark ? '#1e293b' : '#f8fafc' }} 
            />
            
            {metricMode === 'comparison' && (
              <Bar 
                dataKey="budget" 
                name="Budget Cap" 
                fill={budgetBarFill} 
                radius={[4, 4, 0, 0]} 
                maxBarSize={32}
              />
            )}
            
            <Bar 
              dataKey="spent" 
              name="Actual Spent" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={32}
            >
              {chartData.map((entry) => (
                <Cell 
                  key={`cell-${entry.id}`} 
                  fill={entry.isOver ? '#f43f5e' : entry.color || '#4f46e5'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Row */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
            <span>Actual Spend</span>
          </div>
          {metricMode === 'comparison' && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-700 inline-block" />
              <span>Budget Target</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            <span>Over Budget</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Month total:</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatMoney(totalMonthlySpent)}
          </span>
          <span className="text-slate-400 dark:text-slate-500">/</span>
          <span className="font-mono text-slate-600 dark:text-slate-400 tabular-nums">
            {formatMoney(totalMonthlyBudget)}
          </span>
        </div>
      </div>
    </div>
  );
};
