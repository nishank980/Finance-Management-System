const db = require('./database');
const redis = require('./redis');

const healthCheck = async (serviceName) => {
  const health = {
    service: serviceName,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // Database check
    if (db) {
      await db.execute('SELECT 1');
      health.checks.database = 'healthy';
    }
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
  }

  try {
    // Redis check
    if (redis) {
      await redis.ping();
      health.checks.redis = 'healthy';
    }
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'unhealthy';
  }

  return health;
};

module.exports = healthCheck;