import express from 'express';
import { createProject, getProjects, updateProject } from '../controllers/projectController.js';
import { protect, businessOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Business-Only Routes
router.route('/').post(protect, businessOnly, createProject)
    .get(protect, businessOnly, getProjects);

router.route('/:id').put(protect, businessOnly, updateProject);

export default router;
