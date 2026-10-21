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
  ArrowUpDown,
  Calendar,
  CalendarDays,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
  Wallet,
  CreditCard as CreditCardIcon,
  Tag
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types/finance';
import { DeleteConfirmModal, DeleteTarget } from './modals/DeleteConfirmModal';

interface TransactionLedgerViewProps {
  onOpenAddTransaction: () => void;
  onOpenImportCSV: () => void;
}

type DatePreset = 'all' | 'this-month' | 'last-30-days' | 'last-month' | 'last-90-days' | 'this-year' | 'custom';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'merchant-asc';

export const TransactionLedgerView: React.FC<TransactionLedgerViewProps> = ({
  onOpenAddTransaction,
  onOpenImportCSV,
}) => {
  const { transactions, categories, cards, deleteTransaction, formatMoney, currencySymbol } = useFinance();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  
  // Mobile filter collapse toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Modal & Toast states
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to calculate date strings for presets
  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const todayStr = formatYMD(now);

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'this-month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatYMD(firstDay));
      setEndDate(formatYMD(lastDay));
    } else if (preset === 'last-month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatYMD(firstDay));
      setEndDate(formatYMD(lastDay));
    } else if (preset === 'last-30-days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      setStartDate(formatYMD(past));
      setEndDate(todayStr);
    } else if (preset === 'last-90-days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 90);
      setStartDate(formatYMD(past));
      setEndDate(todayStr);
    } else if (preset === 'this-year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      setStartDate(formatYMD(firstDay));
      setEndDate(formatYMD(lastDay));
    }
  };

  const handleCustomStartDateChange = (val: string) => {
    setStartDate(val);
    setDatePreset('custom');
  };

  const handleCustomEndDateChange = (val: string) => {
    setEndDate(val);
    setDatePreset('custom');
  };

  const getCategory = (catId: string) => categories.find(c => c.id === catId);
  
  const getAccountLabel = (accId: string) => {
    if (accId === 'checking') return 'Checking / Cash';
    const card = cards.find(c => c.id === accId);
    return card ? `${card.name} (•••• ${card.last4})` : 'Credit Card';
  };

  // Active filters count calculation
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (datePreset !== 'all' || startDate || endDate) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedAccount !== 'all') count++;
    if (selectedType !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    return count;
  }, [searchTerm, datePreset, startDate, endDate, selectedCategory, selectedAccount, selectedType, selectedStatus]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
    setSelectedAccount('all');
    setSelectedType('all');
    setSelectedStatus('all');
    setSortBy('date-desc');
  };

  // Category item counts for dropdown
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(tx => {
      map[tx.categoryId] = (map[tx.categoryId] || 0) + 1;
    });
    return map;
  }, [transactions]);

  // Filtered & Sorted Transactions (Instant automatic computation)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Keyword search (matches merchant, notes, amount, category name, or account name)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const cat = getCategory(tx.categoryId);
        const accLabel = getAccountLabel(tx.accountId);
        const matchesMerchant = tx.merchant.toLowerCase().includes(q);
        const matchesNotes = tx.notes?.toLowerCase().includes(q);
        const matchesAmount = tx.amount.toString().includes(q);
        const matchesCat = cat?.name.toLowerCase().includes(q);
        const matchesAcc = accLabel.toLowerCase().includes(q);

        if (!matchesMerchant && !matchesNotes && !matchesAmount && !matchesCat && !matchesAcc) {
          return false;
        }
      }

      // 2. Date range filter
      if (startDate && tx.date < startDate) {
        return false;
      }
      if (endDate && tx.date > endDate) {
        return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
        return false;
      }

      // 4. Account filter
      if (selectedAccount !== 'all' && tx.accountId !== selectedAccount) {
        return false;
      }

      // 5. Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      // 6. Status filter
      if (selectedStatus !== 'all' && tx.status !== selectedStatus) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      if (sortBy === 'date-desc') {
        return b.date.localeCompare(a.date);
      }
      if (sortBy === 'date-asc') {
        return a.date.localeCompare(b.date);
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      if (sortBy === 'merchant-asc') {
        return a.merchant.localeCompare(b.merchant);
      }
      return 0;
    });
  }, [transactions, searchTerm, startDate, endDate, selectedCategory, selectedAccount, selectedType, selectedStatus, sortBy, categories, cards]);

  // Financial aggregates for current filtered results
  const filteredAggregates = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let totalPayment = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === 'expense') totalExpense += tx.amount;
      else if (tx.type === 'income') totalIncome += tx.amount;
      else if (tx.type === 'payment') totalPayment += tx.amount;
    });

    return {
      totalExpense,
      totalIncome,
      totalPayment,
      net: totalIncome - totalExpense
    };
  }, [filteredTransactions]);

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
    a.download = `final_balance_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header with Title and Responsive Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Transaction Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time automated filtering across {transactions.length} records
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            title="Download filtered transactions as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenImportCSV}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onOpenAddTransaction}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Search & Automated Filter Center */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-xs transition-colors duration-200 space-y-3.5">
        {/* Primary Row: Keyword Search + Quick Date Preset + Filter Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search keyword (merchant, note, amount, category, account)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                title="Clear search text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-44">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={datePreset}
                onChange={e => applyDatePreset(e.target.value as DatePreset)}
                className="w-full pl-8 pr-7 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
              >
                <option value="all">Date: All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="last-month">Last Month</option>
                <option value="last-90-days">Last 90 Days</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Toggle Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(prev => !prev)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors shrink-0 ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
              {showAdvancedFilters ? (
                <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Date Range Inputs (Visible when Custom is picked or when Advanced is toggled) */}
        {(datePreset === 'custom' || showAdvancedFilters) && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Date From */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  From Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => handleCustomStartDateChange(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  To Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => handleCustomEndDateChange(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Categories ({transactions.length})</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({categoryCounts[c.id] || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Account / Card Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Account / Credit Card
                </label>
                <select
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Accounts</option>
                  <option value="checking">Checking / Cash</option>
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (•••• {c.last4})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Transaction Type
                </label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Types</option>
                  <option value="expense">Expenses Only</option>
                  <option value="payment">Credit Card Payments</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="cleared">Cleared Only</option>
                  <option value="pending">Pending Only</option>
                </select>
              </div>

              {/* Sort By Filter */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value="date-desc">Date: Newest First</option>
                  <option value="date-asc">Date: Oldest First</option>
                  <option value="amount-desc">Amount: Highest First</option>
                  <option value="amount-asc">Amount: Lowest First</option>
                  <option value="merchant-asc">Merchant: A to Z</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 3. Active Filters Chips & Quick Reset */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Active:</span>

            {searchTerm.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                <span>Keyword: "{searchTerm}"</span>
                <button onClick={() => setSearchTerm('')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(startDate || endDate || datePreset !== 'all') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px]">
                <Calendar className="w-3 h-3" />
                <span>
                  {startDate && endDate 
                    ? `${startDate} → ${endDate}`
                    : startDate 
                    ? `From ${startDate}` 
                    : endDate 
                    ? `To ${endDate}` 
                    : datePreset}
                </span>
                <button onClick={() => applyDatePreset('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                <span>Category: {getCategory(selectedCategory)?.name || selectedCategory}</span>
                <button onClick={() => setSelectedCategory('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedAccount !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                <span>Account: {getAccountLabel(selectedAccount)}</span>
                <button onClick={() => setSelectedAccount('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                <span>Type: {selectedType}</span>
                <button onClick={() => setSelectedType('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                <span>Status: {selectedStatus}</span>
                <button onClick={() => setSelectedStatus('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}

        {/* 4. Automated Live Aggregates Strip for Filtered Transactions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wider block">
              Matches
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              {filteredTransactions.length} of {transactions.length}
            </span>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wider block">
              Filtered Spend
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              {formatMoney(filteredAggregates.totalExpense)}
            </span>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wider block">
              Payments In
            </span>
            <span className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatMoney(filteredAggregates.totalPayment)}
            </span>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wider block">
              Net Impact
            </span>
            <span className={`text-xs sm:text-sm font-bold tabular-nums ${
              filteredAggregates.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {filteredAggregates.net >= 0 ? '+' : ''}{formatMoney(filteredAggregates.net)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Dual Screen-Size Presentation: Mobile Cards (< 640px) vs Full Table (>= 640px) */}
      
      {/* MOBILE COMPACT CARD VIEW (sm:hidden) - Perfect thumb-friendly design without sideways scroll */}
      <div className="sm:hidden space-y-2.5">
        {transactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center text-xs">
            <ReceiptText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No Transactions Recorded Yet</p>
            <p className="text-slate-400 dark:text-slate-500 mt-1 mb-3">Add your first expense or import a statement.</p>
            <button
              onClick={onOpenAddTransaction}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg shadow-xs"
            >
              + Record Transaction
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
            No transactions match the selected keyword, date, or category filters.
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const cat = getCategory(tx.categoryId);
            const isPayment = tx.type === 'payment';
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs transition-colors"
              >
                {/* Top Row: Date, Status, Delete */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      {tx.date}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      tx.status === 'cleared'
                        ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                        : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60'
                    }`}>
                      {tx.status === 'cleared' ? 'Cleared' : 'Pending'}
                    </span>
                  </div>

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
                    aria-label={`Delete ${tx.merchant}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Middle Row: Merchant & Amount */}
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm block truncate">
                      {tx.merchant}
                    </span>
                    {tx.notes && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">
                        {tx.notes}
                      </span>
                    )}
                  </div>
                  <span className={`font-mono font-bold text-sm shrink-0 tabular-nums ${
                    isPayment 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : isIncome 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {isPayment ? '-' : isIncome ? '+' : ''}{formatMoney(tx.amount)}
                  </span>
                </div>

                {/* Bottom Row: Category & Account Badges */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color || '#94a3b8' }}
                    />
                    <span className="truncate">{cat?.name || 'Uncategorized'}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 truncate">
                    {tx.accountId === 'checking' ? (
                      <Wallet className="w-3 h-3 text-slate-400" />
                    ) : (
                      <CreditCardIcon className="w-3 h-3 text-slate-400" />
                    )}
                    <span className="truncate">{getAccountLabel(tx.accountId)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP / TABLET FULL TABLE VIEW (hidden sm:block) */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors duration-200">
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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No Transactions Recorded</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Click below to record your first expense or import a statement.</p>
                      <button
                        onClick={onOpenAddTransaction}
                        className="mt-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg shadow-xs"
                      >
                        + Record Transaction
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No transactions found matching your search or filters.
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

      {/* 6. In-App Delete Confirmation Modal */}
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

      {/* 7. Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-40 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
