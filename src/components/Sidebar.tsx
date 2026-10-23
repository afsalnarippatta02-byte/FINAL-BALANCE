import React from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  CreditCard, 
  ReceiptText, 
  AlertCircle, 
  RotateCcw,
  Sun,
  Moon,
  CheckCircle2,
  Trash2,
  Users,
  Settings
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';

export type NavTab = 'dashboard' | 'budgets' | 'cards' | 'transactions' | 'friends';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenSettings,
}) => {
  const { alerts, clearAllData, friendLoans, currencySymbol } = useFinance();
  const { isDark, toggleTheme } = useTheme();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = React.useState(false);

  const urgentAlertsCount = alerts.filter(a => a.severity === 'critical' || a.type === 'due_soon').length;
  const pendingFriendsCount = friendLoans.filter(l => l.status === 'pending').length;

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'budgets' as NavTab, label: 'Monthly Budgets', icon: PieChart },
    { 
      id: 'cards' as NavTab, 
      label: 'Credit Cards & Debt', 
      icon: CreditCard,
      badge: urgentAlertsCount > 0 ? urgentAlertsCount : undefined 
    },
    { 
      id: 'friends' as NavTab, 
      label: 'Friends Using My Card', 
      icon: Users,
      badge: pendingFriendsCount > 0 ? pendingFriendsCount : undefined 
    },
    { id: 'transactions' as NavTab, label: 'Transactions', icon: ReceiptText },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand wordmark & Contract */}
        <div>
          <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center font-bold text-sm tracking-tighter shadow-xs">
                FB
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base leading-tight">
                  Final Balance
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium uppercase tracking-wider">
                  Personal Finance
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Middle/Bottom Area */}
        <div className="p-4 space-y-3">
          {/* Settings Trigger with Currency Indicator */}
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Settings</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600/60 shadow-2xs">
              {currencySymbol}
            </span>
          </button>

          {/* Dark Mode Theme Toggle Component */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs transition-colors">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
              {isDark ? (
                <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className="text-xs">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>

            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isDark ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={isDark}
              aria-label="Toggle dark mode theme"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isDark ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* User Profile & Clear Data */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-semibold text-[10px]">
                AN
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]">Afsal N.</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                title="Clear all data (clean slate)"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                aria-label="Clear all data"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* In-App Clear All Data Confirmation Dialog */}
        {isClearConfirmOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsClearConfirmOpen(false)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xs w-full p-5 text-slate-900 dark:text-slate-100"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold tracking-tight mb-1.5 text-slate-900 dark:text-white">
                Clear All Existing Data?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                This will permanently remove all transactions, registered credit cards, friends credit loans, and sync logs, giving you a clean slate.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAllData();
                    setIsClearConfirmOpen(false);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                >
                  Clear Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
