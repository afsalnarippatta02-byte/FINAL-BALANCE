/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { BudgetManagerView } from './components/BudgetManagerView';
import { CreditCardManagerView } from './components/CreditCardManagerView';
import { TransactionLedgerView } from './components/TransactionLedgerView';
import { SyncEngineView } from './components/SyncEngineView';
import { PaymentModal } from './components/modals/PaymentModal';
import { AddCardModal } from './components/modals/AddCardModal';
import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { ImportCSVModal } from './components/modals/ImportCSVModal';

import { useFinance } from './context/FinanceContext';

function AppContent() {
  const { cards } = useFinance();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal states
  const [paymentCardId, setPaymentCardId] = useState<string | null>(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isImportCSVOpen, setIsImportCSVOpen] = useState(false);

  const handleOpenPayment = (cardId?: string) => {
    if (cardId) {
      setPaymentCardId(cardId);
    } else if (cards.length > 0) {
      setPaymentCardId(cards[0].id);
    } else {
      setIsAddCardOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* 1. Side Navigation Menu */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header summarizing key financial metrics */}
        <TopHeader
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenAddTransaction={() => setIsAddTxOpen(true)}
          onOpenPaymentModal={() => handleOpenPayment()}
        />

        {/* View Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onPayCard={(cardId) => handleOpenPayment(cardId)}
              onOpenAddTransaction={() => setIsAddTxOpen(true)}
            />
          )}

          {currentTab === 'budgets' && (
            <BudgetManagerView />
          )}

          {currentTab === 'cards' && (
            <CreditCardManagerView
              onPayCard={(cardId) => handleOpenPayment(cardId)}
              onOpenAddCard={() => setIsAddCardOpen(true)}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionLedgerView
              onOpenAddTransaction={() => setIsAddTxOpen(true)}
              onOpenImportCSV={() => setIsImportCSVOpen(true)}
            />
          )}

          {currentTab === 'sync' && (
            <SyncEngineView
              onOpenImportCSV={() => setIsImportCSVOpen(true)}
            />
          )}
        </main>
      </div>

      {/* 3. Mobile Thumb Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* 4. Global Interactive Modals */}
      <PaymentModal
        cardId={paymentCardId}
        onClose={() => setPaymentCardId(null)}
      />

      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
      />

      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
      />

      <ImportCSVModal
        isOpen={isImportCSVOpen}
        onClose={() => setIsImportCSVOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </ThemeProvider>
  );
}
