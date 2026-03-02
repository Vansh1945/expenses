import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getAdminDashboardStats,
    getUsers,
    updateUser,
    deleteUser,
    getUserExpenses,
    deleteUserExpense,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getReports
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, admin);

// Dashboard
router.get('/dashboard', getAdminDashboardStats);

// Users
router.route('/users')
    .get(getUsers);
router.route('/users/:id')
    .put(updateUser)
    .delete(deleteUser);
router.route('/users/:id/expenses')
    .get(getUserExpenses);
router.route('/users/:userId/expenses/:expenseId')
    .delete(deleteUserExpense);

import {
    getSettings,
    updateSettings,
    getSecurityLogs,
    getAdminAnalytics
} from '../controllers/adminMasterController.js';

// Categories
router.route('/categories')
    .get(getCategories)
    .post(createCategory);
router.route('/categories/:id')
    .put(updateCategory)
    .delete(deleteCategory);

// Reports
router.get('/reports', getReports);

// Master Control Settings
router.route('/settings')
    .get(getSettings)
    .put(updateSettings);

// Security Tracking
router.get('/security/logs', getSecurityLogs);

// Advanced Analytics
router.get('/analytics/overview', getAdminAnalytics);

export default router;
