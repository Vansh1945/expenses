import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { MdDelete, MdBlock, MdCheckCircle, MdList, MdEdit } from 'react-icons/md';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Expense Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [userExpenses, setUserExpenses] = useState([]);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [loadingExpenses, setLoadingExpenses] = useState(false);

    // Edit User Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: '', name: '', email: '', role: '', password: '', status: '' });
    const [savingUser, setSavingUser] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditClick = (user) => {
        setEditFormData({ id: user._id, name: user.name, email: user.email, role: user.role, password: '', status: user.status || (user.isBlocked ? 'blocked' : 'active') });
        setShowEditModal(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSavingUser(true);
        try {
            const payload = {
                name: editFormData.name,
                email: editFormData.email,
                role: editFormData.role,
                status: editFormData.status
            };
            if (editFormData.password.trim() !== '') {
                payload.password = editFormData.password;
            }
            await api.put(`/admin/users/${editFormData.id}`, payload);
            toast.success('User details updated');
            setShowEditModal(false);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user');
        } finally {
            setSavingUser(false);
        }
    };

    const handleToggleBlock = async (user) => {
        try {
            const newStatus = user.status === 'blocked' || user.isBlocked ? 'active' : 'blocked';
            await api.put(`/admin/users/${user._id}`, { status: newStatus });
            toast.success(`User ${!user.isBlocked ? 'blocked' : 'unblocked'} successfully`);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to permanently delete this user and all their expenses?')) {
            try {
                await api.delete(`/admin/users/${id}`);
                toast.success('User deleted successfully');
                fetchUsers();
            } catch (error) {
                toast.error('Failed to delete user');
            }
        }
    };

    const handleViewExpenses = async (user) => {
        setSelectedUser(user);
        setShowExpenseModal(true);
        setLoadingExpenses(true);
        try {
            const res = await api.get(`/admin/users/${user._id}/expenses`);
            setUserExpenses(res.data);
        } catch (error) {
            toast.error('Failed to load user expenses');
        } finally {
            setLoadingExpenses(false);
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (window.confirm('Delete this user expense permanently?')) {
            try {
                await api.delete(`/admin/users/${selectedUser._id}/expenses/${expenseId}`);
                toast.success('Expense deleted');
                setUserExpenses(userExpenses.filter(e => e._id !== expenseId));
            } catch (error) {
                toast.error('Failed to delete expense');
            }
        }
    };

    if (loading) return <div className="p-8">Loading users...</div>;

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {(user.status === 'blocked' || user.isBlocked) ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Blocked</span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEditClick(user)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                            title="Edit User Details"
                                        >
                                            <MdEdit className="w-5 h-5 inline-block" />
                                        </button>
                                        <button
                                            onClick={() => handleViewExpenses(user)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            title="View User Expenses"
                                        >
                                            <MdList className="w-5 h-5 inline-block" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleBlock(user)}
                                            className={`${user.status === 'blocked' || user.isBlocked ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'} mr-4`}
                                            title={user.status === 'blocked' || user.isBlocked ? "Unblock User" : "Block User"}
                                        >
                                            {user.status === 'blocked' || user.isBlocked ? <MdCheckCircle className="w-5 h-5 inline-block" /> : <MdBlock className="w-5 h-5 inline-block" />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user._id)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete User"
                                        >
                                            <MdDelete className="w-5 h-5 inline-block" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expenses Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Expenses for {selectedUser?.name}</h2>
                            <button onClick={() => setShowExpenseModal(false)} className="text-gray-500 hover:text-gray-800 font-bold text-xl">&times;</button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            {loadingExpenses ? (
                                <p>Loading expenses...</p>
                            ) : userExpenses.length === 0 ? (
                                <p className="text-gray-500">No expenses found for this user.</p>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Desc</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {userExpenses.map(exp => (
                                            <tr key={exp._id}>
                                                <td className="px-4 py-2 text-sm text-gray-500">{new Date(exp.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{exp.category}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500 truncate max-w-[150px]">{exp.description}</td>
                                                <td className="px-4 py-2 text-sm font-bold text-gray-900">${exp.amount}</td>
                                                <td className="px-4 py-2 text-right text-sm">
                                                    <button onClick={() => handleDeleteExpense(exp._id)} className="text-red-600 hover:text-red-900" title="Delete Expense">
                                                        <MdDelete className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Edit User Details</h2>
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input required type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="mt-1 block w-full border rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input required type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="mt-1 block w-full border rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })} className="mt-1 block w-full border rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="personal">Personal</option>
                                        <option value="company">Company</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Account Status</label>
                                    <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })} className="mt-1 block w-full border rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="active">Active</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 mt-4">
                                <label className="block text-sm font-medium text-red-700">Force Password Reset</label>
                                <input type="text" placeholder="Leave blank to skip" value={editFormData.password} onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })} className="mt-1 block w-full border border-red-200 rounded-md p-2 focus:ring-red-500 focus:border-red-500" />
                                <p className="text-xs text-gray-500 mt-1">If provided, the user's password will immediately be overwritten.</p>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                                <button type="submit" disabled={savingUser} className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                                    {savingUser ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
