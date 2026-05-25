/* FINOVA Interactive Data Visualization Engine (Chart.js Interface) */

let flowChartInstance = null;
let categoryChartInstance = null;
let budgetChartInstance = null;

const FinovaCharts = {
  // Helpers to fetch colors based on active theme
  getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#94a3b8' : '#475569',
      grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      tooltipBg: isDark ? 'rgba(15, 15, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      tooltipText: isDark ? '#f8fafc' : '#0f172a'
    };
  },

  // Initialize all charts
  renderAll(transactions, budgets) {
    this.renderFlowChart(transactions);
    this.renderCategoryChart(transactions);
    this.renderBudgetChart(transactions, budgets);
  },

  // 1. Income vs Expense Trend Flow Chart
  renderFlowChart(transactions) {
    const canvas = document.getElementById('flowChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = this.getThemeColors();

    // Group transactions by date buckets (e.g., 5-day intervals in May 2026)
    // We will build a calendar map of the current month
    const buckets = [
      { label: 'May 1-5', income: 0, expense: 0 },
      { label: 'May 6-10', income: 0, expense: 0 },
      { label: 'May 11-15', income: 0, expense: 0 },
      { label: 'May 16-20', income: 0, expense: 0 },
      { label: 'May 21-25', income: 0, expense: 0 },
      { label: 'May 26-31', income: 0, expense: 0 }
    ];

    transactions.forEach(t => {
      const dateParts = t.date.split('-');
      if (dateParts.length < 3) return;
      const day = parseInt(dateParts[2]);

      let index = 0;
      if (day <= 5) index = 0;
      else if (day <= 10) index = 1;
      else if (day <= 15) index = 2;
      else if (day <= 20) index = 3;
      else if (day <= 25) index = 4;
      else index = 5;

      if (t.type === 'income') {
        buckets[index].income += t.amount;
      } else {
        buckets[index].expense += t.amount;
      }
    });

    const labels = buckets.map(b => b.label);
    const incomeData = buckets.map(b => b.income);
    const expenseData = buckets.map(b => b.expense);

    // Create custom linear gradients
    const incGradient = ctx.createLinearGradient(0, 0, 0, 300);
    incGradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    incGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    const expGradient = ctx.createLinearGradient(0, 0, 0, 300);
    expGradient.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
    expGradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    if (flowChartInstance) {
      flowChartInstance.destroy();
    }

    flowChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Inflow (Income)',
            data: incomeData,
            borderColor: '#10b981',
            borderWidth: 3,
            backgroundColor: incGradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointHoverRadius: 6,
            pointRadius: 4
          },
          {
            label: 'Outflow (Expense)',
            data: expenseData,
            borderColor: '#ef4444',
            borderWidth: 3,
            backgroundColor: expGradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointHoverRadius: 6,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: colors.text,
              font: { family: 'Inter', size: 12, weight: '500' }
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true
          }
        },
        scales: {
          x: {
            grid: { color: colors.grid, drawTicks: false },
            ticks: { color: colors.text, font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { color: colors.grid, drawTicks: false },
            ticks: { color: colors.text, font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  },

  // 2. Spending Distribution Category Chart
  renderCategoryChart(transactions) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = this.getThemeColors();

    const catExpenses = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        catExpenses[t.category] = (catExpenses[t.category] || 0) + t.amount;
      }
    });

    const labels = Object.keys(catExpenses);
    const data = Object.values(catExpenses);

    // If no expenses, show placeholder
    if (labels.length === 0) {
      labels.push('No Expenses');
      data.push(1);
    }

    const paletteColors = [
      '#06b6d4', // Cyan
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#a855f7', // Purple
      '#ec4899', // Pink
      '#3b82f6', // Blue
      '#f43f5e', // Crimson/Rose
      '#64748b'  // Slate
    ];

    if (categoryChartInstance) {
      categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: paletteColors.slice(0, labels.length),
          borderColor: colors.tooltipBorder,
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: colors.text,
              font: { family: 'Inter', size: 11, weight: '500' },
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            padding: 12,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                if (label === 'No Expenses') return 'No transactions logged';
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((value / total) * 100).toFixed(1);
                const symbol = window.FinovaDB.getCurrencySymbol();
                return ` ${label}: ${symbol}${value.toLocaleString()} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  // 3. Category Budgets vs Expense Tracking Chart
  renderBudgetChart(transactions, budgets) {
    const canvas = document.getElementById('budgetChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = this.getThemeColors();

    const categories = ['Housing', 'Food', 'Entertainment', 'Transport', 'Utilities', 'Health', 'Shopping', 'Other'];
    
    // Group actual spending
    const actuals = {};
    categories.forEach(cat => actuals[cat] = 0);
    
    transactions.forEach(t => {
      if (t.type === 'expense' && categories.includes(t.category)) {
        actuals[t.category] += t.amount;
      }
    });

    const budgetLimits = categories.map(cat => budgets[cat] || 0);
    const actualSpends = categories.map(cat => actuals[cat]);

    if (budgetChartInstance) {
      budgetChartInstance.destroy();
    }

    budgetChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Budget Limit',
            data: budgetLimits,
            backgroundColor: 'rgba(6, 182, 212, 0.2)',
            borderColor: '#06b6d4',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: 'Actual Spend',
            data: actualSpends,
            backgroundColor: function(context) {
              const index = context.dataIndex;
              const spend = actualSpends[index];
              const limit = budgetLimits[index];
              if (limit > 0 && spend > limit) {
                return 'rgba(239, 68, 68, 0.7)'; // Red transparent warning
              }
              return 'rgba(16, 185, 129, 0.7)'; // Emerald transparent normal
            },
            borderColor: function(context) {
              const index = context.dataIndex;
              const spend = actualSpends[index];
              const limit = budgetLimits[index];
              if (limit > 0 && spend > limit) {
                return '#ef4444'; // Solid Red
              }
              return '#10b981'; // Solid Emerald
            },
            borderWidth: 1.5,
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: 'y', // Makes it a horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: colors.text,
              font: { family: 'Inter', size: 11, weight: '500' }
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            padding: 12,
            usePointStyle: true
          }
        },
        scales: {
          x: {
            grid: { color: colors.grid, drawTicks: false },
            ticks: { color: colors.text, font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.text, font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  }
};

window.FinovaCharts = FinovaCharts;
