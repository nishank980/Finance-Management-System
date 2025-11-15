const Cache = require('../../../shared/cache');
const rpc = require('../../../shared/rpc');

class ReportController {
  static async getFinancialReport(req, res) {
    try {
      const userId = req.user.userId;
      const month = req.query.month || Date.now();
      const cacheKey = `report:${userId}:${month}`;
      
      let report = await Cache.get(cacheKey);
      if (report) {
        return res.json(JSON.parse(report));
      }
      
      // Get month boundaries
      const dateObj = new Date(month * 1000);
      const monthStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime() / 1000;
      const monthEnd = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getTime() / 1000;
      
      // Get financial data via RPC
      const reportData = await rpc.call('report_data_rpc', {
        userId,
        monthStart,
        monthEnd
      });
      
      await Cache.set(cacheKey, JSON.stringify(reportData), 300);
      res.json(reportData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ReportController;