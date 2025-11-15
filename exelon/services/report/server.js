const express = require('express');
const cors = require('cors');
const rpc = require('../../shared/rpc');
const reportRoutes = require('./routes/reportRoutes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', reportRoutes);

app.get('/health', async (req, res) => {
  const health = await require('../../shared/healthCheck')('Report Service');
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

const PORT = process.env.REPORT_SERVICE_PORT || 3005;
app.listen(PORT, async () => {
  await rpc.connect();
  console.log(`Report service running on port ${PORT}`);
});