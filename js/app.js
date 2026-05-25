/* FINOVA Central Controller & Orchestrator */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Database
  window.FinovaDB.init();

  // Load Saved Theme preference
  const savedTheme = window.FinovaDB.getTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  // Initialize UI framework & cache
  window.FinovaUI.init();

  // Initial UI refresh
  window.FinovaUI.refreshAll();

  // Launch clock updates
  startClock();

  // Register Event Listeners
  registerCoreEvents();

  // Dismiss Splash Screen loader after slight cinematic delay
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
      splash.classList.add('fade-out');
      // Completely remove from layout after transition completes
      splash.addEventListener('transitionend', () => splash.remove());
    }
  }, 2200);
});

// Real-time Clock loop
function startClock() {
  const clockText = document.getElementById('clockText');
  if (!clockText) return;

  const tick = () => {
    const now = new Date();
    const formatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    clockText.innerText = formatted;
  };
  tick();
  setInterval(tick, 1000);
}

// Update Theme Selector Button icon
function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-toggle-btn i');
  if (!icon) return;
  if (theme === 'dark') {
    icon.className = 'lucide-sun';
  } else {
    icon.className = 'lucide-moon';
  }
}

// Setup core app event listeners
function registerCoreEvents() {
  const db = window.FinovaDB;
  const ui = window.FinovaUI;

  // 1. Currency selector changes
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) {
    currencySelect.value = db.getCurrency();
    currencySelect.addEventListener('change', (e) => {
      db.setCurrency(e.target.value);
      ui.showToast(`Base currency updated to ${e.target.value}`, 'success');
      ui.refreshAll();
    });
  }

  // 2. Theme Toggle Switch
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', nextTheme);
      db.setTheme(nextTheme);
      updateThemeIcon(nextTheme);
      
      ui.showToast(`Theme switched to ${nextTheme} mode`, 'success');
      
      // Refresh UI components and redraw charts with new grid colors
      ui.refreshAll();
    });
  }

  // 3. Modals Open triggers
  const btnNewTx = document.getElementById('btnNewTx');
  if (btnNewTx) btnNewTx.addEventListener('click', () => ui.openTransactionModal());

  const fabNewTx = document.getElementById('fabNewTx');
  if (fabNewTx) fabNewTx.addEventListener('click', () => ui.openTransactionModal());

  const btnEditBudget = document.getElementById('btnEditBudget');
  if (btnEditBudget) btnEditBudget.addEventListener('click', () => ui.openBudgetModal());

  // 4. Modals Close triggers
  const modalClose = document.getElementById('modalClose');
  if (modalClose) modalClose.addEventListener('click', () => ui.closeTransactionModal());

  const budgetModalClose = document.getElementById('budgetModalClose');
  if (budgetModalClose) budgetModalClose.addEventListener('click', () => ui.closeBudgetModal());

  // Dynamic Transaction Type selector in modal (adjust category selection)
  const txType = document.getElementById('txType');
  if (txType) {
    txType.addEventListener('change', (e) => {
      ui.adjustCategoryOptions(e.target.value);
    });
  }

  // 5. Transaction form submit handler
  if (ui.elements.txForm) {
    ui.elements.txForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const txId = document.getElementById('txId').value;
      const txData = {
        description: document.getElementById('txDescription').value.trim(),
        amount: parseFloat(document.getElementById('txAmount').value),
        type: document.getElementById('txType').value,
        category: document.getElementById('txCategory').value,
        date: document.getElementById('txDate').value,
        notes: document.getElementById('txNotes').value.trim()
      };

      if (!txData.description) {
        ui.showToast('Please specify a description', 'error');
        return;
      }
      if (isNaN(txData.amount) || txData.amount <= 0) {
        ui.showToast('Please specify a valid amount greater than zero', 'error');
        return;
      }

      if (txId) {
        // Edit flow
        db.updateTransaction(txId, txData);
        ui.showToast('Transaction modified successfully', 'success');
      } else {
        // Create flow
        db.addTransaction(txData);
        ui.showToast('Transaction added to ledger', 'success');
      }

      ui.closeTransactionModal();
      ui.refreshAll();
    });
  }

  // 6. Budget form submit handler
  if (ui.elements.budgetForm) {
    ui.elements.budgetForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const updatedBudgets = {
        overall: parseFloat(document.getElementById('bOverall').value) || 4000,
        Housing: parseFloat(document.getElementById('bHousing').value) || 0,
        Food: parseFloat(document.getElementById('bFood').value) || 0,
        Entertainment: parseFloat(document.getElementById('bEntertainment').value) || 0,
        Transport: parseFloat(document.getElementById('bTransport').value) || 0,
        Utilities: parseFloat(document.getElementById('bUtilities').value) || 0,
        Health: parseFloat(document.getElementById('bHealth').value) || 0,
        Shopping: parseFloat(document.getElementById('bShopping').value) || 0,
        Other: parseFloat(document.getElementById('bOther').value) || 0
      };

      db.saveBudgets(updatedBudgets);
      ui.showToast('Category budgets updated', 'success');
      ui.closeBudgetModal();
      ui.refreshAll();
    });
  }

  // 7. CSV Export trigger
  const btnExport = document.getElementById('btnExport');
  if (btnExport) {
    btnExport.addEventListener('click', triggerCSVExport);
  }

  // 8. Mobile Sidebar controls
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('.app-sidebar');
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close on click outside sidebar on mobile
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && 
          !sidebar.contains(e.target) && 
          !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // Keyboard shortcuts event listener
  document.addEventListener('keydown', (e) => {
    // Avoid triggering shortcuts when editing an input field
    const active = document.activeElement;
    if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT') {
      // Escape is fine to close modals even from input fields
      if (e.key === 'Escape') {
        ui.closeTransactionModal();
        ui.closeBudgetModal();
      }
      return;
    }

    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      ui.openTransactionModal();
    }
    if (e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      ui.openBudgetModal();
    }
    if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      triggerCSVExport();
    }
    if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      const themeToggle = document.getElementById('themeToggleBtn');
      if (themeToggle) themeToggle.click();
    }
  });
}

// Compile and download CSV file
function triggerCSVExport() {
  const csvData = window.FinovaDB.exportToCSV();
  if (!csvData) {
    window.FinovaUI.showToast('No transaction data to export', 'warning');
    return;
  }

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `finova_ledger_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.FinovaUI.showToast('Ledger exported as CSV successfully', 'success');
}
