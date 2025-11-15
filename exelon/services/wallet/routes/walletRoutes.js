const express = require('express');
const WalletController = require('../controllers/WalletController');
const { verifyToken } = require('../../../shared/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/', WalletController.create);
router.get('/', WalletController.getAll);
router.delete('/:walletId', WalletController.delete);
router.put('/:walletId/balance', WalletController.updateBalance);

module.exports = router;