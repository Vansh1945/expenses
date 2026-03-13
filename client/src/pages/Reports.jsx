import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { MdDownload } from 'react-icons/md';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Reports = () => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [monthlyData, setMonthlyData] = useState(null);
    const [yearlyData, setYearlyData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const [monthRes, yearRes] = await Promise.all([
                api.get(`/reports/monthly?month=${selectedMonth}&year=${selectedYear}`),
                api.get(`/reports/yearly?year=${selectedYear}`)
            ]);
            setMonthlyData(monthRes.data);
            setYearlyData(yearRes.data);
        } catch (error) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth, selectedYear]);

    const exportCSV = () => {
        if (!yearlyData?.monthlyBreakdown) return;
        const headers = ['Month', 'Total Amount (₹)', 'Transaction Count'];
        const rows = yearlyData.monthlyBreakdown.map(item => [
            MONTHS[item.month - 1] || item.month,
            item.totalAmount,
            item.count
        ]);
        let csvContent = 'data:text/csv;charset=utf-8,'
            + headers.join(',') + '\n'
            + rows.map(r => r.join(',')).join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `Expentra_Report_${MONTHS[selectedMonth - 1]}_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPDF = () => {
        const element = document.getElementById('report-content');
        const opt = {
            margin: 1,
            filename: `Expentra_Report_${selectedYear}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };
        import('html2pdf.js').then(html2pdf => {
            html2pdf.default().from(element).set(opt).save();
        }).catch(() => toast.error('PDF export failed to load'));
    };

    // Calculate derived values
    const totalIncome = monthlyData?.totalIncome || 0;
    const totalSpent = monthlyData?.totalSpent || 0;
    const remainingBalance = totalIncome - totalSpent;

    const categoryData = (monthlyData?.categoryWise || []).map(cat => ({
        name: cat.category,
        value: cat.totalAmount,
        percentage: totalSpent > 0 ? ((cat.totalAmount / totalSpent) * 100).toFixed(1) : 0
    }));

    if (loading && !monthlyData) return (
        <div className="p-8 flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6" id="report-content">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4" data-html2canvas-ignore>
                <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                <div className="flex gap-3 items-center flex-wrap">
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        {[0, 1, 2].map(o => {
                            const y = today.getFullYear() - o;
                            return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>
                    <button onClick={exportPDF} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                        <MdDownload className="mr-1" /> PDF
                    </button>
                    <button onClick={exportCSV} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                        <MdDownload className="mr-1" /> CSV
                    </button>
                </div>
            </div>

            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Income</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">₹{totalIncome.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Expense</p>
                    <p className="text-3xl font-bold text-red-700 mt-2">₹{totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                </div>
                <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${remainingBalance >= 0 ? 'border-purple-500' : 'border-orange-500'}`}>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Remaining Balance</p>
                    <p className={`text-3xl font-bold mt-2 ${remainingBalance >= 0 ? 'text-purple-700' : 'text-orange-700'}`}>
                        ₹{remainingBalance.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Income - Expense</p>
                </div>
            </div>

            {/* Budget warning */}
            {totalSpent > 0 && totalIncome > 0 && totalSpent > totalIncome && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <p className="text-red-800 font-bold">⚠️ You are spending more than your income this month!</p>
                    <p className="text-red-600 text-sm mt-1">
                        Overspent by ₹{(totalSpent - totalIncome).toLocaleString()}
                    </p>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category-wise Pie */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Category-wise Breakdown</h3>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="99%" height={280}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    dataKey="value"
                                    label={({ name, percentage }) => `${name} ${percentage}%`}
                                    labelLine={false}
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={value => `₹${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-48 items-center justify-center text-gray-400 bg-gray-50 rounded">
                            No expenses recorded for this month
                        </div>
                    )}
                </div>

                {/* Yearly trend line */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Spending Trend ({selectedYear})</h3>
                    {yearlyData?.monthlyBreakdown?.length > 0 ? (
                        <ResponsiveContainer width="99%" height={280}>
                            <LineChart data={yearlyData.monthlyBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tickFormatter={val => MONTHS[val - 1] || val} />
                                <YAxis />
                                <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                                <Line type="monotone" dataKey="totalAmount" name="Spend (₹)" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-48 items-center justify-center text-gray-400 bg-gray-50 rounded">
                            No yearly data available
                        </div>
                    )}
                </div>
            </div>

            {/* Category-wise Table */}
            {categoryData.length > 0 && (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-700">Category Analysis</h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categoryData.map((cat, i) => (
                                <tr key={cat.name} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                        {cat.name}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">₹{Number(cat.value).toLocaleString()}</td>
                                    <td className="px-6 py-3 text-sm text-right text-gray-500">{cat.percentage}%</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-bold">
                                <td className="px-6 py-3 text-sm text-gray-900">Total</td>
                                <td className="px-6 py-3 text-sm text-right text-gray-900">₹{totalSpent.toLocaleString()}</td>
                                <td className="px-6 py-3 text-sm text-right text-gray-500">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Reports;
