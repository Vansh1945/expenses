import express from 'express';
import { submitExpense, getCompanyExpenses, updateExpenseStatus } from '../controllers/companyExpenseController.js';
import { protect, businessOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Business-Only Routes
router.post('/',protect, businessOnly, submitExpense)
router.get('/', protect, businessOnly, getCompanyExpenses);

router.put('/:id/status',protect, businessOnly, updateExpenseStatus);

export default router;
