import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { MdTrendingUp, MdCategory, MdPerson } from 'react-icons/md';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const GroupAnalytics = () => {
    const { selectedGroupId } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedGroupId) return;

        const fetchExpenses = async () => {
            try {
                const res = await api.get(`/group-expenses/${selectedGroupId}`);
                setExpenses(res.data);
            } catch (error) {
                toast.error("Failed to load group analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchExpenses();
    }, [selectedGroupId]);

    if (!selectedGroupId) {
        return <div className="p-8 text-center bg-white rounded-xl shadow mt-8">Please select a group first.</div>;
    }

    if (loading) return <div className="p-8">Loading analytics...</div>;

    // Derived Analytics Data
    const totalSpent = expenses.reduce((acc, exp) => acc + exp.amount, 0);

    // 1. Category wise spending
    const categoryMap = {};
    expenses.forEach(exp => {
        categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });
    const categoryData = Object.keys(categoryMap).map(key => ({
        name: key,
        value: categoryMap[key]
    })).sort((a, b) => b.value - a.value);

    // 2. Who paid how much (Paid By)
    const paidByMap = {};
    expenses.forEach(exp => {
        // Handle array of payers (new system)
        if (Array.isArray(exp.paidBy)) {
            exp.paidBy.forEach(payer => {
                const name = payer.name || 'Unknown';
                paidByMap[name] = (paidByMap[name] || 0) + payer.amount;
            });
        } else {
            // Backward compatibility for old single-payer records
            const name = exp.paidBy?.name || 'Unknown';
            paidByMap[name] = (paidByMap[name] || 0) + exp.amount;
        }
    });
    const paidByData = Object.keys(paidByMap).map(key => ({
        name: key,
        amount: paidByMap[key]
    })).sort((a, b) => b.amount - a.amount);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Group Analytics</h1>
            </div>

            {expenses.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-8 text-center border border-gray-100 mt-4">
                    <MdTrendingUp className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-800">No Data Available</h3>
                    <p className="text-gray-500 mt-2">Add some expenses to this group to see analytics.</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-indigo-500">
                            <p className="text-sm font-medium text-gray-500 uppercase">Total Group Spending</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">₹{totalSpent.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                            <p className="text-xs mt-1 text-gray-400">Total volume of expenses</p>
                        </div>

                        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-emerald-500">
                            <p className="text-sm font-medium text-gray-500 uppercase flex items-center"><MdPerson className="mr-1" /> Top Contributor</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{paidByData[0]?.name || 'N/A'}</p>
                            <p className="text-xs mt-1 text-gray-400">Paid ₹{(paidByData[0]?.amount || 0).toLocaleString()} overall</p>
                        </div>

                        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-amber-500">
                            <p className="text-sm font-medium text-gray-500 uppercase flex items-center"><MdCategory className="mr-1" /> Top Category</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{categoryData[0]?.name || 'N/A'}</p>
                            <p className="text-xs mt-1 text-gray-400">₹{(categoryData[0]?.value || 0).toLocaleString()} spent</p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* Category Pie Chart */}
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 h-96 flex flex-col">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Spending by Category</h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="99%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={110}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Paid By Bar Chart */}
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 h-96 flex flex-col">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Who Paid How Much</h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="99%" height={300}>
                                    <BarChart
                                        data={paidByData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                                        <Tooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount Paid']}
                                        />
                                        <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                            {paidByData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GroupAnalytics;
