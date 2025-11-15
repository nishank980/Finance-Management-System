const Transaction = require('../models/Transaction');
const rpc = require('../../../shared/rpc');
const Cache = require('../../../shared/cache');
const db = require('../database');
const { withTransaction } = require('../../../shared/transaction');

class TransactionController {
  static async create(req, res) {
    try {
      const { walletId, type, amount, category, description, date } = req.body;
      const userId = req.user.userId;
      
      if (!walletId || !type || !amount || !category || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await withTransaction(db, async (connection) => {
        // For expenses, validate via RPC
        if (type === 'expense') {
          // Check wallet balance
          const walletData = await rpc.call('wallet_balance_rpc', { walletId, userId });
          
          if (walletData.error) {
            throw new Error(walletData.error);
          }
          
          if (amount > walletData.balance) {
            const error = new Error('Insufficient funds');
            error.statusCode = 400;
            error.details = {
              message: `Wallet balance: $${walletData.balance}, Transaction amount: $${amount}`,
              available: walletData.balance,
              requested: amount
            };
            throw error;
          }
          
          // Check budget limit
          const budgetData = await rpc.call('budget_check_rpc', { userId, category, amount, date });
          
          // Create transaction
          const [result] = await connection.execute(
            'INSERT INTO transactions (userId, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, type, amount, category, description, date]
          );
          
          const transaction = { id: result.insertId, userId, type, amount, category, description, date };
          
          // Update wallet balance via RPC
          await rpc.call('wallet_update_rpc', { walletId, amount, type, userId });
          
          return {
            ...transaction,
            budgetStatus: budgetData.budgetStatus
          };
        } else {
          // Income transactions
          const [result] = await connection.execute(
            'INSERT INTO transactions (userId, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, type, amount, category, description, date]
          );
          
          const transaction = { id: result.insertId, userId, type, amount, category, description, date };
          
          // Update wallet balance via RPC
          await rpc.call('wallet_update_rpc', { walletId, amount, type, userId });
          
          return transaction;
        }
      });
      
      await Cache.del(`transactions:${userId}`);
      res.status(201).json(result);
      
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
          ...error.details
        });
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const userId = req.user.userId;
      const { startDate, endDate } = req.query;
      
      const filters = {};
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
      
      const transactions = await Transaction.findByUserId(userId, filters);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { transactionId } = req.params;
      const userId = req.user.userId;
      
      await withTransaction(db, async (connection) => {
        // Get transaction details first
        const [transactions] = await connection.execute(
          'SELECT * FROM transactions WHERE id = ? AND userId = ?',
          [transactionId, userId]
        );
        
        if (transactions.length === 0) {
          const error = new Error('Transaction not found');
          error.statusCode = 404;
          throw error;
        }
        
        const transaction = transactions[0];
        
        // Delete transaction
        await connection.execute('DELETE FROM transactions WHERE id = ?', [transactionId]);
        
        // Note: Cannot reverse wallet balance since we don't store walletId
        // This is a limitation of proper microservices data ownership
      });
      
      await Cache.del(`transactions:${userId}`);
      res.json({ message: 'Transaction deleted successfully' });
      
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = TransactionController;