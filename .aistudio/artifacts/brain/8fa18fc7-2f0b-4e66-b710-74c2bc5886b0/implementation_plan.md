# Final Balance — Personal Finance & Credit Card Debt Tracker

A clean, minimalist personal finance web application that unifies monthly category budgeting, automated credit card transaction syncing, real-time statement due date and payoff alerts, automated search & filter ledger, and category expense visualization with Recharts.

> [!IMPORTANT]
> **Confirmed User Decisions & Preferences:**
> - **Brand & Identity**: Final Balance (with dedicated UAE AED 🇦🇪 and Indian Rupee ₹ INR currency support).
> - **Visual Style & Theme**: Clean minimalist interface with Tailwind dark mode toggle, compact mobile bottom navigation, and high-contrast typography.
> - **Automated Search & Filter**: Real-time keyword search, date range presets, custom range pickers, category/account/status filters, and live aggregates.
> - **Credit Card Debt Strategy**: Simple balance tracking with prominent statement due date alerts, early payment suppression, and credit utilization gauges.
> - **Transaction Syncing**: Realistic automated bank/card sync engine with simulated feed fetching, instant one-click sync, and CSV statement upload.
> - **Screen Size Compatibility**: Adaptive responsive layout featuring mobile thumb-friendly card rows and full desktop tabular ledger.

---

## 1. Overview & Core Concept

**Clarity Ledger** empowers users to manage day-to-day cash flow and credit obligations without friction. Users can set monthly budget ceilings across essential and discretionary categories, track actual expenditures in real time, monitor multiple credit cards, receive timely statement due date alerts to avoid penalty interest, and simulate automatic card syncing.

### Key Value & Workflows
- **Monthly Budget Engine**: Set fixed monthly spending caps by category (Groceries, Housing, Dining, Utilities, Entertainment, Transit, Health). Visual progress bars immediately signal remaining room or overages.
- **Credit Card Balance & Due Date Alerts**: Dedicated card manager tracking statement balances, credit limits, current APR, statement closing dates, and payment due dates. Timely alerts flag accounts due within 7 days or exceeding recommended 30% credit utilization.
- **Automated Transaction Syncing & Simulation**: One-click "Sync Accounts" button that pulls new simulated card charges with realistic merchant metadata, pending-to-cleared state progression, plus a CSV statement importer.
- **Visual Analytics (Recharts)**: Clean responsive bar chart breaking down current month spending vs. budget caps across categories with interactive tooltips and category drilldowns.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Executive Dashboard**:
   - High-level metric strip: Total Monthly Spend, Remaining Budget, Total Credit Card Debt, and Active Due Date Alerts.
   - Interactive Recharts Bar Chart: "Monthly Spending Distribution by Category" displaying actual spending alongside budget limits.
   - Credit Card Quick-Status Strip: Visual card representations displaying current balance, available credit, statement due date countdown, and urgent alert banners.
   - Recent Transactions ledger with category tags, account source, and instant search/filter.
2. **Monthly Budget Planner**:
   - Category-by-category budget allocation with quick inline editing.
   - Real-time spend meter comparing budgeted vs. spent with clean tabular figures.
   - Overall monthly health indicator and rollover savings estimate.
3. **Credit Cards & Payoff Manager**:
   - Card management (e.g., Sapphire Preferred, Apple Card, Blue Cash Everyday) with custom credit limit, APR, current balance, and due date.
   - Payoff calculator with projected debt-free month, interest saved, and scheduled statement payment alerts.
   - Automated Syncing Console: Live sync trigger, recurring sync interval toggle, and manual transaction logging.
4. **Transaction Ledger & CSV Importer**:
   - Filter by date, category, account, or search keyword.
   - Add/edit/delete transactions with automatic category assignment.
   - Drag-and-drop CSV parser for importing external bank statements.

