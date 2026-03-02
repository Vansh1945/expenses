import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { AuthContext } from '../context/AuthContext';

const Expenses = () => {
    const { user } = useContext(AuthContext);
    const isRoommate = user?.role === 'roommate';

    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Roommate: available groups for selection
    const [myGroups, setMyGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');

    const today = new Date();
    const [filterMonth, setFilterMonth] = useState(today.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(today.getFullYear());

    const defaultForm = { amount: '', category: '', note: '', date: '', paymentMethod: 'cash', recurring: false };
    const [formData, setFormData] = useState(defaultForm);
    const [filterCategory, setFilterCategory] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expRes, catRes] = await Promise.all([
                api.get(`/expenses?month=${filterMonth}&year=${filterYear}${filterCategory ? `&category=${filterCategory}` : ''}`),
                api.get('/categories')
            ]);
            setExpenses(expRes.data);
            const expCats = catRes.data.filter(c => c.type === 'expense');
            setCategories(expCats);
            if (!formData.category && expCats.length > 0) {
                setFormData(prev => ({ ...prev, category: expCats[0].name }));
            }
        } catch (error) {
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterMonth, filterYear]);

    // Fetch roommate's groups on mount
    useEffect(() => {
        if (isRoommate) {
            api.get('/groups').then(res => {
                setMyGroups(res.data);
                if (res.data.length > 0) setSelectedGroupId(res.data[0]._id);
            }).catch(() => { });
        }
    }, [isRoommate]);

    const openAdd = () => {
        setEditingId(null);
        setFormData({ amount: '', category: categories[0]?.name || '', note: '', date: '', paymentMethod: 'cash', recurring: false });
        setShowModal(true);
    };

    const openEdit = (expense) => {
        setEditingId(expense._id);
        setFormData({
            amount: expense.amount,
            category: expense.category,
            note: expense.note || '',
            date: expense.date ? expense.date.substring(0, 10) : '',
            paymentMethod: expense.paymentMethod || 'cash',
            recurring: expense.recurring || false,
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Edit always goes to personal expense endpoint
                await api.put(`/expenses/${editingId}`, formData);
                toast.success('Expense updated');
            } else if (isRoommate && selectedGroupId) {
                // Roommate: add as a GROUP expense with equal split
                await api.post(`/groups/${selectedGroupId}/expenses`, {
                    description: formData.note || formData.category,
                    category: formData.category,
                    amount: Number(formData.amount),
                    paidBy: user._id,
                    splitType: 'equal',
                    date: formData.date || new Date().toISOString(),
                });
                toast.success('Expense added to your room! Split equally among all members.');
            } else {
                await api.post('/expenses', formData);
                toast.success('Expense added');
            }
            setShowModal(false);
            setEditingId(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving expense');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            setExpenses(prev => prev.filter(e => e._id !== id));
            toast.success('Expense deleted');
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    const handleDescriptionChange = (e) => {
        const desc = e.target.value;
        const lower = desc.toLowerCase();
        const keywords = {
            uber: 'Transport', lyft: 'Transport', flight: 'Transport', bus: 'Transport', train: 'Transport', metro: 'Transport',
            starbucks: 'Food', mcdonalds: 'Food', dinner: 'Food', lunch: 'Food', breakfast: 'Food',
            grocery: 'Food', swiggy: 'Food', zomato: 'Food', restaurant: 'Food',
            rent: 'Utilities', electricity: 'Utilities', water: 'Utilities', internet: 'Utilities', wifi: 'Utilities',
            movie: 'Entertainment', netflix: 'Entertainment', spotify: 'Entertainment', game: 'Entertainment', ott: 'Entertainment',
            amazon: 'Shopping', flipkart: 'Shopping', clothes: 'Shopping', shoes: 'Shopping', myntra: 'Shopping'
        };
        let suggested = formData.category;
        for (const [key, cat] of Object.entries(keywords)) {
            if (lower.includes(key)) {
                const match = categories.find(c => c.name.toLowerCase() === cat.toLowerCase());
                suggested = match ? match.name : cat;
                break;
            }
        }
        setFormData(prev => ({ ...prev, note: desc, category: suggested }));
    };

    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

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
                <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
                <div className="flex gap-3 items-center flex-wrap">
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
                    <select
                        value={filterCategory}
                        onChange={e => { setFilterCategory(e.target.value); }}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                    <button
                        onClick={openAdd}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <MdAdd className="mr-2" /> Add Expense
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                    <p className="text-sm text-red-700 font-medium uppercase tracking-wide">
                        Total Expenses — {MONTHS[filterMonth - 1]} {filterYear}
                    </p>
                    <p className="text-3xl font-bold text-red-800 mt-1">₹{totalExpense.toLocaleString()}</p>
                </div>
                <p className="text-red-600 text-sm">{expenses.length} entries</p>
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.map(expense => (
                                <tr key={expense._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(expense.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {expense.note || <span className="text-gray-300 italic">—</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {expense.category}
                                        </span>
                                        {expense.recurring && (
                                            <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-700">🔁 Recurring</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                        {expense.paymentMethod || 'cash'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-700">
                                        ₹{Number(expense.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openEdit(expense)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                            <MdEdit className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(expense._id)} className="text-red-600 hover:text-red-900">
                                            <MdDelete className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                                        No expenses for {MONTHS[filterMonth - 1]} {filterYear}. Click "Add Expense" to record.
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
                    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md max-h-screen overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Expense' : 'Record New Expense'}</h2>

                        {/* Roommate: show banner + group selector */}
                        {isRoommate && !editingId && (
                            <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                <p className="text-sm font-semibold text-teal-700 mb-2">🏠 Adding to Room (equal split)</p>
                                {myGroups.length > 0 ? (
                                    <select
                                        value={selectedGroupId}
                                        onChange={e => setSelectedGroupId(e.target.value)}
                                        className="block w-full px-3 py-2 border border-teal-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500"
                                    >
                                        {myGroups.map(g => (
                                            <option key={g._id} value={g._id}>{g.name} ({g.inviteCode})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-xs text-red-500">⚠ No rooms found. Create or join a room first from My Rooms page.</p>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                                <input
                                    type="number" step="0.01" required min="0"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">Card</option>
                                    <option value="netbanking">Net Banking</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Note <span className="text-gray-400 text-xs">(optional)</span></label>
                                <input
                                    type="text"
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Any extra detail…"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={formData.recurring}
                                    onChange={e => setFormData({ ...formData, recurring: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                                    🔁 Mark as Recurring (auto-repeats next month)
                                </label>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingId(null); }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                    {editingId ? 'Update Expense' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


export default Expenses;
