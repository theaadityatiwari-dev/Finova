/* FINOVA Interface & DOM Rendering Manager */

const FinovaUI = {
  activeTab: 'dashboard',

  // DOM elements cache
  elements: {},

  init() {
    // Cache common DOM nodes
    this.elements = {
      navItems: document.querySelectorAll('.nav-item'),
      views: document.querySelectorAll('.view-container'),
      balanceVal: document.getElementById('balanceVal'),
      incomeVal: document.getElementById('incomeVal'),
      expenseVal: document.getElementById('expenseVal'),
      savingsVal: document.getElementById('savingsVal'),
      healthScoreVal: document.getElementById('healthScoreVal'),
      healthDesc: document.getElementById('healthDesc'),
      healthDialCircle: document.getElementById('healthDialCircle'),
      recentTxList: document.getElementById('recentTxList'),
      fullTxList: document.getElementById('fullTxList'),
      insightsList: document.getElementById('insightsList'),
      budgetProgressList: document.getElementById('budgetProgressList'),
      toastContainer: document.getElementById('toastContainer'),
      modalOverlay: document.getElementById('modalOverlay'),
      txForm: document.getElementById('txForm'),
      modalTitle: document.getElementById('modalTitle'),
      txIdInput: document.getElementById('txId'),
      // Filters and Sorting
      searchFilter: document.getElementById('searchFilter'),
      categoryFilter: document.getElementById('categoryFilter'),
      typeFilter: document.getElementById('typeFilter'),
      sortSelect: document.getElementById('sortSelect'),
      // Budget modal fields
      budgetModalOverlay: document.getElementById('budgetModalOverlay'),
      budgetForm: document.getElementById('budgetForm')
    };

    this.setupTabListeners();
    this.setupFilterListeners();
  },

  // Switch Active view
  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Update active nav button
    this.elements.navItems.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active content pane
    this.elements.views.forEach(view => {
      if (view.id === `${tabId}View`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Sidebar auto-collapse on mobile selection
    const sidebar = document.querySelector('.app-sidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Trigger charts re-rendering on Analytics tab activate
    if (tabId === 'analytics') {
      const tx = window.FinovaDB.getTransactions();
      const budgets = window.FinovaDB.getBudgets();
      window.FinovaCharts.renderAll(tx, budgets);
    }
  },

  setupTabListeners() {
    this.elements.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });
  },

  setupFilterListeners() {
    const triggerSearch = () => this.renderTransactionsList();
    
    if (this.elements.searchFilter) this.elements.searchFilter.addEventListener('input', triggerSearch);
    if (this.elements.categoryFilter) this.elements.categoryFilter.addEventListener('change', triggerSearch);
    if (this.elements.typeFilter) this.elements.typeFilter.addEventListener('change', triggerSearch);
    if (this.elements.sortSelect) this.elements.sortSelect.addEventListener('change', triggerSearch);
  },

  // Animate financial stat counters
  animateCounter(element, targetValue) {
    if (!element) return;
    
    const duration = 1200; // Total duration in ms
    const startTime = performance.now();
    const startValue = parseFloat(element.innerText.replace(/[^0-9.-]/g, '')) || 0;
    
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeProgress;
      
      element.innerText = window.FinovaDB.formatMoney(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  },

  // General dashboard summary widgets rendering
  updateOverviewCards(transactions, budgets) {
    const totals = window.FinovaInsights.calculateTotals(transactions);
    
    this.animateCounter(this.elements.balanceVal, totals.balance);
    this.animateCounter(this.elements.incomeVal, totals.income);
    this.animateCounter(this.elements.expenseVal, totals.expense);
    this.animateCounter(this.elements.savingsVal, totals.balance > 0 ? totals.balance : 0);

    // Color balance card green or white
    if (this.elements.balanceVal) {
      if (totals.balance < 0) {
        this.elements.balanceVal.style.color = 'var(--color-crimson)';
      } else {
        this.elements.balanceVal.style.color = 'var(--text-primary)';
      }
    }

    // Health Score Widget Update
    const score = window.FinovaInsights.calculateHealthScore(transactions, budgets);
    
    // Counter score number
    if (this.elements.healthScoreVal) {
      let currentVal = 0;
      const step = () => {
        if (currentVal < score) {
          currentVal++;
          this.elements.healthScoreVal.innerText = currentVal;
          requestAnimationFrame(step);
        } else {
          this.elements.healthScoreVal.innerText = score;
        }
      };
      step();
    }

    // SVG circle animation (Dashoffset math: circumference = 2 * PI * r = 2 * 3.14159 * 40 = ~251.2)
    if (this.elements.healthDialCircle) {
      const circ = 251.2;
      const offset = circ - (score / 100) * circ;
      this.elements.healthDialCircle.style.strokeDashoffset = offset;
    }

    // Health text indicator
    if (this.elements.healthDesc) {
      let phrase = 'Critical Level';
      let scoreColor = 'var(--color-crimson)';
      if (score >= 85) {
        phrase = 'Optimal Standing';
        scoreColor = 'var(--color-emerald)';
      } else if (score >= 65) {
        phrase = 'Healthy Standing';
        scoreColor = 'var(--color-cyan)';
      } else if (score >= 45) {
        phrase = 'Moderate Standing';
        scoreColor = 'var(--color-gold)';
      }
      this.elements.healthDesc.innerText = phrase;
      this.elements.healthDesc.style.color = scoreColor;
    }
  },

  // Render recent lists & history lists with sorting & filters
  renderTransactionsList() {
    const transactions = window.FinovaDB.getTransactions();
    const symbol = window.FinovaDB.getCurrencySymbol();

    // 1. Render Dashboard Tab Recent List (Max 5 items)
    if (this.elements.recentTxList) {
      this.elements.recentTxList.innerHTML = '';
      const recent = transactions.slice(0, 5);

      if (recent.length === 0) {
        this.elements.recentTxList.innerHTML = `<div class="t-empty" style="text-align:center; padding:2rem; color:var(--text-muted); font-size:var(--fs-sm);">No transactions logged yet.</div>`;
      } else {
        recent.forEach(tx => {
          this.elements.recentTxList.appendChild(this.createTransactionCard(tx, symbol));
        });
      }
    }

    // 2. Render Full History list with Filters applied
    if (this.elements.fullTxList) {
      this.elements.fullTxList.innerHTML = '';

      let filtered = [...transactions];

      // Apply Search Query
      const q = this.elements.searchFilter ? this.elements.searchFilter.value.toLowerCase().trim() : '';
      if (q) {
        filtered = filtered.filter(tx => 
          tx.description.toLowerCase().includes(q) || 
          tx.notes.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q)
        );
      }

      // Apply Category Filter
      const cat = this.elements.categoryFilter ? this.elements.categoryFilter.value : 'All';
      if (cat !== 'All') {
        filtered = filtered.filter(tx => tx.category === cat);
      }

      // Apply Type Filter
      const type = this.elements.typeFilter ? this.elements.typeFilter.value : 'All';
      if (type !== 'All') {
        filtered = filtered.filter(tx => tx.type === type);
      }

      // Apply Sorting
      const sort = this.elements.sortSelect ? this.elements.sortSelect.value : 'date-desc';
      filtered.sort((a, b) => {
        if (sort === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sort === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sort === 'amount-desc') return b.amount - a.amount;
        if (sort === 'amount-asc') return a.amount - b.amount;
        return 0;
      });

      if (filtered.length === 0) {
        this.elements.fullTxList.innerHTML = `<tr style="border:none;"><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted); font-size:var(--fs-sm);">No transactions match selected filters.</td></tr>`;
      } else {
        filtered.forEach(tx => {
          this.elements.fullTxList.appendChild(this.createTransactionTableRow(tx, symbol));
        });
      }
    }
  },

  // Helper Card Builder for Recent Transactions Widget
  createTransactionCard(tx, symbol) {
    const card = document.createElement('div');
    card.className = 'transaction-card';
    card.setAttribute('data-id', tx.id);

    const isInc = tx.type === 'income';
    const amountFormatted = `${isInc ? '+' : '-'}${symbol}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    
    // Choose category icon
    const icon = this.getCategoryIcon(tx.category);

    card.innerHTML = `
      <div class="t-info">
        <div class="t-category-icon"><i data-lucide="${icon}"></i></div>
        <div class="t-meta">
          <span class="t-name">${tx.description}</span>
          <span class="t-date">${tx.category} • ${tx.date}</span>
        </div>
      </div>
      <div class="t-amount-group">
        <span class="t-amount ${tx.type}">${amountFormatted}</span>
      </div>
    `;

    // Click to view/edit detail
    card.addEventListener('click', () => this.openTransactionModal(tx.id));

    return card;
  },

  // Helper Table Row Builder for History Panel
  createTransactionTableRow(tx, symbol) {
    const tr = document.createElement('tr');
    tr.className = 'history-row-item';
    
    const isInc = tx.type === 'income';
    const amountFormatted = `${isInc ? '+' : '-'}${symbol}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const badgeClass = isInc ? 'badge-income' : 'badge-expense';
    const icon = this.getCategoryIcon(tx.category);

    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <div class="t-category-icon" style="flex-shrink:0;"><i data-lucide="${icon}"></i></div>
          <span style="font-weight: 600;">${tx.description}</span>
        </div>
      </td>
      <td><span class="badge ${badgeClass}">${tx.type}</span></td>
      <td><span class="cat-tag" style="font-weight: 600;">${tx.category}</span></td>
      <td><span style="color: var(--text-secondary); font-size: var(--fs-sm);">${tx.date}</span></td>
      <td><span class="t-amount ${tx.type}" style="font-family: var(--font-display); font-weight:700;">${amountFormatted}</span></td>
      <td>
        <div class="row-actions" style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary btn-icon row-edit" style="width:30px; height:30px; border-radius:6px; font-size:0.85rem;"><i data-lucide="edit-2"></i></button>
          <button class="btn btn-danger btn-icon row-delete" style="width:30px; height:30px; border-radius:6px; font-size:0.85rem;"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    `;

    // Bind Edit Action
    tr.querySelector('.row-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      this.openTransactionModal(tx.id);
    });

    // Bind Delete Action
    tr.querySelector('.row-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete transaction "${tx.description}"?`)) {
        window.FinovaDB.deleteTransaction(tx.id);
        this.showToast('Transaction deleted successfully', 'success');
        this.refreshAll();
      }
    });

    return tr;
  },

  // Map category strings to Lucide Icon Classes
  getCategoryIcon(category) {
    const mapping = {
      Salary: 'wallet',
      Freelance: 'laptop',
      Investment: 'gem',
      Housing: 'home',
      Food: 'soup',
      Entertainment: 'ticket',
      Transport: 'car',
      Utilities: 'zap',
      Health: 'heart-pulse',
      Shopping: 'shopping-bag',
      Other: 'plus-circle'
    };
    return mapping[category] || 'help-circle';
  },

  // Render Budget Progress Cards (Dashboard Panel)
  renderBudgetProgress(transactions, budgets) {
    if (!this.elements.budgetProgressList) return;
    this.elements.budgetProgressList.innerHTML = '';

    const categories = ['Housing', 'Food', 'Entertainment', 'Transport', 'Utilities', 'Health', 'Shopping', 'Other'];
    const actuals = {};
    categories.forEach(cat => actuals[cat] = 0);
    
    transactions.forEach(t => {
      if (t.type === 'expense' && categories.includes(t.category)) {
        actuals[t.category] += t.amount;
      }
    });

    categories.forEach(cat => {
      const budgetLimit = budgets[cat] || 0;
      if (budgetLimit === 0) return; // Hide unconfigured limits

      const actualSpend = actuals[cat];
      const percentVal = Math.min(100, (actualSpend / budgetLimit) * 100);
      
      const item = document.createElement('div');
      item.className = 'budget-item';
      
      let statusClass = 'normal';
      if (percentVal > 100) statusClass = 'danger';
      else if (percentVal >= 75) statusClass = 'warning';

      const icon = this.getCategoryIcon(cat);

      item.innerHTML = `
        <div class="budget-info">
          <div class="budget-cat"><i data-lucide="${icon}" style="font-size:0.95rem; opacity:0.85;"></i> ${cat}</div>
          <div class="budget-limit">
            <strong>${window.FinovaDB.formatMoney(actualSpend)}</strong> 
            <span style="opacity:0.6;">/ ${window.FinovaDB.formatMoney(budgetLimit)}</span>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill ${statusClass}" style="width: ${percentVal}%"></div>
        </div>
      `;

      this.elements.budgetProgressList.appendChild(item);
    });
  },

  // Render Financial Insights Card layout (Insights Tab)
  renderInsightsList(transactions, budgets) {
    if (!this.elements.insightsList) return;
    this.elements.insightsList.innerHTML = '';

    const insights = window.FinovaInsights.generateInsights(transactions, budgets);

    insights.forEach(insight => {
      const card = document.createElement('div');
      card.className = `glass-card insight-card border-${insight.color}`;
      card.style.display = 'flex';
      card.style.gap = '1.25rem';
      card.style.alignItems = 'flex-start';
      card.style.padding = '1.5rem';

      // Custom border glow based on alert status
      if (insight.color === 'crimson') {
        card.style.borderLeft = '4px solid var(--color-crimson)';
      } else if (insight.color === 'emerald') {
        card.style.borderLeft = '4px solid var(--color-emerald)';
      } else if (insight.color === 'amber') {
        card.style.borderLeft = '4px solid var(--color-amber)';
      } else {
        card.style.borderLeft = '4px solid var(--color-cyan)';
      }

      card.innerHTML = `
        <div class="stat-icon" style="background:none; border:none; font-size:1.5rem; color:var(--color-${insight.color}); padding-top:0.25rem;">
          <i data-lucide="${insight.icon}"></i>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.35rem;">
          <h4 style="font-size:var(--fs-base); font-weight:700;">${insight.title}</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-sm);">${insight.description}</p>
        </div>
      `;

      this.elements.insightsList.appendChild(card);
    });
  },

  // Trigger floating stack Notification popup
  showToast(message, type = 'success') {
    if (!this.elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'check-circle';
    if (type === 'error') iconClass = 'alert-triangle';
    if (type === 'warning') iconClass = 'shield-alert';

    toast.innerHTML = `
      <i data-lucide="${iconClass}"></i>
      <span>${message}</span>
    `;

    this.elements.toastContainer.appendChild(toast);
    
    if (window.lucide) window.lucide.createIcons();

    // Animate out after delay
    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
  },

  // Modals Toggles (Transaction Add/Edit Modal)
  openTransactionModal(txId = null) {
    if (!this.elements.modalOverlay) return;

    this.elements.txForm.reset();
    
    // Set standard current Date input default
    document.getElementById('txDate').value = new Date().toISOString().split('T')[0];

    if (txId) {
      // MODE: EDITING
      this.elements.modalTitle.innerText = 'Modify Transaction';
      const transactions = window.FinovaDB.getTransactions();
      const tx = transactions.find(t => t.id === txId);
      
      if (tx) {
        this.elements.txIdInput.value = tx.id;
        document.getElementById('txDescription').value = tx.description;
        document.getElementById('txAmount').value = tx.amount;
        document.getElementById('txType').value = tx.type;
        document.getElementById('txCategory').value = tx.category;
        document.getElementById('txDate').value = tx.date;
        document.getElementById('txNotes').value = tx.notes;
        
        // Dynamically adjust category dropdown based on type selection
        this.adjustCategoryOptions(tx.type, tx.category);
      }
    } else {
      // MODE: NEW
      this.elements.modalTitle.innerText = 'New Ledger Transaction';
      this.elements.txIdInput.value = '';
      this.adjustCategoryOptions('expense');
    }

    this.elements.modalOverlay.classList.add('open');
    if (window.lucide) window.lucide.createIcons();
    document.getElementById('txDescription').focus();
  },

  closeTransactionModal() {
    if (this.elements.modalOverlay) {
      this.elements.modalOverlay.classList.remove('open');
    }
  },

  // Dynamic selector items for categories based on Inflow/Outflow type
  adjustCategoryOptions(type, selectedValue = '') {
    const catSelect = document.getElementById('txCategory');
    if (!catSelect) return;

    catSelect.innerHTML = '';
    
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Other'];
    const expenseCategories = ['Housing', 'Food', 'Entertainment', 'Transport', 'Utilities', 'Health', 'Shopping', 'Other'];
    
    const targets = type === 'income' ? incomeCategories : expenseCategories;
    
    targets.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.innerText = cat;
      if (cat === selectedValue) {
        opt.selected = true;
      }
      catSelect.appendChild(opt);
    });
  },

  // Budgets Configure Modal
  openBudgetModal() {
    if (!this.elements.budgetModalOverlay) return;

    const budgets = window.FinovaDB.getBudgets();
    
    document.getElementById('bOverall').value = budgets.overall || 4000;
    document.getElementById('bHousing').value = budgets.Housing || 2000;
    document.getElementById('bFood').value = budgets.Food || 450;
    document.getElementById('bEntertainment').value = budgets.Entertainment || 300;
    document.getElementById('bTransport').value = budgets.Transport || 250;
    document.getElementById('bUtilities').value = budgets.Utilities || 300;
    document.getElementById('bHealth').value = budgets.Health || 150;
    document.getElementById('bShopping').value = budgets.Shopping || 600;
    document.getElementById('bOther').value = budgets.Other || 200;

    this.elements.budgetModalOverlay.classList.add('open');
    if (window.lucide) window.lucide.createIcons();
  },

  closeBudgetModal() {
    if (this.elements.budgetModalOverlay) {
      this.elements.budgetModalOverlay.classList.remove('open');
    }
  },

  // Main UI refresh controller
  refreshAll() {
    const tx = window.FinovaDB.getTransactions();
    const budgets = window.FinovaDB.getBudgets();

    this.updateOverviewCards(tx, budgets);
    this.renderTransactionsList();
    this.renderBudgetProgress(tx, budgets);
    this.renderInsightsList(tx, budgets);

    // Refresh Lucide vectors in entire page
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Refresh charts if we are on Analytics tab
    if (this.activeTab === 'analytics') {
      window.FinovaCharts.renderAll(tx, budgets);
    }
  }
};

window.FinovaUI = FinovaUI;
