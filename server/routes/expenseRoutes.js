import express from 'express';
import {
    createExpense,
    getExpenses,
    updateExpense,
    deleteExpense,
} from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createExpense)
router.get('/', protect, createExpense)
router.put('/:id', protect, updateExpense)
router.delete('/:id', protect, updateExpense)

export default router;
