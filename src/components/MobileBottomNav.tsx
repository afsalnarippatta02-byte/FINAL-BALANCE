import React from 'react';
import { LayoutDashboard, PieChart, CreditCard, ReceiptText, Users } from 'lucide-react';
import { NavTab } from './Sidebar';
import { useFinance } from '../context/FinanceContext';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { alerts, friendLoans } = useFinance();
  const urgentAlertsCount = alerts.filter(a => a.severity === 'critical' || a.type === 'due_soon').length;
  const pendingFriendsCount = friendLoans.filter(l => l.status === 'pending').length;

  const items = [
    { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { 
      id: 'cards' as NavTab, 
      label: 'Cards', 
      icon: CreditCard,
      badge: urgentAlertsCount > 0 ? urgentAlertsCount : (pendingFriendsCount > 0 ? pendingFriendsCount : undefined),
      badgeColor: urgentAlertsCount > 0 ? 'bg-rose-500' : 'bg-amber-500'
    },
    { id: 'budgets' as NavTab, label: 'Budgets', icon: PieChart },
    { id: 'transactions' as NavTab, label: 'Ledger', icon: ReceiptText },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-3 py-1 flex items-center justify-around shadow-lg transition-colors">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.id || (item.id === 'cards' && currentTab === 'friends');

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-lg transition-colors relative ${
              isActive 
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              {item.badge !== undefined && (
                <span className={`absolute -top-1 -right-2 ${item.badgeColor || 'bg-rose-500'} text-white font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold`}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[58px]">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
