import Expense from '../models/expenseModel.js';
import Budget from '../models/budgetModel.js';

// @desc    Get all notifications and alerts
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const notifications = [];
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // 1. Budget exceed alert
        const budget = await Budget.findOne({ userId, month: currentMonth, year: currentYear });
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

        const currentMonthSpendReq = await Expense.aggregate([
            { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const currSpend = currentMonthSpendReq.length > 0 ? currentMonthSpendReq[0].total : 0;

        if (budget && currSpend > budget.limitAmount) {
            notifications.push({
                type: 'BUDGET_EXCEEDED',
                message: `You have exceeded your monthly budget of ${budget.limitAmount}. Total spent: ${currSpend}`,
            });
        } else if (budget && currSpend > budget.limitAmount * 0.8) {
            notifications.push({
                type: 'BUDGET_WARNING',
                message: `You have used ${((currSpend / budget.limitAmount) * 100).toFixed(1)}% of your monthly budget.`,
            });
        }

        // 2. Overspending warning (Compared to average)
        // simplistic average over last 3 months
        const threeMonthsAgoStart = new Date(currentYear, currentMonth - 4, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59, 999);

        const threeMonthsData = await Expense.aggregate([
            { $match: { userId, date: { $gte: threeMonthsAgoStart, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const historicalSpend = threeMonthsData.length > 0 ? (threeMonthsData[0].total / 3) : 0;

        if (historicalSpend > 0 && currSpend > historicalSpend * 1.5) {
            notifications.push({
                type: 'OVERSPENDING_WARNING',
                message: `Your current spending is significantly higher than your recent average of ${historicalSpend.toFixed(2)}.`,
            });
        }

        // 3. Recurring subscription detection
        const recentExpenses = await Expense.aggregate([
            { $match: { userId } },
            { $group: { _id: { amount: '$amount', category: '$category' }, count: { $sum: 1 }, latestDate: { $max: '$date' } } },
            { $match: { count: { $gte: 2 } } },
        ]);

        if (recentExpenses.length > 0) {
            notifications.push({
                type: 'RECURRING_SUBSCRIPTION',
                message: `Detected ${recentExpenses.length} potential recurring subscriptions based on duplicate amounts in the same category.`,
                details: recentExpenses,
            });
        }

        if (notifications.length === 0) {
            notifications.push({
                type: 'INFO',
                message: 'No new alerts. Your finances are looking good!',
            });
        }

        res.json(notifications);
    } catch (error) {
        next(error);
    }
};

export { getNotifications };
