import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MdAdminPanelSettings, MdPeople, MdAttachMoney } from 'react-icons/md';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);

    if (user?.role !== 'admin') {
        return <div className="p-8 text-center text-red-500 font-bold text-xl h-full flex items-center justify-center">403 - Forbidden. Admin area only.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center pb-4 border-b border-gray-200">
                <MdAdminPanelSettings className="text-indigo-600 w-10 h-10 mr-4" />
                <h1 className="text-3xl font-bold text-gray-900">Platform Administration</h1>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-indigo-900 mb-2">Welcome to the Admin Interface</h2>
                <p className="text-indigo-700">
                    Note: Full admin APIs (Total Users metric, overall revenue tracking, cross-user inspection)
                    were not explicitly requested in the backend architecture task, but this UI serves as the
                    entry point for those exclusive features.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Mock Metric Cards for visual completeness */}
                <div className="bg-white p-6 rounded-xl shadow flex items-center justify-between border-l-4 border-emerald-500">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Registered Users</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">1,248</p>
                    </div>
                    <MdPeople className="w-12 h-12 text-emerald-200" />
                </div>

                <div className="bg-white p-6 rounded-xl shadow flex items-center justify-between border-l-4 border-blue-500">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Platform Total Volume</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">₹2.4M</p>
                    </div>
                    <MdAttachMoney className="w-12 h-12 text-blue-200" />
                </div>

            </div>

            <div className="bg-white shadow rounded-lg p-6 mt-8">
                <h3 className="text-lg font-bold mb-4">User Management (Preview)</h3>
                <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Mock Data */}
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Jane Doe</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">jane@example.com</td>
                            <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">family</span></td>
                            <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
