import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { MdAdd, MdDelete, MdEdit, MdToggleOn, MdToggleOff, MdCategory } from 'react-icons/md';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', type: 'expense', isActive: true });
    const [editId, setEditId] = useState(null);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/admin/categories');
            setCategories(res.data);
        } catch (error) {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await api.delete(`/admin/categories/${id}`);
                toast.success('Category deleted');
                fetchCategories();
            } catch (error) {
                toast.error('Failed to delete category');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/admin/categories/${editId}`, formData);
                toast.success('Category updated successfully');
            } else {
                await api.post('/admin/categories', formData);
                toast.success('Category created successfully');
            }
            setShowModal(false);
            setEditId(null);
            setFormData({ name: '', type: 'expense', isActive: true });
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving category');
        }
    };

    const openEdit = (category) => {
        setFormData({ name: category.name, type: category.type, isActive: category.isActive });
        setEditId(category._id);
        setShowModal(true);
    };

    const handleToggleActive = async (category) => {
        try {
            await api.put(`/admin/categories/${category._id}`, {
                isActive: !category.isActive
            });
            toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'}`);
            fetchCategories();
        } catch (error) {
            toast.error('Failed to update category status');
        }
    };

    if (loading) return <div className="p-8">Loading categories...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
                <button
                    onClick={() => {
                        setEditId(null);
                        setFormData({ name: '', type: 'expense', isActive: true });
                        setShowModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <MdAdd className="mr-2" />
                    New Category
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => (
                    <div key={cat._id} className={`bg-white rounded-xl shadow p-6 border-l-4 transition-colors ${cat.isActive ? 'border-indigo-500' : 'border-gray-300 opacity-75'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center">
                                <MdCategory className={`w-8 h-8 mr-3 ${cat.isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                                <h3 className={`text-xl font-bold ${cat.isActive ? 'text-gray-900' : 'text-gray-500'}`}>{cat.name}</h3>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => openEdit(cat)} className="text-gray-400 hover:text-indigo-600">
                                    <MdEdit className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(cat._id)} className="text-gray-400 hover:text-red-600">
                                    <MdDelete className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-gray-500 capitalize font-medium px-3 py-1 bg-gray-100 rounded-full">
                                {cat.type}
                            </p>

                            <button
                                onClick={() => handleToggleActive(cat)}
                                className={`flex items-center text-sm font-semibold transition-colors ${cat.isActive ? 'text-green-600 hover:text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {cat.isActive ? 'Enabled' : 'Disabled'}
                                {cat.isActive ? <MdToggleOn className="w-7 h-7 ml-1" /> : <MdToggleOff className="w-7 h-7 ml-1" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-6">{editId ? 'Edit' : 'Create'} Category</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category Name</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div className="flex items-center mt-4">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                    Active (Users can select this)
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
