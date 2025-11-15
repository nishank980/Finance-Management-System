const Budget = require('../models/Budget');
const Cache = require('../../../shared/cache');
const rpc = require('../../../shared/rpc');
const db = require('../database');
const { withTransaction } = require('../../../shared/transaction');

class BudgetController {
  static async create(req, res) {
    try {
      const { category, amount, month } = req.body;
      const userId = req.user.userId;
      
      if (!category || !amount || !month) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const budget = await withTransaction(db, async (connection) => {
        await connection.execute(
          'INSERT INTO budgets (userId, category, amount, month) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)',
          [userId, category, amount, month]
        );
        
        return { userId, category, amount, month };
      });
      
      await Cache.del(`budgets:${userId}:${month}`);
      res.status(201).json(budget);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const userId = req.user.userId;
      const month = req.query.month || Date.now();
      const cacheKey = `budgets:${userId}:${month}`;
      
      let budgets = await Cache.get(cacheKey);
      if (budgets) {
        return res.json(JSON.parse(budgets));
      }
      
      const budgetRows = await Budget.findByUserIdAndMonth(userId, month);
      
      // Get spending data for each budget via RPC
      const dateObj = new Date(month * 1000);
      const monthStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime() / 1000;
      const monthEnd = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getTime() / 1000;
      
      const budgetsWithSpending = await Promise.all(budgetRows.map(async (budget) => {
        try {
          const spendingData = await rpc.call('spending_rpc', {
            userId,
            category: budget.category,
            monthStart,
            monthEnd
          });
          
          return {
            ...budget,
            spent: spendingData.spent,
            remaining: budget.amount - spendingData.spent
          };
        } catch (error) {
          return {
            ...budget,
            spent: 0,
            remaining: budget.amount
          };
        }
      }));
      
      await Cache.set(cacheKey, JSON.stringify(budgetsWithSpending), 300);
      res.json(budgetsWithSpending);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = BudgetController;