### Visual Identity & Theme
- **Aesthetic Direction**: Minimalist fintech editorial style. Crisp neutral canvas (`#F8FAFC` / `#FFFFFF`), warm gray hairline borders (`#E2E8F0`), and soft slate/indigo primary accents.
- **Color Discipline (60-30-10)**:
  - Canvas (60%): Clean off-white and pure white cards.
  - Structure (30%): Subdued borders, slate-500 muted text, and soft slate background fills.
  - Accents (10%): Refined indigo (`#4F46E5`) for primary actions, emerald (`#10B981`) for savings/under-budget, amber (`#F59E0B`) for approaching due dates, and rose (`#F43F5E`) for over-budget/overdue items.
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans`, font weights 600 and 700 with `text-wrap: balance`.
  - Body & Form Controls: `DM Sans` / `Plus Jakarta Sans`, 14px–15px with optimal line-height.
  - Telemetry & Currency: Monospace tabular numerals (`tabular-nums font-mono`) for all dollar figures and dates.
- **Anti-Slop Restraint**: Zero static pill enclosures (metadata uses clean unboxed text with `·` separators); no fake compiler tags or bottom telemetry tickers; strictly working buttons with prompt micro-interaction feedback.

---

## 3. Key Product Decisions & Trade-Offs

- **Recharts for Dashboard Visualization**:
  - *Decision*: Install `recharts` for custom category spending distribution bar charts with customized tooltips, responsive containers, and subtle rounded bar corners.
  - *Why*: Provides clean, accessible SVG rendering matching the light minimalist aesthetic without heavyweight charting boilerplate.
- **Simulated Automated Sync Engine with Real CSV Support**:
  - *Decision*: Provide an interactive bank simulator that generates realistic pending/cleared credit card charges on a periodic cadence or via a "Sync Now" button, combined with real file drag-and-drop CSV statement parsing.
  - *Why*: Real bank aggregation APIs (such as Plaid) require proprietary client secrets and bank credentials unavailable in a client sandbox; simulated sync provides complete interactive fidelity while CSV import enables real user transaction data.
- **Client-Side Persistence via LocalStorage**:
  - *Decision*: Persist all user categories, budgets, credit card accounts, and transactions in browser `localStorage` initialized with realistic demo data and a one-click "Reset to Sample Data" option.
  - *Why*: Delivers zero-latency performance, complete privacy, and full offline functionality without backend dependencies.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Clarity Ledger Frontend                      │
├───────────────────────────────┬─────────────────────────────────┤
│ Top Navigation & Status Bar   │ Balance, Net Worth, Sync Status │
├───────────────────────────────┴─────────────────────────────────┤
│ Primary View Tabs: Dashboard | Budgets | Credit Cards | Ledger  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Dashboard View]                                               │
│  ┌──────────────────────────┐  ┌─────────────────────────────┐  │
│  │ Metric KPI Cards (4-col) │  │ Active Due Date Alerts (7d) │  │
│  └──────────────────────────┘  └─────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Recharts Bar Chart: Monthly Category Spending vs. Budget  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐  ┌─────────────────────────────┐  │
│  │ Credit Cards Carousel    │  │ Recent Transactions Ledger │  │
│  └──────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Data Layer (localStorage)                                       │
│  • Accounts (Credit Cards, Checking)                            │
│  • Budgets (Category, Monthly Cap, Icon, Color)                 │
│  • Transactions (ID, Date, Amount, Merchant, Category, Status)  │
│  • Alert Engine (Calculates due dates < 7 days & high APR/util) │
└─────────────────────────────────────────────────────────────────┘
```

### Component & State Architecture
- `src/types/finance.ts`: Core TypeScript definitions for `Transaction`, `BudgetCategory`, `CreditCard`, and `DebtAlert`.
- `src/context/FinanceContext.tsx`: React Context managing reactive state, local persistence, transaction logging, budget updating, and automated sync loops.
- `src/components/DashboardView.tsx`: Main dashboard hosting KPI summaries, the Recharts Spending Distribution chart, urgent alerts, and recent transactions.
- `src/components/CategorySpendChart.tsx`: Recharts responsive bar chart rendering monthly category spend vs budget cap with custom tooltips.
- `src/components/BudgetManagerView.tsx`: Category budget allocator, spend meters, and budget creation modal.
- `src/components/CreditCardManagerView.tsx`: Credit card accounts, debt payoff countdown, due date alerts, and sync simulation engine.
- `src/components/TransactionLedgerView.tsx`: Searchable, filterable transaction table with manual entry form and CSV file upload handler.
- `src/components/DebtAlertBanner.tsx`: High-visibility notification strip alerting user to cards with due dates within 7 days or high utilization.
