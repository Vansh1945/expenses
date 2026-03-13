import express from 'express';
import { createCompany, getCompany, updateCompany } from '../controllers/companyController.js';
import { protect, businessOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Business-Only Routes
router.post('/', protect, businessOnly, createCompany)
router.get('/', protect, businessOnly, createCompany)
router.put('/', protect, businessOnly, createCompany)

export default router;
