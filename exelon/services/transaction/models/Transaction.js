const mysql = require('mysql2/promise');

const transactionDb = mysql.createPool({
  host: 'transaction-db',
  user: 'root',
  password: 'password',
  database: 'transaction_db',
  waitForConnections: true,
  connectionLimit: 10
});

class Transaction {
  static async create(userId, type, amount, category, description, date) {
    const [result] = await transactionDb.execute(
      'INSERT INTO transactions (userId, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, amount, category, description, date]
    );
    return { id: result.insertId, userId, type, amount, category, description, date };
  }

  static async findByUserId(userId, filters = {}) {
    let query = 'SELECT * FROM transactions WHERE userId = ?';
    let params = [userId];
    
    if (filters.startDate && filters.endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }
    
    query += ' ORDER BY date DESC';
    
    const [rows] = await transactionDb.execute(query, params);
    return rows;
  }

  static async findById(id, userId) {
    const [rows] = await transactionDb.execute(
      'SELECT * FROM transactions WHERE id = ? AND userId = ?',
      [id, userId]
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const [result] = await transactionDb.execute('DELETE FROM transactions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Transaction;