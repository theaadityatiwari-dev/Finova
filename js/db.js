/* FINOVA LocalStorage Database & Seeding Manager */

const DB_KEYS = {
  TRANSACTIONS: 'finova_transactions',
  BUDGETS: 'finova_budgets',
  CURRENCY: 'finova_currency',
  THEME: 'finova_theme'
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥'
};

// Default Budgets setup
const DEFAULT_BUDGETS = {
  overall: 4000,
  Housing: 2000,
  Food: 450,
  Entertainment: 300,
  Transport: 250,
  Utilities: 300,
  Health: 150,
  Shopping: 600,
  Other: 200
};

// Realistic mock transactions for initial visual experience
const MOCK_TRANSACTIONS = [
  { id: 'tx-1', description: 'Tech Corp Monthly Paycheck', amount: 5000, type: 'income', category: 'Salary', date: '2026-05-01', notes: 'Primary monthly compensation' },
  { id: 'tx-2', description: 'Luxury Apartment Rent', amount: 1800, type: 'expense', category: 'Housing', date: '2026-05-02', notes: 'Monthly rent plus utilities flat rate' },
  { id: 'tx-3', description: 'Organic Grocery shopping', amount: 245, type: 'expense', category: 'Food', date: '2026-05-04', notes: 'Weekly replenishment' },
  { id: 'tx-4', description: 'Electric Car Fast Charge', amount: 45, type: 'expense', category: 'Transport', date: '2026-05-06', notes: 'Supercharger visit' },
  { id: 'tx-5', description: 'Stripe Freelance Integration', amount: 1450, type: 'income', category: 'Freelance', date: '2026-05-08', notes: 'API consulting for client project' },
  { id: 'tx-6', description: 'Fusion Sushi Dinner', amount: 135, type: 'expense', category: 'Food', date: '2026-05-09', notes: 'Dinner with team' },
  { id: 'tx-7', description: 'Fiber Optic Internet Bill', amount: 85, type: 'expense', category: 'Utilities', date: '2026-05-10', notes: 'High-speed internet line' },
  { id: 'tx-8', description: 'Cinematic IMAX Ticket', amount: 35, type: 'expense', category: 'Entertainment', date: '2026-05-12', notes: 'Sci-fi movie screening' },
  { id: 'tx-9', description: 'Premium Gym & Spa Membership', amount: 120, type: 'expense', category: 'Health', date: '2026-05-15', notes: 'Monthly membership' },
  { id: 'tx-10', description: '4K Ultra-Wide Monitor', amount: 550, type: 'expense', category: 'Shopping', date: '2026-05-18', notes: 'Dual setup upgrade' },
  { id: 'tx-11', description: 'Crypto Dividend Pay', amount: 280, type: 'income', category: 'Investment', date: '2026-05-20', notes: 'Staking yields' },
  { id: 'tx-12', description: 'Specialty Espresso Beans', amount: 24, type: 'expense', category: 'Food', date: '2026-05-22', notes: 'Single origin geisha roast' },
  { id: 'tx-13', description: 'Mechanical Keyboard Switches', amount: 75, type: 'expense', category: 'Shopping', date: '2026-05-24', notes: 'Tactile silent switches' }
];

const FinovaDB = {
  // Database Initializer
  init() {
    if (!localStorage.getItem(DB_KEYS.TRANSACTIONS)) {
      localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(MOCK_TRANSACTIONS));
    }
    if (!localStorage.getItem(DB_KEYS.BUDGETS)) {
      localStorage.setItem(DB_KEYS.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
    }
    if (!localStorage.getItem(DB_KEYS.CURRENCY)) {
      localStorage.setItem(DB_KEYS.CURRENCY, 'USD');
    }
    if (!localStorage.getItem(DB_KEYS.THEME)) {
      localStorage.setItem(DB_KEYS.THEME, 'dark');
    }
  },

  // Transactions CRUD
  getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.TRANSACTIONS)) || [];
    } catch (e) {
      console.error('Failed to parse transactions', e);
      return [];
    }
  },

  saveTransactions(transactions) {
    localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  addTransaction(tx) {
    const transactions = this.getTransactions();
    const newTx = {
      id: 'tx-' + Date.now(),
      description: tx.description || 'Untitled Transaction',
      amount: parseFloat(tx.amount) || 0,
      type: tx.type || 'expense',
      category: tx.category || 'Other',
      date: tx.date || new Date().toISOString().split('T')[0],
      notes: tx.notes || ''
    };
    transactions.unshift(newTx);
    this.saveTransactions(transactions);
    return newTx;
  },

  updateTransaction(id, updatedTx) {
    let transactions = this.getTransactions();
    transactions = transactions.map(tx => {
      if (tx.id === id) {
        return {
          ...tx,
          description: updatedTx.description || tx.description,
          amount: parseFloat(updatedTx.amount) || tx.amount,
          type: updatedTx.type || tx.type,
          category: updatedTx.category || tx.category,
          date: updatedTx.date || tx.date,
          notes: updatedTx.notes || tx.notes
        };
      }
      return tx;
    });
    this.saveTransactions(transactions);
  },

  deleteTransaction(id) {
    const transactions = this.getTransactions();
    const filtered = transactions.filter(tx => tx.id !== id);
    this.saveTransactions(filtered);
  },

  // Budgets Getter & Setter
  getBudgets() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.BUDGETS)) || DEFAULT_BUDGETS;
    } catch (e) {
      return DEFAULT_BUDGETS;
    }
  },

  saveBudgets(budgets) {
    localStorage.setItem(DB_KEYS.BUDGETS, JSON.stringify(budgets));
  },

  // Settings
  getCurrency() {
    return localStorage.getItem(DB_KEYS.CURRENCY) || 'USD';
  },

  getCurrencySymbol() {
    const curr = this.getCurrency();
    return CURRENCY_SYMBOLS[curr] || '$';
  },

  setCurrency(currency) {
    if (CURRENCY_SYMBOLS[currency]) {
      localStorage.setItem(DB_KEYS.CURRENCY, currency);
    }
  },

  getTheme() {
    return localStorage.getItem(DB_KEYS.THEME) || 'dark';
  },

  setTheme(theme) {
    localStorage.setItem(DB_KEYS.THEME, theme);
  },

  // Format Helper
  formatMoney(amount) {
    const symbol = this.getCurrencySymbol();
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  // Export Data to CSV
  exportToCSV() {
    const transactions = this.getTransactions();
    if (transactions.length === 0) return null;

    const headers = ['ID', 'Description', 'Amount', 'Type', 'Category', 'Date', 'Notes'];
    const rows = transactions.map(t => [
      t.id,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category,
      t.date,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
  }
};

// Initialize right away
FinovaDB.init();
window.FinovaDB = FinovaDB;
