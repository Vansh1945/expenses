import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { MdReceipt, MdCheckCircle, MdCancel, MdLink } from 'react-icons/md';

const CompanyExpenses = () => {
    const { user } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSubmit, setShowSubmit] = useState(false);

    const [formData, setFormData] = useState({
        projectId: '',
        amount: '',
        description: '',
        invoiceUrl: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expRes, projRes] = await Promise.all([
                api.get('/company-expenses'),
                api.get('/projects')
            ]);
            setExpenses(expRes.data);
            setProjects(projRes.data);
            if (projRes.data.length > 0) {
                setFormData(prev => ({ ...prev, projectId: projRes.data[0]._id }));
            }
        } catch (error) {
            toast.error('Failed to load company expenses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmitExpense = async (e) => {
        e.preventDefault();
        try {
            await api.post('/company-expenses', formData);
            toast.success('Expense Submitted for Approval');
            setShowSubmit(false);
            setFormData({ ...formData, amount: '', description: '', invoiceUrl: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error submitting expense');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/company-expenses/${id}/status`, { status });
            toast.success(`Expense ${status}`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || `Error updating status`);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Expenses...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow border-l-4 border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expense Approvals</h1>
                    <p className="text-sm text-gray-500">Submit and manage project expenditures</p>
                </div>
                <button onClick={() => setShowSubmit(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <MdReceipt className="mr-2" /> Submit Expense
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project / Desc</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.map((exp) => (
                            <tr key={exp._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(exp.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{exp.projectId?.name || 'Unknown Project'}</div>
                                    <div className="text-sm text-gray-500">{exp.description}</div>
                                    {exp.invoiceUrl && (
                                        <a href={exp.invoiceUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 flex items-center mt-1 hover:underline">
                                            <MdLink className="mr-1" /> View Invoice
                                        </a>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {exp.submittedBy?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    ${exp.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${exp.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            exp.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {exp.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {exp.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleUpdateStatus(exp._id, 'approved')} className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded" title="Approve">
                                                <MdCheckCircle size={20} />
                                            </button>
                                            <button onClick={() => handleUpdateStatus(exp._id, 'rejected')} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded" title="Reject">
                                                <MdCancel size={20} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    No company expenses found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Submit Expense Modal */}
            {showSubmit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Submit New Expense</h2>
                        <form onSubmit={handleSubmitExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Project</label>
                                <select required value={formData.projectId} onChange={e => setFormData({ ...formData, projectId: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md">
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} (Budget: ${p.budget})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount</label>
                                <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <input type="text" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Invoice URL (Optional)</label>
                                <input type="url" value={formData.invoiceUrl} onChange={e => setFormData({ ...formData, invoiceUrl: e.target.value })} placeholder="https://link-to-receipt.com" className="mt-1 block w-full px-3 py-2 border rounded-md text-sm" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setShowSubmit(false)} className="px-4 py-2 bg-gray-200 rounded text-gray-800">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyExpenses;
