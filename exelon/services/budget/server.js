const express = require('express');
const cors = require('cors');
const rabbitmq = require('../../shared/rabbitmq');
const rpc = require('../../shared/rpc');
const budgetRoutes = require('./routes/budgetRoutes');
const db = require('./database');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', budgetRoutes);

app.get('/health', async (req, res) => {
  const health = await require('../../shared/healthCheck')('Budget Service');
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

const PORT = process.env.BUDGET_SERVICE_PORT || 3004;
app.listen(PORT, async () => {
  await rpc.connect();
  
  // Handle RPC calls for budget checking
  await rpc.handleRPC('budget_check_rpc', async (data) => {
    const { userId, category, amount, date } = data;
    
    // Get month boundaries
    const dateObj = new Date(date * 1000);
    const monthStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime() / 1000;
    const monthEnd = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getTime() / 1000;
    
    // Get budget for this category
    const [budgetRows] = await require('./database').execute(
      'SELECT amount FROM budgets WHERE userId = ? AND category = ? AND month >= ? AND month <= ?',
      [userId, category, monthStart, monthEnd]
    );
    
    if (budgetRows.length === 0) {
      return { budgetStatus: null }; // No budget set
    }
    
    const budgetAmount = parseFloat(budgetRows[0].amount);
    
    // Get current spending via RPC
    const spendingData = await rpc.call('spending_rpc', {
      userId, category, monthStart, monthEnd
    });
    
    const currentSpending = spendingData.spent;
    const newTotal = currentSpending + amount;
    const percentUsed = (newTotal / budgetAmount) * 100;
    
    let budgetStatus = null;
    if (percentUsed >= 100) {
      budgetStatus = {
        type: 'BUDGET_EXCEEDED',
        message: `Budget exceeded! ${category}: $${newTotal}/$${budgetAmount} (${percentUsed.toFixed(0)}%)`,
        budgetAmount,
        currentSpending: newTotal,
        percentUsed: percentUsed.toFixed(0)
      };
    } else if (percentUsed >= 80) {
      budgetStatus = {
        type: 'BUDGET_WARNING',
        message: `Budget warning! ${category}: $${newTotal}/$${budgetAmount} (${percentUsed.toFixed(0)}%)`,
        budgetAmount,
        currentSpending: newTotal,
        percentUsed: percentUsed.toFixed(0)
      };
    }
    
    return { budgetStatus };
  });
  
  console.log(`Budget service running on port ${PORT}`);
});