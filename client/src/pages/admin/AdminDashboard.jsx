import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { MdAdminPanelSettings, MdPeople, MdAttachMoney } from 'react-icons/md';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [advancedStats, setAdvancedStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [basicRes, advRes] = await Promise.all([
                    api.get('/admin/dashboard'),
                    api.get('/admin/analytics/overview')
                ]);
                setStats(basicRes.data);
                setAdvancedStats(advRes.data);
            } catch (error) {
                toast.error('Failed to load admin stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8">Loading admin dashboard...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center pb-4 border-b border-gray-200">
                <MdAdminPanelSettings className="text-indigo-600 w-10 h-10 mr-4" />
                <h1 className="text-3xl font-bold text-gray-900">Platform Administration</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-emerald-500">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                        <MdPeople className="w-8 h-8 text-emerald-200" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Daily Active</p>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-3xl font-bold text-gray-900">{advancedStats?.dailyActiveUsers || 0}</p>
                        <MdAdminPanelSettings className="w-8 h-8 text-blue-200" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Transactions</p>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-3xl font-bold text-gray-900">{advancedStats?.totalExpensesCount || 0}</p>
                        <MdAttachMoney className="w-8 h-8 text-purple-200" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-orange-500">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">System Economy</p>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-2xl font-bold text-gray-900">${advancedStats?.totalTransactionAmount?.toLocaleString() || 0}</p>
                        <MdAttachMoney className="w-8 h-8 text-orange-200" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
                {/* Graph Section */}
                <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold mb-4">Platform Usage & Flow</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="99%" height={250}>
                            <AreaChart data={stats?.usageGraph || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => `₹${value}`} />
                                <Area type="monotone" dataKey="amount" stroke="#4f46e5" fillOpacity={1} fill="url(#colorAmount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4">Recent Users</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Identity</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stats?.recentUsers?.map(u => (
                                    <tr key={u._id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {u.name}
                                            <div className="text-xs text-indigo-500">{u.role}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Categories Table */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4">Top Categories</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Uses</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {advancedStats?.topCategories?.map(cat => (
                                    <tr key={cat.name}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                            {cat.name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {cat.count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
