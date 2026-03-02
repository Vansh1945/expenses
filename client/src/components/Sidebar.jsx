import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    MdDashboard,
    MdAttachMoney,
    MdPieChart,
    MdGroup,
    MdNotificationsActive,
    MdAnalytics,
    MdAdminPanelSettings,
    MdSecurity,
    MdSettings,
    MdHome,
    MdCallSplit,
    MdHandshake,
    MdBarChart,
} from 'react-icons/md';
import { FaMoneyBillWave } from 'react-icons/fa';
import logo from '../assets/logo.png';

const Sidebar = ({ role, isOpen, setIsOpen }) => {
    const location = useLocation();

    const getNavItems = () => {
        // Personal role: only personal finance pages
        if (role === 'personal') {
            return [
                { name: 'Dashboard', path: '/dashboard', icon: <MdDashboard className="w-6 h-6" /> },
                { name: 'Income', path: '/income', icon: <FaMoneyBillWave className="w-6 h-6 text-green-400" /> },
                { name: 'Expenses', path: '/expenses', icon: <FaMoneyBillWave className="w-6 h-6 text-red-400" /> },
                { name: 'Budget', path: '/budget', icon: <MdAttachMoney className="w-6 h-6" /> },
                { name: 'Reports', path: '/reports', icon: <MdPieChart className="w-6 h-6" /> },
                { name: 'Analysis', path: '/analysis', icon: <MdAnalytics className="w-6 h-6" /> },
                { name: 'Notification', path: '/notification', icon: <MdAnalytics className="w-6 h-6" /> }
            ];
        }

        // Roommate role: room management and shared expense pages
        if (role === 'roommate') {
            return [
                { name: 'Dashboard', path: '/dashboard', icon: <MdDashboard className="w-6 h-6" /> },
                { name: 'My Rooms', path: '/groups', icon: <MdHome className="w-6 h-6 text-blue-400" /> },
                { name: 'Shared Expenses', path: '/expenses', icon: <MdCallSplit className="w-6 h-6 text-orange-400" /> },
                { name: 'Settlements', path: '/groups', icon: <MdHandshake className="w-6 h-6 text-green-400" /> },
                { name: 'Reports', path: '/reports', icon: <MdBarChart className="w-6 h-6 text-purple-400" /> },
            ];
        }

        // Family role: family household management pages
        if (role === 'family') {
            return [
                { name: 'Dashboard', path: '/dashboard', icon: <MdDashboard className="w-6 h-6" /> },
                { name: 'Family Members', path: '/groups', icon: <MdGroup className="w-6 h-6 text-pink-400" /> },
                { name: 'Income', path: '/income', icon: <FaMoneyBillWave className="w-6 h-6 text-green-400" /> },
                { name: 'Expenses', path: '/expenses', icon: <MdCallSplit className="w-6 h-6 text-red-400" /> },
                { name: 'Goals', path: '/groups', icon: <MdAttachMoney className="w-6 h-6 text-yellow-500" /> },
                { name: 'Reports', path: '/reports', icon: <MdBarChart className="w-6 h-6 text-purple-400" /> },
            ];
        }

        let items = [
            { name: 'Dashboard', path: '/dashboard', icon: <MdDashboard className="w-6 h-6" /> },
            { name: 'Income', path: '/income', icon: <FaMoneyBillWave className="w-6 h-6 text-green-500" /> },
            { name: 'Expenses', path: '/expenses', icon: <FaMoneyBillWave className="w-6 h-6 text-red-500" /> },
            { name: 'Budget', path: '/budget', icon: <MdAttachMoney className="w-6 h-6" /> },
            { name: 'Reports', path: '/reports', icon: <MdPieChart className="w-6 h-6" /> },
            { name: 'Analysis', path: '/analysis', icon: <MdAnalytics className="w-6 h-6" /> },
            { name: 'Alerts', path: '/alerts', icon: <MdNotificationsActive className="w-6 h-6" /> },
        ];

        if (['roommate', 'family', 'trip'].includes(role)) {
            items.splice(4, 0, { name: 'Groups', path: '/groups', icon: <MdGroup className="w-6 h-6" /> });
        }

        if (role === 'company') {
            items = [
                { name: 'Business Board', path: '/company/dashboard', icon: <MdDashboard className="w-6 h-6 text-indigo-400" /> },
                { name: 'Projects', path: '/company/projects', icon: <MdPieChart className="w-6 h-6 text-orange-400" /> },
                { name: 'Approvals', path: '/company/expenses', icon: <MdAttachMoney className="w-6 h-6 text-red-400" /> },
                ...items.filter(item => ['Income', 'Expenses', 'Reports'].includes(item.name))
            ];
        }

        if (role === 'admin') {
            items = [
                { name: 'Admin Dashboard', path: '/admin/dashboard', icon: <MdDashboard className="w-6 h-6" /> },
                { name: 'Manage Users', path: '/admin/users', icon: <MdGroup className="w-6 h-6" /> },
                { name: 'Categories', path: '/admin/categories', icon: <MdPieChart className="w-6 h-6" /> },
                { name: 'System Reports', path: '/admin/reports', icon: <MdAnalytics className="w-6 h-6" /> },
                { name: 'Security Logs', path: '/admin/security', icon: <MdSecurity className="w-6 h-6 text-red-500" /> },
                { name: 'Settings', path: '/admin/settings', icon: <MdSettings className="w-6 h-6 text-slate-400" /> },
                { name: 'Admin Profile', path: '/admin/profile', icon: <MdAdminPanelSettings className="w-6 h-6" /> },
            ];
        }

        return items;
    };

    const navItems = getNavItems();

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div style={{ backgroundColor: '#EEF2FF', borderRightColor: '#C7D2FE' }} className={`fixed inset-y-0 left-0 z-30 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out flex flex-col w-64 border-r`}>
                <div style={{ borderBottomColor: '#C7D2FE' }} className="flex items-center justify-center h-20 border-b shrink-0">
                    <img src={logo} alt="Expentra Logo" className="w-14 h-14 object-contain" />
                </div>
                <div className="flex flex-col flex-1 overflow-y-auto">
                    <nav className="flex-1 px-2 py-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setIsOpen && setIsOpen(false)}
                                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-150 ${isActive ? 'text-white' : 'text-indigo-800 hover:text-indigo-900'}`}
                                    style={isActive ? { backgroundColor: '#7bbd39' } : {}}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#C7D2FE'; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = ''; }}
                                >
                                    <div className={`${isActive ? 'text-white' : 'text-indigo-500 group-hover:text-indigo-700'} mr-3`}>
                                        {item.icon}
                                    </div>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
