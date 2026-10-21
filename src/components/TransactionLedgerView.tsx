import React, { useState, useMemo } from 'react';
import { 
  ReceiptText, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types/finance';
import { DeleteConfirmModal, DeleteTarget } from './modals/DeleteConfirmModal';

interface TransactionLedgerViewProps {
  onOpenAddTransaction: () => void;
  onOpenImportCSV: () => void;
}

export const TransactionLedgerView: React.FC<TransactionLedgerViewProps> = ({
  onOpenAddTransaction,
  onOpenImportCSV,
}) => {
  const { transactions, categories, cards, deleteTransaction, formatMoney, currencySymbol } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search text
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesMerchant = tx.merchant.toLowerCase().includes(q);
        const matchesNotes = tx.notes?.toLowerCase().includes(q);
        const matchesAmount = tx.amount.toString().includes(q);
        if (!matchesMerchant && !matchesNotes && !matchesAmount) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
        return false;
      }

      // Account filter
      if (selectedAccount !== 'all' && tx.accountId !== selectedAccount) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [transactions, searchTerm, selectedCategory, selectedAccount, selectedType]);

  const getCategory = (catId: string) => categories.find(c => c.id === catId);
  
  const getAccountLabel = (accId: string) => {
    if (accId === 'checking') return 'Checking / Cash';
    const card = cards.find(c => c.id === accId);
    return card ? `${card.name} (•••• ${card.last4})` : 'Credit Card';
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Account', 'Type', 'Status', 'Amount', 'Notes'];
    const rows = filteredTransactions.map(tx => [
      tx.date,
      `"${tx.merchant.replace(/"/g, '""')}"`,
      `"${getCategory(tx.categoryId)?.name || 'Uncategorized'}"`,
      `"${getAccountLabel(tx.accountId)}"`,
      tx.type,
      tx.status,
      tx.amount.toFixed(2),
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Top Bar with Search & Quick Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              Transaction Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and audit all recorded and auto-synced financial activities ({filteredTransactions.length} entries)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Download filtered transactions as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenImportCSV}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Statement</span>
            </button>

            <button
              onClick={onOpenAddTransaction}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search merchant, memo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Accounts / Cards</option>
              <option value="checking">Checking / Cash</option>
              {cards.map(c => (
                <option key={c.id} value={c.id}>{c.name} (•••• {c.last4})</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="payment">Card Payments</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Merchant / Payee</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const cat = getCategory(tx.categoryId);
                  const isPayment = tx.type === 'payment';
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{tx.merchant}</span>
                          {tx.notes && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                              {tx.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {cat ? (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: cat.color }} 
                            />
                            <span>{cat.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Uncategorized</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {getAccountLabel(tx.accountId)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded ${
                          tx.status === 'cleared'
                            ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                            : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60'
                        }`}>
                          {tx.status === 'cleared' ? 'Cleared' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium whitespace-nowrap tabular-nums">
                        <span className={
                          isPayment 
                            ? 'text-indigo-600 dark:text-indigo-400' 
                            : isIncome 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-slate-900 dark:text-white'
                        }>
                          {isPayment ? '-' : isIncome ? '+' : ''}{formatMoney(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setDeleteTarget({
                              type: 'transaction',
                              id: tx.id,
                              title: tx.merchant,
                              details: `${tx.date} · ${formatMoney(tx.amount)} · ${cat?.name || 'Uncategorized'}`,
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                          title="Delete transaction"
                          aria-label={`Delete transaction from ${tx.merchant}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-App Delete Confirmation Modal (100% reliable inside iFrames) */}
      <DeleteConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteTransaction(deleteTarget.id);
            setToastMessage(`Deleted "${deleteTarget.title}"`);
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
