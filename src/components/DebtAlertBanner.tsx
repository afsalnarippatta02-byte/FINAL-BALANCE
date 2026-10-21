import React, { useState } from 'react';
import { AlertTriangle, Clock, CreditCard, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { DebtAlert } from '../types/finance';

interface DebtAlertBannerProps {
  onSelectCardForPayment?: (cardId: string) => void;
  onNavigateToCards?: () => void;
}

export const DebtAlertBanner: React.FC<DebtAlertBannerProps> = ({ 
  onSelectCardForPayment,
  onNavigateToCards 
}) => {
  const { alerts, cards, formatMoney } = useFinance();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const activeAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 transition-colors">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="font-semibold text-emerald-950 dark:text-emerald-200">All Clear:</strong> No overdue statements or urgent credit card payoff deadlines in the next 7 days.
          </span>
        </div>
        <span className="text-emerald-700/80 dark:text-emerald-400/80 font-mono text-[11px]">Good Standing</span>
      </div>
    );
  }

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };

  return (
    <div className="space-y-2.5">
      {activeAlerts.map(alert => {
        const isCritical = alert.severity === 'critical';
        const isDueDate = alert.type === 'due_soon' || alert.type === 'overdue';
        const card = alert.cardId ? cards.find(c => c.id === alert.cardId) : null;

        return (
          <div
            key={alert.id}
            className={`rounded-xl border px-4 py-3 text-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isCritical
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                isCritical 
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300' 
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300'
              }`}>
                {isDueDate ? <Clock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm tracking-tight">{alert.title}</span>
                  {alert.dueDate && (
                    <span className="font-mono text-[11px] opacity-75">
                      (Due: {alert.dueDate})
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  {alert.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {card && onSelectCardForPayment && (
                <button
                  onClick={() => onSelectCardForPayment(card.id)}
                  className={`px-3 py-1.5 font-medium rounded-lg text-xs transition-colors whitespace-nowrap shadow-xs ${
                    isCritical
                      ? 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500'
                      : 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500'
                  }`}
                >
                  Pay Minimum ({formatMoney(card.minimumPayment)})
                </button>
              )}

              {onNavigateToCards && (
                <button
                  onClick={onNavigateToCards}
                  className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors flex items-center gap-1"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => dismissAlert(alert.id)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                title="Dismiss Alert"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
