const express = require('express');
const cors = require('cors');
const rabbitmq = require('../../shared/rabbitmq');
const Cache = require('../../shared/cache');
const walletRoutes = require('./routes/walletRoutes');
const Wallet = require('./models/Wallet');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', walletRoutes);

app.get('/health', async (req, res) => {
  const health = await require('../../shared/healthCheck')('Wallet Service');
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

const PORT = process.env.WALLET_SERVICE_PORT || 3002;
app.listen(PORT, async () => {
  try { 
    await rabbitmq.connect(); 
    console.log("RabbitMQ connected");
    
    // Only subscribe if channel is available
    if (rabbitmq.channel) {
      await rabbitmq.subscribe('wallet-service', ['wallet.*'], async (message) => {
        const { event, data } = message;
        
        // Handle wallet balance updates
        if (event === 'wallet_balance_update') {
          try {
            await Wallet.updateBalance(data.walletId, data.amount, data.type);
            await Cache.del(`wallets:${data.userId}`);
            console.log(`Updated wallet ${data.walletId} balance`);
          } catch (error) {
            console.error('Error updating wallet balance:', error.message);
          }
        }
      });
    }
  } catch (error) { 
    console.log("RabbitMQ connection failed, continuing without it:", error.message); 
  }
    
  try {
    const rpc = require('../../shared/rpc');
    await rpc.connect();
    
    // Handle RPC calls for wallet balance check
    await rpc.handleRPC('wallet_balance_rpc', async (data) => {
      const { walletId, userId } = data;
      const wallet = await Wallet.findById(walletId);
      if (!wallet || wallet.userId !== userId) {
        return { error: 'Wallet not found' };
      }
      return { balance: parseFloat(wallet.balance) };
    });
    
    // Handle RPC calls for wallet balance update
    await rpc.handleRPC('wallet_update_rpc', async (data) => {
      const { walletId, amount, type, userId } = data;
      await Wallet.updateBalance(walletId, amount, type);
      await Cache.del(`wallets:${userId}`);
      return { success: true };
    });
  } catch (error) {
    console.log('RPC setup failed:', error.message);
  }
  
  console.log(`Wallet service running on port ${PORT}`);
});