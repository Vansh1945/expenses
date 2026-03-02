import express from 'express';
import {
    createGroup,
    getUserGroups,
    joinRoom,
    addMember,
    getGroup,
    removeMember,
    addGroupExpense,
    getGroupExpenses,
    getGroupBalances,
    settleExpense,
    addFamilyMember,
    removeFamilyMember,
    addFamilyGoal,
    updateGoalSavings,
    getFamilyReport,
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Room CRUD
router.route('/').get(protect, getUserGroups).post(protect, createGroup);
router.route('/join').post(protect, joinRoom);
router.route('/:id').get(protect, getGroup);
router.route('/:id/add-member').post(protect, addMember);
router.route('/:id/members/:userId').delete(protect, removeMember);

// Group Expenses
router.route('/:id/expenses').post(protect, addGroupExpense).get(protect, getGroupExpenses);
router.route('/expenses/:expenseId/settle').patch(protect, settleExpense);

// Balances & Settlement
router.route('/:id/balances').get(protect, getGroupBalances);

// Family-specific routes
router.route('/:id/family-members').post(protect, addFamilyMember);
router.route('/:id/family-members/:memberId').delete(protect, removeFamilyMember);
router.route('/:id/goals').post(protect, addFamilyGoal);
router.route('/:id/goals/:goalId').patch(protect, updateGoalSavings);
router.route('/:id/family-report').get(protect, getFamilyReport);

export default router;
