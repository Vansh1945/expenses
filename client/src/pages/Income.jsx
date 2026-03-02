import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';

const Income = () => {
    const [incomes, setIncomes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const today = new Date();
    const [filterMonth, setFilterMonth] = useState(today.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(today.getFullYear());

    const defaultForm = { amount: '', category: '', description: '', date: '' };
    const [formData, setFormData] = useState(defaultForm);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [incRes, catRes] = await Promise.all([
                api.get(`/incomes?month=${filterMonth}&year=${filterYear}`),
                api.get('/categories')
            ]);
            setIncomes(incRes.data);
            const incomeCats = catRes.data.filter(c => c.type === 'income');
            setCategories(incomeCats);
            if (!formData.category && incomeCats.length > 0) {
                setFormData(prev => ({ ...prev, category: incomeCats[0].name }));
            }
        } catch (error) {
            toast.error('Failed to load income data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterMonth, filterYear]);

    const openAdd = () => {
        setEditingId(null);
        setFormData({ amount: '', category: categories[0]?.name || 'Salary', description: '', date: '' });
        setShowModal(true);
    };

    const openEdit = (income) => {
        setEditingId(income._id);
        setFormData({
            amount: income.amount,
            category: income.category,
            description: income.description,
            date: income.date ? income.date.substring(0, 10) : ''
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/incomes/${editingId}`, formData);
                toast.success('Income updated successfully');
            } else {
                await api.post('/incomes', formData);
                toast.success('Income added successfully');
            }
            setShowModal(false);
            setEditingId(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving income');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this income entry?')) return;
        try {
            await api.delete(`/incomes/${id}`);
            setIncomes(prev => prev.filter(i => i._id !== id));
            toast.success('Income deleted');
        } catch (error) {
            toast.error('Failed to delete income');
        }
    };

    const handleDescriptionChange = (e) => {
        const desc = e.target.value;
        const lower = desc.toLowerCase();
        const keywords = {
            salary: 'Salary', paycheck: 'Salary', bonus: 'Salary',
            freelance: 'Freelance', contract: 'Freelance', upwork: 'Freelance', fiverr: 'Freelance',
            dividend: 'Investments', stock: 'Investments', interest: 'Investments',
            gift: 'Gift', refund: 'Other', cashback: 'Other', sold: 'Other'
        };
        let suggested = formData.category;
        for (const [key, cat] of Object.entries(keywords)) {
            if (lower.includes(key)) {
                const match = categories.find(c => c.name.toLowerCase() === cat.toLowerCase());
                suggested = match ? match.name : cat;
                break;
            }
        }
        setFormData(prev => ({ ...prev, description: desc, category: suggested }));
    };

    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (loading) return (
        <div className="p-8">
            <div className="animate-pulse h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Income Log</h1>
                <div className="flex gap-3 items-center flex-wrap">
                    {/* Month / Year filter */}
                    <select
                        value={filterMonth}
                        onChange={e => setFilterMonth(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <select
                        value={filterYear}
                        onChange={e => setFilterYear(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        {[0, 1, 2].map(o => {
                            const y = today.getFullYear() - o;
                            return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>
                    <button
                        onClick={openAdd}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        <MdAdd className="mr-2" /> Record Income
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                    <p className="text-sm text-green-700 font-medium uppercase tracking-wide">
                        Total Income — {MONTHS[filterMonth - 1]} {filterYear}
                    </p>
                    <p className="text-3xl font-bold text-green-800 mt-1">₹{totalIncome.toLocaleString()}</p>
                </div>
                <p className="text-green-600 text-sm">{incomes.length} entries</p>
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source / Desc</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {incomes.map(income => (
                                <tr key={income._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(income.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{income.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {income.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                                        ₹{Number(income.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openEdit(income)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                            <MdEdit className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(income._id)} className="text-red-600 hover:text-red-900">
                                            <MdDelete className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {incomes.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                        No income entries for {MONTHS[filterMonth - 1]} {filterYear}. Click "Record Income" to add.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Income' : 'Log New Income'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                                <input
                                    type="number" step="0.01" min="0" required
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Source / Description</label>
                                <input
                                    type="text" required
                                    value={formData.description}
                                    onChange={handleDescriptionChange}
                                    placeholder="e.g. Monthly Salary from Acme Corp"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                >
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingId(null); }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                    {editingId ? 'Update Income' : 'Add Income'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Income;
