const Wallet = require('../models/Wallet');
const Cache = require('../../../shared/cache');
const db = require('../../../shared/database');
const { withTransaction } = require('../../../shared/transaction');

class WalletController {
  static async create(req, res) {
    try {
      const { name } = req.body;
      const userId = req.user.userId;
      
      if (!name) {
        return res.status(400).json({ error: 'Wallet name is required' });
      }

      const wallet = await withTransaction(db, async (connection) => {
        const [result] = await connection.execute(
          'INSERT INTO wallets (name, userId) VALUES (?, ?)',
          [name, userId]
        );
        
        return { id: result.insertId, name, userId, balance: 0.00 };
      });
      
      await Cache.del(`wallets:${userId}`);
      res.status(201).json(wallet);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const userId = req.user.userId;
      const cacheKey = `wallets:${userId}`;
      
      let wallets = await Cache.get(cacheKey);
      if (wallets) {
        return res.json(JSON.parse(wallets));
      }
      
      wallets = await Wallet.findByUserId(userId);
      await Cache.set(cacheKey, JSON.stringify(wallets), 300);
      
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { walletId } = req.params;
      const userId = req.user.userId;
      
      await withTransaction(db, async (connection) => {
        const [result] = await connection.execute(
          'DELETE FROM wallets WHERE id = ? AND userId = ?', 
          [walletId, userId]
        );
        
        if (result.affectedRows === 0) {
          const error = new Error('Wallet not found');
          error.statusCode = 404;
          throw error;
        }
      });
      
      await Cache.del(`wallets:${userId}`);
      res.json({ message: 'Wallet deleted successfully' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async updateBalance(req, res) {
    try {
      const { walletId } = req.params;
      const { amount, type } = req.body;
      const userId = req.user.userId;
      
      await withTransaction(db, async (connection) => {
        const balanceChange = type === 'income' ? amount : -amount;
        const [result] = await connection.execute(
          'UPDATE wallets SET balance = balance + ? WHERE id = ? AND userId = ?',
          [balanceChange, walletId, userId]
        );
        
        if (result.affectedRows === 0) {
          const error = new Error('Wallet not found');
          error.statusCode = 404;
          throw error;
        }
      });
      
      await Cache.del(`wallets:${userId}`);
      res.json({ message: 'Balance updated' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = WalletController;