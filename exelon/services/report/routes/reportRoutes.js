const express = require('express');
const ReportController = require('../controllers/ReportController');
const { verifyToken } = require('../../../shared/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', ReportController.getFinancialReport);

module.exports = router;