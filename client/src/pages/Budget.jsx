import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { MdWarning, MdCheckCircle, MdSavings } from 'react-icons/md';

const Budget = () => {
    const [budgetStatus, setBudgetStatus] = useState(null);
    const [amount, setAmount] = useState('');
    const [savingGoal, setSavingGoal] = useState('');
    const [loading, setLoading] = useState(true);
    const [monthlyReport, setMonthlyReport] = useState(null);

    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const fetchBudgetAndReport = async () => {
        try {
            const [budgetRes, reportRes] = await Promise.all([
                api.get(`/budget?month=${month}&year=${year}`).catch(() => ({ data: null })),
                api.get(`/reports/monthly?month=${month}&year=${year}`).catch(() => ({ data: null }))
            ]);

            if (budgetRes.data) {
                setBudgetStatus(budgetRes.data);
                setAmount(budgetRes.data.budget || '');
                setSavingGoal(budgetRes.data.savingGoal || '');
            } else {
                setBudgetStatus(null);
            }

            if (reportRes.data) {
                setMonthlyReport(reportRes.data);
            }
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgetAndReport();
    }, []);

    const handleSetBudget = async (e) => {
        e.preventDefault();
        if (Number(amount) <= 0) {
            toast.error('Budget amount must be greater than 0');
            return;
        }
        try {
            await api.post('/budget', {
                month,
                year,
                limitAmount: Number(amount),
                savingGoal: savingGoal ? Number(savingGoal) : 0,
            });
            toast.success('Budget saved successfully!');
            fetchBudgetAndReport();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to set budget');
        }
    };

    const utilization = budgetStatus
        ? Math.min(100, (budgetStatus.totalSpent / budgetStatus.budget) * 100)
        : 0;

    const progressColor =
        budgetStatus?.isExceeded ? 'bg-red-500' :
            budgetStatus?.isNearLimit ? 'bg-yellow-500' :
                'bg-indigo-500';

    // Calculate actual savings based on Income - Expenses
    const currentSavings = monthlyReport
        ? monthlyReport.totalIncome - monthlyReport.totalSpent
        : (budgetStatus ? budgetStatus.budget - budgetStatus.totalSpent : 0);

    const savingsProgress = budgetStatus?.savingGoal > 0
        ? Math.min(100, (currentSavings / budgetStatus.savingGoal) * 100)
        : 0;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Monthly Budget</h1>

            {/* Set Budget Form */}
            <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Set Budget for {MONTHS[month - 1]} {year}
                </h2>
                <form onSubmit={handleSetBudget} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Spend Limit (₹)</label>
                        <input
                            type="number" required min="1"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="e.g. 30000"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Savings Goal (₹) <span className="text-gray-400 text-xs">(optional)</span></label>
                        <input
                            type="number" min="0"
                            value={savingGoal}
                            onChange={e => setSavingGoal(e.target.value)}
                            placeholder="e.g. 5000"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium">
                        Save Budget
                    </button>
                </form>
            </div>

            {/* Budget Overview */}
            {budgetStatus && (
                <div className="bg-white p-6 rounded-xl shadow border-t-4 border-indigo-500 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">Budget Overview</h2>

                    {/* Warnings */}
                    {budgetStatus.warning && (
                        <div className={`border-l-4 p-4 rounded flex items-start gap-3 ${budgetStatus.isExceeded
                            ? 'bg-red-50 border-red-500'
                            : 'bg-yellow-50 border-yellow-400'
                            }`}>
                            <MdWarning className={`w-6 h-6 mt-0.5 shrink-0 ${budgetStatus.isExceeded ? 'text-red-500' : 'text-yellow-500'}`} />
                            <div>
                                <h3 className={`font-bold ${budgetStatus.isExceeded ? 'text-red-800' : 'text-yellow-800'}`}>
                                    {budgetStatus.isExceeded ? 'Budget Exceeded!' : 'Approaching Budget Limit'}
                                </h3>
                                <p className={`mt-1 text-sm ${budgetStatus.isExceeded ? 'text-red-700' : 'text-yellow-700'}`}>
                                    {budgetStatus.warning}
                                </p>
                            </div>
                        </div>
                    )}

                    {!budgetStatus.warning && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-center gap-3">
                            <MdCheckCircle className="text-green-500 w-6 h-6 shrink-0" />
                            <p className="text-green-800 font-medium text-sm">
                                You are within budget! Keep it up 🎉
                            </p>
                        </div>
                    )}

                    {/* 3 stat cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Budget Limit</p>
                            <p className="text-3xl font-bold text-gray-900">₹{budgetStatus.budget.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Spent</p>
                            <p className={`text-3xl font-bold ${budgetStatus.isExceeded ? 'text-red-600' : 'text-gray-900'}`}>
                                ₹{budgetStatus.totalSpent.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</p>
                            <p className={`text-3xl font-bold ${budgetStatus.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{budgetStatus.remaining.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Utilization bar */}
                    <div>
                        <div className="flex justify-between text-sm font-medium mb-2">
                            <span className="text-gray-600">Budget Utilization</span>
                            <span className={
                                budgetStatus.isExceeded ? 'text-red-600' :
                                    budgetStatus.isNearLimit ? 'text-yellow-600' :
                                        'text-indigo-600'
                            }>
                                {utilization.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className={`h-4 rounded-full transition-all duration-700 ${progressColor}`}
                                style={{ width: `${utilization}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>₹0</span>
                            <span className="text-yellow-500 font-medium">80% — ₹{(budgetStatus.budget * 0.8).toLocaleString()}</span>
                            <span>₹{budgetStatus.budget.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Savings Goal tracker */}
                    {budgetStatus.savingGoal > 0 && (
                        <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <MdSavings className="w-5 h-5 text-purple-600" />
                                <h3 className="font-semibold text-gray-700">Savings Goal Tracker</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center mb-3">
                                <div className="bg-purple-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 uppercase mb-1">Target Savings</p>
                                    <p className="font-bold text-purple-700">₹{budgetStatus.savingGoal.toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 uppercase mb-1">Saved So Far</p>
                                    <p className={`font-bold ${currentSavings >= budgetStatus.savingGoal ? 'text-green-700' : 'text-purple-700'}`}>
                                        ₹{currentSavings.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 uppercase mb-1">Progress</p>
                                    <p className="font-bold text-purple-700">{Math.min(100, savingsProgress).toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="h-3 rounded-full bg-purple-500 transition-all duration-700"
                                    style={{ width: `${Math.min(100, savingsProgress)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!budgetStatus && !loading && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
                    <p className="text-gray-500 text-lg">No budget set for {MONTHS[month - 1]} {year}.</p>
                    <p className="text-gray-400 text-sm mt-2">Use the form above to set your monthly budget.</p>
                </div>
            )}
        </div>
    );
};

export default Budget;
