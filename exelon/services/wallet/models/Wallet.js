const db = require('../database');

class Wallet {
  static async create(name, userId) {
    const [result] = await db.execute(
      'INSERT INTO wallets (name, userId) VALUES (?, ?)',
      [name, userId]
    );
    return { id: result.insertId, name, userId, balance: 0.00 };
  }

  static async findByUserId(userId) {
    const [rows] = await db.execute('SELECT * FROM wallets WHERE userId = ?', [userId]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM wallets WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM wallets WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async delete(id, userId) {
    const [result] = await db.execute('DELETE FROM wallets WHERE id = ? AND userId = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  static async updateBalance(id, amount, type) {
    const balanceChange = type === 'income' ? amount : -amount;
    const [result] = await db.execute(
      'UPDATE wallets SET balance = balance + ? WHERE id = ?',
      [balanceChange, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Wallet;