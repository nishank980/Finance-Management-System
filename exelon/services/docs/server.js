const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { swaggerUi, specs } = require('./swagger');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Personal Finance API Documentation'
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Personal Finance Management API',
    documentation: '/api-docs',
    health: '/health',
    version: '1.0.0',
    services: {
      auth: 'Authentication service',
      wallet: 'Wallet management service',
      transaction: 'Transaction processing service',
      budget: 'Budget tracking service',
      report: 'Financial reporting service'
    },
    endpoints: {
      auth: '/api/auth/*',
      wallets: '/api/wallets/*',
      transactions: '/api/transactions/*',
      budgets: '/api/budgets/*',
      reports: '/api/report/*'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'API Documentation Server is running'
  });
});

const PORT = process.env.DOCS_PORT || 8080;
app.listen(PORT, () => {
  console.log(`📚 API Documentation server running on port ${PORT}`);
  console.log(`📖 Swagger UI available at: http://localhost:${PORT}/api-docs`);
  console.log(`🏠 API Overview at: http://localhost:${PORT}/`);
});