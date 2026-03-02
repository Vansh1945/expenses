import express from 'express';
import { protect, personalOnly } from '../middleware/authMiddleware.js';
import { getIncomes, addIncome, deleteIncome, updateIncome } from '../controllers/incomeController.js';

const router = express.Router();

router.route('/').get(protect, personalOnly, getIncomes).post(protect, personalOnly, addIncome);
router.route('/:id').delete(protect, personalOnly, deleteIncome).put(protect, personalOnly, updateIncome);

export default router;
