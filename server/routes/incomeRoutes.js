import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getIncomes, addIncome, deleteIncome, updateIncome } from '../controllers/incomeController.js';

const router = express.Router();

router.route('/').get(protect, getIncomes).post(protect, addIncome);
router.route('/:id').delete(protect, deleteIncome).put(protect, updateIncome);

export default router;
