const express = require('express');
const cors = require('cors');
const rabbitmq = require('../../shared/rabbitmq');
const rpc = require('../../shared/rpc');
const transactionRoutes = require('./routes/transactionRoutes');
const db = require('./database');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', transactionRoutes);

app.get('/health', async (req, res) => {
  const health = await require('../../shared/healthCheck')('Transaction Service');
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

const PORT = process.env.TRANSACTION_SERVICE_PORT || 3003;
app.listen(PORT, async () => {
  try { await rabbitmq.connect(); console.log("RabbitMQ connected"); } catch (error) { console.log("RabbitMQ connection failed, continuing without it:", error.message); }
  await rpc.connect();
  
  // Handle RPC calls for spending calculation
  await rpc.handleRPC('spending_rpc', async (data) => {
    const { userId, category, monthStart, monthEnd } = data;
    
    const [rows] = await require('./database').execute(
      'SELECT COALESCE(SUM(amount), 0) as spent FROM transactions WHERE userId = ? AND category = ? AND type = "expense" AND date >= ? AND date <= ?',
      [userId, category, monthStart, monthEnd]
    );
    
    return { spent: parseFloat(rows[0].spent) };
  });
  
  // Handle RPC calls for report data
  await rpc.handleRPC('report_data_rpc', async (data) => {
    const { userId, monthStart, monthEnd } = data;
    
    const [incomeResult] = await require('./database').execute(
      'SELECT COALESCE(SUM(amount), 0) as totalIncome FROM transactions WHERE userId = ? AND type = "income" AND date >= ? AND date <= ?',
      [userId, monthStart, monthEnd]
    );
    
    const [expenseResult] = await require('./database').execute(
      'SELECT COALESCE(SUM(amount), 0) as totalExpenses FROM transactions WHERE userId = ? AND type = "expense" AND date >= ? AND date <= ?',
      [userId, monthStart, monthEnd]
    );
    
    const [categoryExpenses] = await require('./database').execute(
      'SELECT category, SUM(amount) as amount FROM transactions WHERE userId = ? AND type = "expense" AND date >= ? AND date <= ? GROUP BY category ORDER BY amount DESC',
      [userId, monthStart, monthEnd]
    );
    
    const totalIncome = parseFloat(incomeResult[0].totalIncome);
    const totalExpenses = parseFloat(expenseResult[0].totalExpenses);
    
    return {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      categoryBreakdown: categoryExpenses.map(cat => ({
        category: cat.category,
        amount: parseFloat(cat.amount)
      }))
    };
  });
  
  console.log(`Transaction service running on port ${PORT}`);
});