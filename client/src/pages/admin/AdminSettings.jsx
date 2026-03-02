import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { MdSettings, MdSave, MdWarning, MdToggleOn, MdToggleOff } from 'react-icons/md';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        alertsEnabled: true,
        aiPredictionsEnabled: true,
        maxExpenseLimit: '',
        systemNotifications: '',
        maintenanceMode: false
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/settings');
            setSettings({
                alertsEnabled: data.alertsEnabled,
                aiPredictionsEnabled: data.aiPredictionsEnabled,
                maxExpenseLimit: data.maxExpenseLimit || '',
                systemNotifications: data.systemNotifications || '',
                maintenanceMode: data.maintenanceMode
            });
        } catch (error) {
            toast.error('Failed to load system settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...settings };
            if (!payload.maxExpenseLimit) payload.maxExpenseLimit = null;
            await api.put('/admin/settings', payload);
            toast.success('System settings updated successfully');
            fetchSettings();
        } catch (error) {
            toast.error('Error updating settings');
        }
    };

    const toggleSetting = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Configuration...</div>;

    const ToggleRow = ({ label, desc, stateKey, danger }) => (
        <div className="flex items-center justify-between py-4 border-b">
            <div>
                <h3 className={`font-semibold ${danger ? 'text-red-700' : 'text-gray-900'}`}>{label}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
            </div>
            <button
                type="button"
                className={`text-4xl transition-colors ${settings[stateKey] ? (danger ? 'text-red-600' : 'text-indigo-600') : 'text-gray-300'}`}
                onClick={() => toggleSetting(stateKey)}
            >
                {settings[stateKey] ? <MdToggleOn /> : <MdToggleOff />}
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center bg-white p-6 rounded-xl shadow border-l-4 border-indigo-600">
                <MdSettings className="w-8 h-8 text-indigo-600 mr-4" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
                    <p className="text-sm text-gray-500">Master controls for platform behavior and capabilities.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">

                <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Features Mapping</h2>

                <div className="space-y-2">
                    <ToggleRow
                        label="Global Budget Alerts"
                        desc="Allow the system to dispatch budget threshold warnings dynamically."
                        stateKey="alertsEnabled"
                    />
                    <ToggleRow
                        label="AI Predictive Analysis"
                        desc="Enable the 3-month rolling average analytical predictions on the Analysis panel."
                        stateKey="aiPredictionsEnabled"
                    />
                </div>

                <h2 className="text-lg font-bold text-gray-900 border-b pb-2 pt-4">Global Constants</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Expense Ceiling (Optional)</label>
                        <input
                            type="number"
                            placeholder="Leave blank for infinite"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={settings.maxExpenseLimit}
                            onChange={(e) => setSettings({ ...settings, maxExpenseLimit: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Stops any transaction above this amount to prevent fat-finger mistakes.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">System Wide Notification Banner</label>
                        <input
                            type="text"
                            placeholder="e.g. Server restarting at midnight UTC."
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={settings.systemNotifications}
                            onChange={(e) => setSettings({ ...settings, systemNotifications: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Broadcasts a message globally atop all dashboards.</p>
                    </div>
                </div>

                <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
                    <div className="flex items-center mb-2">
                        <MdWarning className="text-red-500 w-5 h-5 mr-2" />
                        <h2 className="text-lg font-bold text-red-800">Danger Zone</h2>
                    </div>
                    <ToggleRow
                        label="Maintenance Mode"
                        desc="Shuts off server endpoints for all non-admin users instantly. Routes will return a 503."
                        stateKey="maintenanceMode"
                        danger={true}
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button type="submit" className="flex items-center px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                        <MdSave className="w-5 h-5 mr-2" /> Apply Configuration
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminSettings;
