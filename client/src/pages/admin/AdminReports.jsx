import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { MdDownload } from 'react-icons/md';

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');

    useEffect(() => {
        // Load users to populate the filter dropdown
        api.get('/admin/users').then(res => setUsers(res.data)).catch(err => console.error(err));
    }, []);

    const fetchReports = async (e) => {
        if (e) e.preventDefault();
        try {
            setLoading(true);
            let query = '';
            if (startDate && endDate) query += `?startDate=${startDate}&endDate=${endDate}`;
            if (selectedUser) {
                query += query ? `&userId=${selectedUser}` : `?userId=${selectedUser}`;
            }

            const res = await api.get(`/admin/reports${query}`);
            setReports(res.data);
            if (res.data.length === 0) toast.info('No records found for these filters');
        } catch (error) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = () => {
        const element = document.getElementById('admin-report-content');
        const opt = {
            margin: 1,
            filename: `Admin_System_Report.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };
        import('html2pdf.js').then(html2pdf => {
            html2pdf.default().from(element).set(opt).save();
        }).catch(err => toast.error('PDF export failed to load'));
    };

    const exportCSV = () => {
        if (!reports.length) return;

        const headers = ['Date', 'User Name', 'User Email', 'Category', 'Amount (₹)', 'Description'];
        const rows = reports.map(item => [
            new Date(item.date).toLocaleDateString(),
            item.userId?.name || 'Unknown',
            item.userId?.email || 'Unknown',
            item.category,
            item.amount,
            item.description
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Admin_System_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6" id="admin-report-content">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200" data-html2canvas-ignore>
                <h1 className="text-2xl font-bold text-gray-900">System Reports Extractor</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={exportPDF}
                        disabled={reports.length === 0}
                        className={`flex items-center px-4 py-2 ${reports.length === 0 ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} text-white rounded-lg transition`}
                    >
                        <MdDownload className="mr-2" />
                        Export PDF
                    </button>
                    <button
                        onClick={exportCSV}
                        disabled={reports.length === 0}
                        className={`flex items-center px-4 py-2 ${reports.length === 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition`}
                    >
                        <MdDownload className="mr-2" />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow mb-8">
                <form onSubmit={fetchReports} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Filter by User</label>
                        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                            <option value="">All Users</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md h-[42px]">Generate</button>
                </form>
            </div>

            {loading ? <div className="p-4 text-center">Loading Data...</div> : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reports.map((rp) => (
                                    <tr key={rp._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(rp.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rp.userId?.name} <br /><span className="text-xs text-gray-400">{rp.userId?.email}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rp.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${rp.amount}</td>
                                    </tr>
                                ))}
                                {reports.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-gray-500">Run a generation to see records.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
