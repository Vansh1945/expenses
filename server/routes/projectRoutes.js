import express from 'express';
import { createProject, getProjects, updateProject } from '../controllers/projectController.js';
import { protect, businessOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Business-Only Routes
router.post('/', protect, businessOnly, createProject)
router.get('/', protect, businessOnly, getProjects)

router.put('/:id', protect, businessOnly, updateProject);

export default router;
