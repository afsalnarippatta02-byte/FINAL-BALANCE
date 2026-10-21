import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, Download, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_CSV = `Date,Merchant,Amount,Category
2026-10-18,Sweetgreen Salads,17.40,Dining & Cafes
2026-10-19,Costco Wholesale,114.25,Groceries & Supplies
2026-10-20,Chevron Gas Station,42.00,Transit & Fuel
2026-10-21,Spotify Premium,11.99,Entertainment & Subscriptions`;

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ isOpen, onClose }) => {
  const { importCSV } = useFinance();
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (!csvText.trim()) return;
    const res = importCSV(csvText);
    setResult(res);
    if (res.added > 0 && res.errors.length === 0) {
      setTimeout(() => {
        onClose();
        setResult(null);
        setCsvText('');
        setFileName(null);
      }, 1500);
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_bank_statement.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5 flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Import Bank Statement (CSV)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bulk sync expenses from your credit card or bank export</p>
          </div>
        </div>

        {result ? (
          <div className="py-6 text-center space-y-3">
            {result.errors.length > 0 ? (
              <div className="text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
                <h4 className="font-semibold text-sm">Import Incomplete</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{result.errors[0]}</p>
                <button
                  onClick={() => setResult(null)}
                  className="mt-4 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                <h4 className="font-semibold text-sm">Successfully Imported {result.added} Transactions!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Balances and category budgets updated.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* File drop zone */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-6 text-center transition-colors">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer block">
                <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  {fileName ? fileName : 'Click to select CSV file from computer'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
                  Supports Chase, Amex, Apple Card, or standard CSV format
                </span>
              </label>
            </div>

            {/* Direct Paste / Preview Box */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Or Paste CSV Text:</label>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Sample Template</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder="Date,Merchant,Amount,Category&#10;2026-10-18,Whole Foods,64.20,Groceries"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!csvText.trim()}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-40"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Transactions</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
