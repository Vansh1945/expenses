import Expense from '../models/expenseModel.js';
import Budget from '../models/budgetModel.js';

// @desc    Get financial analysis summary
// @route   GET /api/analysis/summary
// @access  Private
const getAnalysisSummary = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // 1. Spending Pattern (Top Category this month)
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

        const pattern = await Expense.aggregate([
            { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } },
            { $limit: 1 },
        ]);
        const topCategory = pattern.length > 0 ? pattern[0]._id : 'N/A';

        // 2. Monthly Growth Percentage
        const lastMonthStart = new Date(currentYear, currentMonth - 2, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59, 999);

        const currentMonthSpendReq = Expense.aggregate([
            { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const lastMonthSpendReq = Expense.aggregate([
            { $match: { userId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const [currSpendData, lastSpendData] = await Promise.all([currentMonthSpendReq, lastMonthSpendReq]);
        const currSpend = currSpendData.length > 0 ? currSpendData[0].total : 0;
        const lastSpend = lastSpendData.length > 0 ? lastSpendData[0].total : 0;

        let monthlyGrowth = 0;
        if (lastSpend > 0) {
            monthlyGrowth = ((currSpend - lastSpend) / lastSpend) * 100;
        }

        // 3. Future Expense Prediction (Average of last 3 months)
        const threeMonthsAgoStart = new Date(currentYear, currentMonth - 4, 1);

        // We get total from last 3 completed months
        const threeMonthsData = await Expense.aggregate([
            { $match: { userId, date: { $gte: threeMonthsAgoStart, $lte: lastMonthEnd } } },
            { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } },
        ]);

        const threeMonthsTotal = threeMonthsData.reduce((acc, curr) => acc + curr.total, 0);
        const predictedExpense = threeMonthsData.length > 0 ? (threeMonthsTotal / threeMonthsData.length).toFixed(2) : 0;

        // 4. Financial Health Score (based on Budget vs Spending)
        const budget = await Budget.findOne({ userId, month: currentMonth, year: currentYear });
        let healthScore = 100;

        if (budget && budget.limitAmount > 0) {
            const budgetUtilized = (currSpend / budget.limitAmount) * 100;
            if (budgetUtilized > 100) {
                healthScore = Math.max(0, 100 - (budgetUtilized - 100));
            } else if (budgetUtilized > 80) {
                healthScore -= 10;
            }
        } else {
            healthScore = currSpend > 0 ? 50 : 100; // no budget set, default score
        }

        res.json({
            spendingPattern: {
                topCategory,
            },
            monthlyGrowthPercentage: monthlyGrowth.toFixed(2) + '%',
            futureExpensePrediction: predictedExpense,
            financialHealthScore: healthScore.toFixed(0) + '/100',
        });
    } catch (error) {
        next(error);
    }
};

export { getAnalysisSummary };
