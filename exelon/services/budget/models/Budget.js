const mysql = require('mysql2/promise');

const budgetDb = mysql.createPool({
  host: 'budget-db',
  user: 'root',
  password: 'password',
  database: 'budget_db',
  waitForConnections: true,
  connectionLimit: 10
});

class Budget {
  static async create(userId, category, amount, month) {
    const [result] = await budgetDb.execute(
      'INSERT INTO budgets (userId, category, amount, month) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)',
      [userId, category, amount, month]
    );
    return { userId, category, amount, month };
  }

  static async findByUserIdAndMonth(userId, month) {
    const [rows] = await budgetDb.execute(
      'SELECT * FROM budgets WHERE userId = ? AND month = ?',
      [userId, month]
    );
    return rows;
  }
}

module.exports = Budget;