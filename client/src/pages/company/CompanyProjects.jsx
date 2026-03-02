import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { MdAdd, MdWork, MdDonutLarge } from 'react-icons/md';

const CompanyProjects = () => {
    const { user } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        budget: '',
        startDate: '',
        endDate: ''
    });

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (error) {
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', formData);
            toast.success('Project Created!');
            setShowCreate(false);
            setFormData({ name: '', budget: '', startDate: '', endDate: '' });
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creating project');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Projects...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow border-l-4 border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
                    <p className="text-sm text-gray-500">Allocate budgets and track active spending</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <MdAdd className="mr-2" /> New Project
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => {
                    const pctSpent = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
                    const isOverBudget = pctSpent >= 100;
                    const isWarning = pctSpent >= 80 && !isOverBudget;

                    return (
                        <div key={project._id} className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mr-3">
                                            <MdWork size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{project.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded capitalize ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{project.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Budget:</span>
                                        <span className="font-semibold">${project.budget.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Spent:</span>
                                        <span className={`font-semibold ${isOverBudget ? 'text-red-600' : isWarning ? 'text-orange-500' : 'text-gray-900'}`}>${project.spent.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 dark:bg-gray-700">
                                    <div className={`h-2.5 rounded-full ${isOverBudget ? 'bg-red-600' : isWarning ? 'bg-orange-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(pctSpent, 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{pctSpent.toFixed(1)}% used</span>
                                    <span>${(project.budget - project.spent).toLocaleString()} remaining</span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {projects.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-gray-300">
                        <MdDonutLarge className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No Projects Found</h3>
                        <p className="text-gray-500 mt-1">Get started by building out your first project budget.</p>
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create New Project</h2>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Total Budget</label>
                                <input type="number" required value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                    <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                                    <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md text-sm" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 rounded text-gray-800">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700">Launch Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyProjects;
