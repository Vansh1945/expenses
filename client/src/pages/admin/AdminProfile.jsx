import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { MdAdminPanelSettings, MdSecurity } from 'react-icons/md';

const AdminProfile = () => {
    const { user } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const body = { name, email };
            if (password) body.password = password;

            await api.put('/auth/profile', body);
            toast.success('Admin profile updated successfully');
            setPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center pb-4 border-b border-gray-200">
                <MdAdminPanelSettings className="text-indigo-600 w-8 h-8 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Profile Settings</h1>
            </div>

            <div className="bg-white p-8 rounded-xl shadow mt-6 border-t-4 border-indigo-600">
                <div className="flex items-center mb-6">
                    <MdSecurity className="text-gray-400 w-12 h-12 mr-4" />
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Security & Credentials</h2>
                        <p className="text-sm text-gray-500">Update your primary administrative contact and password.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-md"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition"
                    >
                        {loading ? 'Saving Changes...' : 'Update Settings'}
                    </button>
                </form>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-6">
                <h3 className="text-md font-bold text-gray-700 mb-4">System Login Activity</h3>
                <div className="overflow-y-auto max-h-60 bg-white border rounded">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Date & Time</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(user?.loginActivity || []).slice().reverse().map((log, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 text-gray-600">{new Date(log.date).toLocaleString()}</td>
                                    <td className="px-4 py-2 font-mono text-gray-500">{log.ip || 'Unknown'}</td>
                                </tr>
                            ))}
                            {(!user?.loginActivity || user.loginActivity.length === 0) && (
                                <tr><td colSpan="2" className="px-4 py-4 text-center text-gray-400">No recent activity logged.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
