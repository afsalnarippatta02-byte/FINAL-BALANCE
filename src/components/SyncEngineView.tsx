import React from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  Upload, 
  History,
  Radio,
  Zap
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface SyncEngineViewProps {
  onOpenImportCSV: () => void;
}

export const SyncEngineView: React.FC<SyncEngineViewProps> = ({ onOpenImportCSV }) => {
  const { 
    cards, 
    syncLogs, 
    isSyncing, 
    autoSyncActive, 
    toggleAutoSync, 
    triggerManualSync, 
    lastGlobalSync,
    formatMoney 
  } = useFinance();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                Automated Transaction Sync Engine
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                autoSyncActive 
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {autoSyncActive ? 'Auto-Polling Active' : 'Polling Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Continuously ingests credit card debits, pending authorizations, and statement updates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoSync}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors border ${
                autoSyncActive
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {autoSyncActive ? 'Pause Background Sync' : 'Resume Background Sync'}
            </button>

            <button
              onClick={() => triggerManualSync()}
              disabled={isSyncing}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isSyncing ? 'Syncing Feeds...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Connected Cards</span>
            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {cards.filter(c => c.isAutoSyncEnabled).length} / {cards.length} Feeds
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Background Polling Interval</span>
            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {autoSyncActive ? 'Every 75s' : 'Manual Only'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Last Global Sync</span>
            <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1.5 block">
              {lastGlobalSync ? new Date(lastGlobalSync).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Connected Financial Institutions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            Connected Card Feeds
          </h3>
          <button
            onClick={onOpenImportCSV}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Statement File (CSV)</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {cards.map(card => (
            <div key={card.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white text-xs">{card.name}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">•••• {card.last4}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {card.bankName} · Balance: {formatMoney(card.currentBalance)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
                  {card.lastSyncedAt ? `Synced ${new Date(card.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Standby'}
                </span>
                <button
                  onClick={() => triggerManualSync(card.id)}
                  disabled={isSyncing}
                  className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md font-medium text-slate-700 dark:text-slate-300"
                >
                  Poll Card
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync History Logs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            Sync Audit Log
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Feed / Source</th>
                <th className="py-2.5 px-3">Records Ingested</th>
                <th className="py-2.5 px-3">Total Amount</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-slate-500">
                    No sync events recorded yet.
                  </td>
                </tr>
              ) : (
                syncLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                      {log.cardName}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {log.transactionsImported} transaction{log.transactionsImported > 1 ? 's' : ''}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {formatMoney(log.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Success</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
