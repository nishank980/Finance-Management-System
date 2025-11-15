const express = require('express');
const TransactionController = require('../controllers/TransactionController');
const { verifyToken } = require('../../../shared/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/', TransactionController.create);
router.get('/', TransactionController.getAll);
router.delete('/:transactionId', TransactionController.delete);

module.exports = router;