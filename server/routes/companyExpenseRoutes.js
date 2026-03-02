import express from 'express';
import { submitExpense, getCompanyExpenses, updateExpenseStatus } from '../controllers/companyExpenseController.js';
import { protect, businessOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Business-Only Routes
router.route('/').post(protect, businessOnly, submitExpense)
    .get(protect, businessOnly, getCompanyExpenses);

router.route('/:id/status').put(protect, businessOnly, updateExpenseStatus);

export default router;
