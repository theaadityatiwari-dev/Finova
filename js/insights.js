/* FINOVA Financial Intelligence & Insights Engine */

const FinovaInsights = {
  // Calculates the Financial Health Score (0-100)
  calculateHealthScore(transactions, budgets) {
    const totals = this.calculateTotals(transactions);
    const income = totals.income;
    const expense = totals.expense;
    const overallBudget = budgets.overall || 4000;

    if (income === 0 && expense === 0) return 100;
    if (income === 0) return Math.max(10, Math.round(30 - (expense / 100))); // Default base score for pre-paycheck states

    // 1. Savings Rate Contribution (Max 40 points)
    const savings = income - expense;
    const savingsRate = (savings / income) * 100;
    let savingsScore = 0;
    if (savingsRate >= 35) savingsScore = 40;
    else if (savingsRate >= 20) savingsScore = 30;
    else if (savingsRate >= 10) savingsScore = 20;
    else if (savingsRate > 0) savingsScore = 10;
    else savingsScore = 0;

    // 2. Budget Adherence Contribution (Max 30 points)
    let budgetScore = 0;
    const budgetRatio = expense / overallBudget;
    if (budgetRatio <= 0.7) budgetScore = 30;
    else if (budgetRatio <= 0.9) budgetScore = 20;
    else if (budgetRatio <= 1.0) budgetScore = 10;
    else budgetScore = 0;

    // 3. Category Compliance Contribution (Max 30 points)
    const catExpenses = this.calculateCategoryExpenses(transactions);
    let violations = 0;
    Object.keys(catExpenses).forEach(cat => {
      const budgetLimit = budgets[cat] || 0;
      if (budgetLimit > 0 && catExpenses[cat] > budgetLimit) {
        violations++;
      }
    });
    
    let complianceScore = 30;
    if (violations === 1) complianceScore = 20;
    else if (violations === 2) complianceScore = 10;
    else if (violations > 2) complianceScore = 0;

    return Math.min(100, Math.max(0, savingsScore + budgetScore + complianceScore));
  },

  // Helper: Get summary numbers for current month
  calculateTotals(transactions) {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, balance: income - expense };
  },

  // Helper: Expenses by category
  calculateCategoryExpenses(transactions) {
    const categories = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      }
    });
    return categories;
  },

  // Generate automated financial tips & insights
  generateInsights(transactions, budgets) {
    const totals = this.calculateTotals(transactions);
    const catExpenses = this.calculateCategoryExpenses(transactions);
    const insights = [];

    // 1. Highest Expense Alert
    let highestCat = '';
    let highestAmt = 0;
    Object.keys(catExpenses).forEach(cat => {
      if (catExpenses[cat] > highestAmt) {
        highestAmt = catExpenses[cat];
        highestCat = cat;
      }
    });

    if (highestAmt > 0) {
      const percentage = totals.expense > 0 ? ((highestAmt / totals.expense) * 100).toFixed(1) : 0;
      insights.push({
        type: 'highest_expense',
        title: 'Primary Cost Driver',
        description: `Your highest expenditure is on <strong>${highestCat}</strong>, totaling <strong>${window.FinovaDB.formatMoney(highestAmt)}</strong> (${percentage}% of total outflows).`,
        impact: 'high',
        icon: 'lucide-trending-up',
        color: 'crimson'
      });
    }

    // 2. Budget Overrun warnings
    let totalViolations = 0;
    Object.keys(catExpenses).forEach(cat => {
      const limit = budgets[cat] || 0;
      if (limit > 0) {
        const ratio = catExpenses[cat] / limit;
        if (ratio >= 1.0) {
          totalViolations++;
          insights.push({
            type: 'budget_breached',
            title: `Budget Exhausted: ${cat}`,
            description: `You have spent <strong>${window.FinovaDB.formatMoney(catExpenses[cat])}</strong> against a limit of ${window.FinovaDB.formatMoney(limit)}. Consider pausing further ${cat} outlays.`,
            impact: 'critical',
            icon: 'lucide-alert-triangle',
            color: 'crimson'
          });
        } else if (ratio >= 0.8) {
          insights.push({
            type: 'budget_warning',
            title: `Limit Approaching: ${cat}`,
            description: `You have utilized <strong>${(ratio * 100).toFixed(0)}%</strong> of your ${window.FinovaDB.formatMoney(limit)} budget for ${cat}.`,
            impact: 'medium',
            icon: 'lucide-shield-alert',
            color: 'amber'
          });
        }
      }
    });

    // 3. Savings Prediction
    const savings = totals.income - totals.expense;
    const savingsRate = totals.income > 0 ? ((savings / totals.income) * 100).toFixed(1) : 0;
    
    if (savings > 0) {
      const yearProjection = savings * 12;
      insights.push({
        type: 'savings_prediction',
        title: '12-Month Accumulation Forecast',
        description: `At your current savings rate of <strong>${savingsRate}%</strong> (${window.FinovaDB.formatMoney(savings)}/mo), you are on track to accumulate <strong>${window.FinovaDB.formatMoney(yearProjection)}</strong> over the next 12 months.`,
        impact: 'positive',
        icon: 'lucide-gem',
        color: 'emerald'
      });
    } else if (totals.income > 0) {
      insights.push({
        type: 'deficit_alert',
        title: 'Capital Depletion Alert',
        description: `You spent <strong>${window.FinovaDB.formatMoney(Math.abs(savings))}</strong> more than you earned this period. Tap 'Budget' to optimize your allocations.`,
        impact: 'critical',
        icon: 'lucide-trending-down',
        color: 'crimson'
      });
    }

    // 4. Financial productivity rule check
    if (totals.income > 0) {
      const needsRatio = ((catExpenses['Housing'] || 0) + (catExpenses['Utilities'] || 0)) / totals.income;
      if (needsRatio > 0.4) {
        insights.push({
          type: 'tip',
          title: 'Fixed Cost Optimization',
          description: `Fixed costs (Rent & Utilities) account for <strong>${(needsRatio * 100).toFixed(0)}%</strong> of your total salary. Try to target under 35% to increase liquid cashflow.`,
          impact: 'info',
          icon: 'lucide-lightbulb',
          color: 'cyan'
        });
      }
    }

    // Add generic finance tips if list is short
    if (insights.length < 3) {
      insights.push({
        type: 'tip',
        title: 'The 48-Hour Buffer Rule',
        description: `Introduce a 48-hour cool-off period on all non-essential items in your <strong>Shopping</strong> queue. 70% of impulse buying decays in this timeframe.`,
        impact: 'info',
        icon: 'lucide-zap',
        color: 'cyan'
      });
      
      insights.push({
        type: 'tip',
        title: 'Liquidity Reserve Target',
        description: `Set up an emergency buffer of 6 months of essential housing expenses (~${window.FinovaDB.formatMoney((budgets.Housing || 1500) * 6)}). Keep this in a High Yield Savings Account.`,
        impact: 'info',
        icon: 'lucide-piggy-bank',
        color: 'emerald'
      });
    }

    return insights;
  }
};

window.FinovaInsights = FinovaInsights;
