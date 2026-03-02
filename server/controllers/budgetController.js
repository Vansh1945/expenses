import Budget from '../models/budgetModel.js';
import Expense from '../models/expenseModel.js';

// @desc    Set or update budget
// @route   POST /api/budget
// @access  Private
const setBudget = async (req, res, next) => {
    const { month, year, limitAmount, savingGoal } = req.body;

    try {
        if (!month || !year || !limitAmount) {
            res.status(400);
            return next(new Error('month, year, and limitAmount are required'));
        }
        if (Number(limitAmount) <= 0) {
            res.status(400);
            return next(new Error('Budget amount must be greater than 0'));
        }

        let budget = await Budget.findOne({ userId: req.user._id, month: Number(month), year: Number(year) });

        if (budget) {
            budget.limitAmount = Number(limitAmount);
            if (savingGoal !== undefined) budget.savingGoal = Math.max(0, Number(savingGoal));
            budget = await budget.save();
        } else {
            budget = await Budget.create({
                userId: req.user._id,
                month: Number(month),
                year: Number(year),
                limitAmount: Number(limitAmount),
                savingGoal: savingGoal ? Math.max(0, Number(savingGoal)) : 0,
            });
        }

        res.status(201).json(budget);
    } catch (error) {
        next(error);
    }
};

// @desc    Get budget and check vs expenses
// @route   GET /api/budget
// @access  Private
const getBudgetStatus = async (req, res, next) => {
    const { month, year } = req.query;

    try {
        const budget = await Budget.findOne({
            userId: req.user._id,
            month: Number(month),
            year: Number(year),
        });

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found for this period' });
        }

        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

        const expenses = await Expense.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    date: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSpent: { $sum: '$amount' },
                },
            },
        ]);

        const totalSpent = expenses.length > 0 ? expenses[0].totalSpent : 0;
        const utilization = budget.limitAmount > 0 ? (totalSpent / budget.limitAmount) * 100 : 0;
        const isExceeded = totalSpent > budget.limitAmount;
        const isNearLimit = !isExceeded && utilization >= 80;

        let warning = null;
        if (isExceeded) {
            warning = `⚠️ You have exceeded your monthly budget by ₹${(totalSpent - budget.limitAmount).toFixed(0)}!`;
        } else if (isNearLimit) {
            warning = `⚠️ You have used ${utilization.toFixed(1)}% of your budget. You are approaching your limit!`;
        }

        res.json({
            budget: budget.limitAmount,
            savingGoal: budget.savingGoal || 0,
            totalSpent,
            remaining: budget.limitAmount - totalSpent,
            utilization: parseFloat(utilization.toFixed(2)),
            isExceeded,
            isNearLimit,
            warning,
        });
    } catch (error) {
        next(error);
    }
};

export { setBudget, getBudgetStatus };

