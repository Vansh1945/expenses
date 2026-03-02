import Setting from '../models/settingModel.js';
import SecurityLog from '../models/securityLogModel.js';
import User from '../models/userModel.js';
import Expense from '../models/expenseModel.js';

// @desc    Get Global System Settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res, next) => {
    try {
        let settings = await Setting.findOne();

        // Create singleton if it doesn't exist
        if (!settings) {
            settings = await Setting.create({});
        }
        res.json(settings);
    } catch (error) {
        next(error);
    }
};

// @desc    Update Global System Settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSettings = async (req, res, next) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) settings = await Setting.create({});

        // Merge incoming updates
        settings.alertsEnabled = req.body.alertsEnabled !== undefined ? req.body.alertsEnabled : settings.alertsEnabled;
        settings.aiPredictionsEnabled = req.body.aiPredictionsEnabled !== undefined ? req.body.aiPredictionsEnabled : settings.aiPredictionsEnabled;
        settings.maxExpenseLimit = req.body.maxExpenseLimit !== undefined ? req.body.maxExpenseLimit : settings.maxExpenseLimit;
        settings.systemNotifications = req.body.systemNotifications !== undefined ? req.body.systemNotifications : settings.systemNotifications;
        settings.maintenanceMode = req.body.maintenanceMode !== undefined ? req.body.maintenanceMode : settings.maintenanceMode;

        const updatedSettings = await settings.save();
        res.json(updatedSettings);

    } catch (error) {
        next(error);
    }
};

// @desc    Get All Security Logs
// @route   GET /api/admin/security/logs
// @access  Private/Admin
const getSecurityLogs = async (req, res, next) => {
    try {
        const logs = await SecurityLog.find()
            .populate('userId', 'name role email')
            .sort({ timestamp: -1 })
            .limit(500); // Prevent payload overload

        res.json(logs);
    } catch (error) {
        next(error);
    }
};

// @desc    Get Advanced Overview Analytics
// @route   GET /api/admin/analytics/overview
// @access  Private/Admin
const getAdminAnalytics = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments({});

        // Active in last 24H approximation using login activity logs
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUserIds = await SecurityLog.distinct('userId', {
            actionType: 'successful_login',
            timestamp: { $gte: yesterday }
        });
        const dailyActiveUsers = activeUserIds.length;

        const expenses = await Expense.find({});
        const totalExpensesCount = expenses.length;
        const totalTransactionAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

        // Top Used Categories
        const catMap = {};
        expenses.forEach(e => {
            if (!catMap[e.category]) catMap[e.category] = 0;
            catMap[e.category] += 1;
        });

        const topCategories = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        res.json({
            totalUsers,
            dailyActiveUsers,
            totalExpensesCount,
            totalTransactionAmount,
            topCategories
        });

    } catch (error) {
        next(error);
    }
};

export { getSettings, updateSettings, getSecurityLogs, getAdminAnalytics };
