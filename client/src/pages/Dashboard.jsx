import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [monthlyReport, setMonthlyReport] = useState(null);
    const [budgetStatus, setBudgetStatus] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const today = new Date();
                const month = today.getMonth() + 1;
                const year = today.getFullYear();

                const [analysisRes, reportRes, budgetRes] = await Promise.all([
                    api.get('/analysis/summary').catch(() => ({ data: null })),
                    api.get(`/reports/monthly?month=${month}&year=${year}`).catch(() => ({ data: null })),
                    api.get(`/budget?month=${month}&year=${year}`).catch(() => ({ data: null }))
                ]);

                setAnalysis(analysisRes.data);
                setMonthlyReport(reportRes.data);
                setBudgetStatus(budgetRes.data);
            } catch (error) {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const categoryData = monthlyReport?.categoryWise.map(cat => ({
        name: cat.category,
        value: cat.totalAmount
    })) || [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
                    <p className="text-sm font-medium text-gray-500 uppercase">Total Income</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">₹{(monthlyReport?.totalIncome || 0).toLocaleString()}</p>
                </div>

                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-indigo-500">
                    <p className="text-sm font-medium text-gray-500 uppercase">Total Expense</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">₹{(monthlyReport?.totalSpent || 0).toLocaleString()}</p>
                </div>

                <div className={`bg-white rounded-xl shadow p-6 border-l-4 ${budgetStatus?.isExceeded ? 'border-red-500' : 'border-teal-500'}`}>
                    <p className="text-sm font-medium text-gray-500 uppercase">Remaining Limit</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">₹{(budgetStatus?.remaining || 0).toLocaleString()}</p>
                    <p className="text-xs mt-1 text-gray-400">Limit: ₹{budgetStatus?.budget?.toLocaleString() || 'Not Set'}</p>
                </div>

                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
                    <p className="text-sm font-medium text-gray-500 uppercase">Balance</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">₹{(monthlyReport?.remainingBalance || 0).toLocaleString()}</p>
                    <p className="text-xs mt-1 text-gray-400">Income - Expense</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-xl shadow h-96">
                    <h3 className="text-lg font-semibold mb-4">Category Wise Spend (Current Month)</h3>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex bg-gray-50 items-center justify-center h-full rounded-lg text-gray-500">No expenses recorded this month</div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow h-96 flex flex-col justify-center">
                    <h3 className="text-lg font-semibold mb-2">Smart Insights</h3>
                    <div className="space-y-4 flex-1 mt-4">
                        <div className="p-4 bg-indigo-50 rounded-lg">
                            <p className="text-sm text-indigo-800 font-semibold mb-1">Top Category Pattern</p>
                            <p className="text-lg text-indigo-900">
                                {analysis?.spendingPattern?.topCategory || 'No data yet'}
                            </p>
                        </div>

                        <div className="p-4 bg-teal-50 rounded-lg">
                            <p className="text-sm text-teal-800 font-semibold mb-1">Predicted Next Month Spend</p>
                            <p className="text-lg text-teal-900">
                                {Number(analysis?.futureExpensePrediction) > 0
                                    ? `₹${Number(analysis.futureExpensePrediction).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                    : 'Add more data'}
                            </p>
                            <p className="text-xs text-teal-700 mt-1">Based on 3-month average</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
