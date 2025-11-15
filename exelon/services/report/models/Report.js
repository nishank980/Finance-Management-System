const db = require('../../../shared/database');

class Report {
  // Report service only handles its own aggregated data
  // Transaction data comes via RabbitMQ messages
}

module.exports = Report;