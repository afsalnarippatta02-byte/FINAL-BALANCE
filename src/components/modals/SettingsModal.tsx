import React, { useState } from 'react';
import { X, Settings, Coins, Moon, Sun, Trash2, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { CurrencyCode } from '../../types/finance';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currency, setCurrency, currencySymbol, formatMoney, clearAllData } = useFinance();
  const { isDark, toggleTheme } = useTheme();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 sm:p-6 text-slate-900 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preferences & Currency Settings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* 1. Global Currency Setting - Simple Clean Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Default Currency</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Active: <span className="font-semibold text-slate-900 dark:text-white">{currencySymbol}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* AED Option */}
              <button
                type="button"
                onClick={() => setCurrency('AED')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  currency === 'AED'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-600/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🇦🇪</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">AED</span>
                  </div>
                  {currency === 'AED' && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  UAE Dirham
                </span>
                <span className="text-[10px] font-mono font-medium text-slate-700 dark:text-slate-300 mt-1 block">
                  e.g. AED 1,250.00
                </span>
              </button>

              {/* INR Option */}
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  currency === 'INR'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-600/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🇮🇳</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">₹ INR</span>
                  </div>
                  {currency === 'INR' && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Indian Rupee
                </span>
                <span className="text-[10px] font-mono font-medium text-slate-700 dark:text-slate-300 mt-1 block">
                  e.g. ₹1,250.00
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Charts, totals, statement feeds, and card balances automatically update dynamically.
            </p>
          </div>

          {/* 2. Theme Appearance */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Appearance Theme
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Account Info & Data Reset */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-900 dark:text-white block mb-2">
              Data Management
            </span>

            <button
              onClick={() => setIsClearConfirmOpen(true)}
              className="w-full py-2 px-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Data (Clean Slate)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>

        {/* Clear Data Confirmation */}
        {isClearConfirmOpen && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsClearConfirmOpen(false)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xs w-full p-5 text-slate-900 dark:text-slate-100"
              onClick={e => e.stopPropagation()}
            >
              <h4 className="text-sm font-semibold tracking-tight mb-1 text-slate-900 dark:text-white">
                Clear All Data?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Permanently removes all transactions, cards, friends loans, and sync records.
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
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                >
                  Clear Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
