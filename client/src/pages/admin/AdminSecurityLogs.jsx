import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { MdSecurity, MdWarning, MdCheckCircle, MdBlock, MdVpnKey, MdSwapHoriz } from 'react-icons/md';

const AdminSecurityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/security/logs');
            setLogs(data);
        } catch (error) {
            toast.error('Failed to load security logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Security Audit Trail...</div>;

    const getActionBadge = (actionType) => {
        switch (actionType) {
            case 'successful_login':
                return <span className="flex items-center text-green-700 bg-green-100 px-2.5 py-1 rounded-full text-xs font-semibold"><MdCheckCircle className="mr-1" /> Login Success</span>;
            case 'failed_login':
                return <span className="flex items-center text-red-700 bg-red-100 px-2.5 py-1 rounded-full text-xs font-semibold"><MdWarning className="mr-1" /> Login Failed</span>;
            case 'account_blocked':
                return <span className="flex items-center text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full text-xs font-semibold"><MdBlock className="mr-1" /> Blocked</span>;
            case 'account_unblocked':
                return <span className="flex items-center text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full text-xs font-semibold"><MdCheckCircle className="mr-1" /> Unblocked</span>;
            case 'password_reset':
                return <span className="flex items-center text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full text-xs font-semibold"><MdVpnKey className="mr-1" /> Pwd Reset</span>;
            case 'role_change':
                return <span className="flex items-center text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full text-xs font-semibold"><MdSwapHoriz className="mr-1" /> Role Changed</span>;
            default:
                return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{actionType}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center bg-white p-6 rounded-xl shadow border-l-4 border-indigo-600">
                <MdSecurity className="w-8 h-8 text-indigo-600 mr-4" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Security Audit Logs</h1>
                    <p className="text-sm text-gray-500">Monitor system access, failing authentications, and administrative overrides.</p>
                </div>
            </div>

            <div className="bg-white shadow rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Identity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getActionBadge(log.actionType)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900">{log.userId?.name || 'Unknown / Deleted'}</div>
                                    <div className="text-sm text-slate-500 font-mono">{log.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                    {log.ipAddress || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700 max-w-sm overflow-hidden text-ellipsis">
                                    {log.description}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No security events logged yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSecurityLogs;
