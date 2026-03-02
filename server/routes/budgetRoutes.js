import express from 'express';
import {
    setBudget,
    getBudgetStatus,
} from '../controllers/budgetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, setBudget).get(protect, getBudgetStatus);

export default router;
