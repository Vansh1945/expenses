import express from 'express';
import { createCompany, getCompany, updateCompany } from '../controllers/companyController.js';
import { protect, businessOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Business-Only Routes
router.route('/').post(protect, businessOnly, createCompany)
    .get(protect, businessOnly, getCompany)
    .put(protect, businessOnly, updateCompany);

export default router;
