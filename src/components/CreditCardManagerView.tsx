import React, { useState, useMemo } from 'react';
import { 
  CreditCard as CardIcon, 
  Plus, 
  Calculator, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CreditCardCard } from './CreditCardCard';
import { CreditCard } from '../types/finance';
import { FriendsCreditView } from './FriendsCreditView';
import { AddFriendLoanModal } from './modals/AddFriendLoanModal';

interface CreditCardManagerViewProps {
  onPayCard: (cardId: string) => void;
  onOpenAddCard: () => void;
  initialSubTab?: 'cards' | 'friends';
}

export const CreditCardManagerView: React.FC<CreditCardManagerViewProps> = ({
  onPayCard,
  onOpenAddCard,
  initialSubTab = 'cards',
}) => {
  const { cards, alerts, formatMoney, currencySymbol, friendLoans } = useFinance();
  const [subTab, setSubTab] = useState<'cards' | 'friends'>(initialSubTab);
  const [isAddFriendSwipeOpen, setIsAddFriendSwipeOpen] = useState(false);

  const pendingFriendsCount = friendLoans.filter(l => l.status === 'pending').length;

  // Sync subTab if initialSubTab prop changes
  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Debt Payoff Simulator state
  const totalDebt = useMemo(() => {
    return cards.reduce((sum, c) => sum + c.currentBalance, 0);
  }, [cards]);

  const totalMinimumPayment = useMemo(() => {
    return cards.reduce((sum, c) => sum + c.minimumPayment, 0);
  }, [cards]);

  const averageApr = useMemo(() => {
    if (totalDebt === 0) return 0;
    const weightedSum = cards.reduce((sum, c) => sum + c.apr * c.currentBalance, 0);
    return weightedSum / totalDebt;
  }, [cards, totalDebt]);

  const [monthlyPaymentTarget, setMonthlyPaymentTarget] = useState<number>(() => {
    return Math.max(200, Math.round(totalMinimumPayment * 1.5));
  });

  // Calculate payoff timeline
  const payoffCalculation = useMemo(() => {
    if (totalDebt <= 0) {
      return { months: 0, totalInterest: 0, interestSaved: 0 };
    }

    const monthlyRate = averageApr / 100 / 12;
    const payment = Math.max(monthlyPaymentTarget, totalMinimumPayment);

    // If payment cannot even cover monthly interest, it will never pay off
    const initialMonthlyInterest = totalDebt * monthlyRate;
    if (payment <= initialMonthlyInterest) {
      return { months: 999, totalInterest: 999999, interestSaved: 0 };
    }

    // Amortization simulation
    let balance = totalDebt;
    let months = 0;
    let totalInterestPaid = 0;

    while (balance > 0.01 && months < 360) {
      months++;
      const interest = balance * monthlyRate;
      totalInterestPaid += interest;
      balance = balance + interest - payment;
      if (balance < 0) balance = 0;
    }

    // Baseline if paying only minimum (approximate ~2.5% of balance or min $25)
    let minBalance = totalDebt;
    let minMonths = 0;
    let minTotalInterest = 0;
    while (minBalance > 0.01 && minMonths < 360) {
      minMonths++;
      const minInterest = minBalance * monthlyRate;
      minTotalInterest += minInterest;
      const minPay = Math.max(35, minBalance * 0.025);
      minBalance = minBalance + minInterest - minPay;
      if (minBalance < 0) minBalance = 0;
    }

    const interestSaved = Math.max(0, minTotalInterest - totalInterestPaid);

    return {
      months,
      totalInterest: totalInterestPaid,
      interestSaved,
    };
  }, [totalDebt, averageApr, monthlyPaymentTarget, totalMinimumPayment]);

  return (
    <div className="space-y-6">
      {/* Top Segmented Sub-Tab Switcher: My Cards & Debt vs Friend Swipes */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl max-w-sm sm:max-w-md w-full border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setSubTab('cards')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            subTab === 'cards'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CardIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>My Cards & Debt</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('friends')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all relative ${
            subTab === 'friends'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-amber-500" />
          <span>Friend Swipes</span>
          {pendingFriendsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold">
              {pendingFriendsCount}
            </span>
          )}
        </button>
      </div>

      {subTab === 'friends' ? (
        <FriendsCreditView isEmbedded />
      ) : (
        <>
          {/* Top Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs transition-colors duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                  Credit Cards & Debt Management
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live statement balances, payment due date countdowns, and repayment projections
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFriendSwipeOpen(true)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  title="Record a friend's swipe on one of your credit cards"
                >
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>+ Friend Swipe</span>
                </button>

                <button
                  onClick={onOpenAddCard}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Credit Card</span>
                </button>
              </div>
            </div>

        {/* High-level Debt & Utilization Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Credit Card Debt</span>
            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1 block tabular-nums">
              {formatMoney(totalDebt)}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Combined Minimum Due</span>
            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1 block tabular-nums">
              {formatMoney(totalMinimumPayment)}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Weighted Average APR</span>
            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1 block tabular-nums">
              {averageApr.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Credit Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            Your Credit Accounts ({cards.length})
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            Direct Management
          </span>
        </div>

        {cards.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <CardIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No Credit Cards Registered</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
              Add your UAE (e.g. ENBD, Mashreq) or Indian (e.g. HDFC, ICICI, SBI) cards to monitor balances and upcoming payment dates.
            </p>
            <button
              onClick={onOpenAddCard}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Credit Card</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(card => (
              <CreditCardCard
                key={card.id}
                card={card}
                onPayClick={(id) => onPayCard(id)}
                onViewFriendSwipes={() => setSubTab('friends')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Real-Time Debt Payoff Calculator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Debt Payoff Acceleration Calculator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculate the exact date you can be completely debt-free by increasing your monthly payment
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Slider & Input */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                <span>Planned Monthly Payoff Budget:</span>
                <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {formatMoney(monthlyPaymentTarget)} / mo
                </span>
              </div>

              <input
                type="range"
                min={Math.max(50, Math.round(totalMinimumPayment))}
                max={Math.max(500, Math.round(totalDebt))}
                step={25}
                value={monthlyPaymentTarget}
                onChange={e => setMonthlyPaymentTarget(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
              />

              <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                <span>Min: {formatMoney(totalMinimumPayment)}/mo</span>
                <span>Balanced: {formatMoney(totalMinimumPayment * 2)}/mo</span>
                <span>Aggressive: {formatMoney(Math.min(totalDebt, totalMinimumPayment * 4))}/mo</span>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Quick Targets:</span>
              <button
                type="button"
                onClick={() => setMonthlyPaymentTarget(Math.round(totalMinimumPayment))}
                className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
              >
                Minimum ({formatMoney(totalMinimumPayment)})
              </button>
              <button
                type="button"
                onClick={() => setMonthlyPaymentTarget(Math.round(totalMinimumPayment * 2))}
                className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
              >
                2x Minimum ({formatMoney(totalMinimumPayment * 2)})
              </button>
              <button
                type="button"
                onClick={() => setMonthlyPaymentTarget(Math.round(totalDebt / 6))}
                className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
              >
                6-Month Payoff ({formatMoney(Math.round(totalDebt / 6))})
              </button>
            </div>
          </div>

          {/* Outcome projection card */}
          <div className="p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl space-y-3 border border-slate-800 dark:border-slate-700">
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Projected Debt-Free Timeline
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight mt-0.5 text-white tabular-nums">
                {payoffCalculation.months >= 999 
                  ? 'Payment too low' 
                  : `${payoffCalculation.months} Months`}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800 dark:border-slate-700 text-xs">
              <div className="flex justify-between text-slate-300 dark:text-slate-300">
                <span>Estimated Interest:</span>
                <span className="font-mono text-white">
                  {formatMoney(payoffCalculation.totalInterest)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Interest Saved:</span>
                <span className="font-mono">
                  {formatMoney(payoffCalculation.interestSaved)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )}

      {/* Quick Add Friend Swipe Modal */}
      <AddFriendLoanModal
        isOpen={isAddFriendSwipeOpen}
        onClose={() => setIsAddFriendSwipeOpen(false)}
      />
    </div>
  );
};
