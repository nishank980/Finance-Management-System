const express = require('express');
const BudgetController = require('../controllers/BudgetController');
const { verifyToken } = require('../../../shared/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/', BudgetController.create);
router.get('/', BudgetController.getAll);

module.exports = router;