const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Personal Finance Management API',
      version: '1.0.0',
      description: 'A microservices-based personal finance management application',
    },
    servers: [
      {
        url: 'http://localhost',
        description: 'Development server (via Nginx)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            userId: { type: 'integer' },
            balance: { type: 'number', format: 'float' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            type: { type: 'string', enum: ['income', 'expense'] },
            amount: { type: 'number', format: 'float' },
            category: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'integer', description: 'Unix timestamp' },
            budgetStatus: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['BUDGET_WARNING', 'BUDGET_EXCEEDED'] },
                message: { type: 'string' },
                budgetAmount: { type: 'number' },
                currentSpending: { type: 'number' },
                percentUsed: { type: 'string' },
              },
            },
          },
        },
        Budget: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            category: { type: 'string' },
            amount: { type: 'number', format: 'float' },
            month: { type: 'integer', description: 'Unix timestamp' },
            spent: { type: 'number', format: 'float' },
            remaining: { type: 'number', format: 'float' },
          },
        },
        Report: {
          type: 'object',
          properties: {
            totalIncome: { type: 'number', format: 'float' },
            totalExpenses: { type: 'number', format: 'float' },
            netSavings: { type: 'number', format: 'float' },
            categoryBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  amount: { type: 'number', format: 'float' },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./swagger-docs.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };