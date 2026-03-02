import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { MdBusiness, MdShowChart, MdAccountBalanceWallet, MdReceipt } from 'react-icons/md';

const CompanyDashboard = () => {
    const { user } = useContext(AuthContext);
    const [company, setCompany] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Setup Form
    const [showSetup, setShowSetup] = useState(false);
    const [formData, setFormData] = useState({ name: '', industry: '', description: '' });

    useEffect(() => {
        const initData = async () => {
            try {
                // Try fetching the company
                const res = await api.get('/company');
                setCompany(res.data);

                // If company exists, fetch projects
                if (res.data) {
                    const projRes = await api.get('/projects');
                    setProjects(projRes.data);
                }
            } catch (error) {
                // 404 means they haven't set up the company yet
                if (error.response?.status === 404) {
                    setShowSetup(true);
                } else {
                    toast.error('Failed to load business workspace');
                }
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, []);

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/company', formData);
            setCompany(res.data);
            setShowSetup(false);
            toast.success('Company profile created!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creating company profile');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Business Workspace...</div>;

    if (showSetup) {
        return (
            <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg mt-10 border-t-4 border-indigo-600">
                <div className="text-center mb-6">
                    <MdBusiness className="mx-auto h-12 w-12 text-indigo-500 mb-2" />
                    <h2 className="text-2xl font-bold text-gray-800">Welcome to Expense Business!</h2>
                    <p className="text-gray-500 mt-2">Let's set up your primary company workspace.</p>
                </div>

                <form onSubmit={handleCreateCompany} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Industry</label>
                        <input type="text" value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Short Description</label>
                        <textarea rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md"></textarea>
                    </div>
                    <button type="submit" className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">Complete Registration</button>
                </form>
            </div>
        )
    }

    // Dashboard View Once Company is Registered
    const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
    const totalSpent = projects.reduce((acc, p) => acc + p.spent, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow border-l-4 border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{company?.name}</h1>
                    <p className="text-sm text-gray-500">{company?.industry} | Enterprise Workspace</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium">
                    {projects.length} Active Projects
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow">
                    <div className="flex items-center text-gray-500 mb-2">
                        <MdAccountBalanceWallet className="w-5 h-5 mr-2" />
                        <h3 className="text-sm font-medium uppercase tracking-wider">Total Project Budgets</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <div className="flex items-center text-gray-500 mb-2">
                        <MdReceipt className="w-5 h-5 mr-2" />
                        <h3 className="text-sm font-medium uppercase tracking-wider">Total Approved Spend</h3>
                    </div>
                    <p className="text-3xl font-bold text-red-600">${totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <div className="flex items-center text-gray-500 mb-2">
                        <MdShowChart className="w-5 h-5 mr-2" />
                        <h3 className="text-sm font-medium uppercase tracking-wider">Net Remaining</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-600">${(totalBudget - totalSpent).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default CompanyDashboard;
