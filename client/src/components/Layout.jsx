import React, { useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
    const { user } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <Sidebar role={user?.role} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Navbar */}
                <Navbar user={user} setIsSidebarOpen={setIsSidebarOpen} />

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
