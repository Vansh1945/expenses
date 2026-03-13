import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { MdInsertChartOutlined, MdTrendingUp, MdTrendingDown } from 'react-icons/md';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CompanyReports = () => {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const [projRes, expRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/company-expenses')
                ]);
                setProjects(projRes.data);
                setExpenses(expRes.data);
            } catch (error) {
                toast.error('Failed to load company report data');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    // Calculate metrics
    const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
    const totalSpentInProjects = projects.reduce((acc, p) => acc + p.spent, 0);
    const remainingBudget = totalBudget - totalSpentInProjects;

    const approvedExpenses = expenses.filter(e => e.status === 'Approved').reduce((acc, e) => acc + e.amount, 0);
    const pendingExpenses = expenses.filter(e => e.status === 'Pending').reduce((acc, e) => acc + e.amount, 0);
    const rejectedExpenses = expenses.filter(e => e.status === 'Rejected').reduce((acc, e) => acc + e.amount, 0);

    // Chart Data
    const projectData = projects.map(p => ({
        name: p.name,
        budget: p.budget,
        spent: p.spent
    }));

    const expenseStatusData = [
        { name: 'Approved', value: approvedExpenses },
        { name: 'Pending', value: pendingExpenses },
        { name: 'Rejected', value: rejectedExpenses }
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900 border-b pb-4 border-gray-200">Financial Reports</h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-500 uppercase">Total Allocated Budget</p>
                        <MdInsertChartOutlined className="text-indigo-400 w-6 h-6" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">₹{totalBudget.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-500 uppercase">Total Project Spend</p>
                        <MdTrendingUp className="text-green-400 w-6 h-6" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">₹{totalSpentInProjects.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Remaining: ₹{remainingBudget.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-500 uppercase">Pending Approvals</p>
                        <MdTrendingDown className="text-amber-400 w-6 h-6" />
                    </div>
                    <p className="text-3xl font-bold text-amber-600">₹{pendingExpenses.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">From Employee Submissions</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Project Budget vs Spend */}
                <div className="bg-white p-6 rounded-xl shadow-sm h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Project Budget vs Spend</h3>
                    {projectData.length > 0 ? (
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="99%" height={300}>
                                <BarChart data={projectData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} cursor={{ fill: 'transparent' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="budget" name="Allocated Budget" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="spent" name="Actual Spend" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex bg-gray-50 items-center justify-center rounded-lg text-gray-500 border border-dashed border-gray-200">No active projects found</div>
                    )}
                </div>

                {/* Expense Status Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Expense Request Status</h3>
                    {expenseStatusData.length > 0 ? (
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="99%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={expenseStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {expenseStatusData.map((entry, index) => {
                                            let cellColor = COLORS[index % COLORS.length];
                                            if (entry.name === 'Approved') cellColor = '#10b981'; // Green
                                            if (entry.name === 'Pending') cellColor = '#f59e0b'; // Amber
                                            if (entry.name === 'Rejected') cellColor = '#ef4444'; // Red
                                            return <Cell key={`cell-${index}`} fill={cellColor} />;
                                        })}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex bg-gray-50 items-center justify-center rounded-lg text-gray-500 border border-dashed border-gray-200">No expense requests found</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyReports;
