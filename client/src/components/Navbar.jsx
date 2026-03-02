import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MdLogout, MdAccountCircle, MdMenu } from 'react-icons/md';

const Navbar = ({ user, setIsSidebarOpen }) => {
    const { logout } = useContext(AuthContext);

    return (
        <header className="flex justify-between items-center py-4 px-4 md:px-6 bg-white border-b border-gray-200 shrink-0">
            <div className="flex items-center">
                <button
                    className="mr-4 md:hidden text-gray-500 hover:text-gray-700"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <MdMenu className="w-6 h-6" />
                </button>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800 capitalize truncate">
                    {user?.role} Portal
                </h2>
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex items-center">
                    <MdAccountCircle className="h-8 w-8 text-gray-400" />
                    <span className="text-gray-700 text-sm font-medium ml-2 mr-4 hidden sm:inline-block">
                        Hi, {user?.name}
                    </span>
                    <button
                        onClick={logout}
                        className="flex items-center text-red-600 hover:text-red-800 transition-colors"
                    >
                        <MdLogout className="h-5 w-5 sm:mr-1" />
                        <span className="text-sm font-medium hidden sm:inline-block">Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
