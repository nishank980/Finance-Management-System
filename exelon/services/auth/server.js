const express = require('express');
const cors = require('cors');
const rabbitmq = require('../../shared/rabbitmq');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', authRoutes);

app.get('/health', async (req, res) => {
  const health = await require('../../shared/healthCheck')('Auth Service');
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

const PORT = process.env.AUTH_SERVICE_PORT || 3001;
app.listen(PORT, async () => {
  try {
    try { await rabbitmq.connect(); console.log("RabbitMQ connected"); } catch (error) { console.log("RabbitMQ connection failed, continuing without it:", error.message); }
    console.log('RabbitMQ connected');
  } catch (error) {
    console.log('RabbitMQ connection failed, continuing without it:', error.message);
  }
  console.log(`Auth service running on port ${PORT}`);
});