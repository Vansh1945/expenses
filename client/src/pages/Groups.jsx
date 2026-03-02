import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { MdGroupAdd, MdPersonAdd, MdPersonRemove, MdAddShoppingCart, MdAccountBalanceWallet, MdReceipt, MdAttachMoney } from 'react-icons/md';

const GoalsTab = ({ groupDetails, fetchGroupData, api, toast }) => {
    const [showAddGoal, setShowAddGoal] = useState(false);

    const handleAddGoal = async (e) => {
        e.preventDefault();
        const form = e.target;
        try {
            await api.post(`/groups/${groupDetails._id}/goals`, {
                title: form.title.value,
                targetAmount: form.targetAmount.value,
                savedAmount: form.savedAmount.value || 0,
                deadline: form.deadline.value || null,
                type: form.type.value,
            });
            toast.success('Goal added successfully!');
            setShowAddGoal(false);
            fetchGroupData(groupDetails._id);
        } catch (error) {
            toast.error('Failed to add goal');
        }
    };

    const handleUpdateProgress = async (goalId, newAmount) => {
        try {
            await api.patch(`/groups/${groupDetails._id}/goals/${goalId}`, { savedAmount: newAmount });
            toast.success('Progress updated!');
            fetchGroupData(groupDetails._id);
        } catch (error) {
            toast.error('Failed to update progress');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">🎯 Family Goals</h3>
                <button onClick={() => setShowAddGoal(true)} className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 flex items-center gap-2 font-medium">
                    <MdAttachMoney /> Add Goal
                </button>
            </div>

            {showAddGoal && (
                <form onSubmit={handleAddGoal} className="bg-pink-50 p-4 rounded-lg border border-pink-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input name="title" required placeholder="Goal Title (e.g. New Car)" className="px-3 py-2 rounded border" />
                    <input name="targetAmount" type="number" required placeholder="Target Amount (₹)" className="px-3 py-2 rounded border" />
                    <input name="savedAmount" type="number" placeholder="Already Saved (₹)" className="px-3 py-2 rounded border" />
                    <input name="deadline" type="date" className="px-3 py-2 rounded border" />
                    <select name="type" className="px-3 py-2 rounded border">
                        <option value="education">Education</option>
                        <option value="emergency">Emergency Fund</option>
                        <option value="festival">Festival / Event</option>
                        <option value="travel">Travel</option>
                        <option value="other">Other</option>
                    </select>
                    <div className="flex justify-end gap-2 sm:col-span-2">
                        <button type="button" onClick={() => setShowAddGoal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">Save Goal</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(groupDetails.goals || []).length === 0 ? (
                    <div className="col-span-1 md:col-span-2 text-center text-gray-500 py-6 border-2 border-dashed rounded-xl">
                        No family goals set yet. Start saving together!
                    </div>
                ) : (groupDetails.goals || []).map(goal => {
                    const progress = goal.targetAmount ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0;
                    return (
                        <div key={goal._id} className="border p-4 rounded-xl shadow-sm bg-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 text-xs font-bold text-gray-400 uppercase tracking-widest">{goal.type}</div>
                            <h4 className="font-bold text-gray-800 text-lg mb-1">{goal.title}</h4>
                            <div className="flex justify-between text-sm text-gray-500 mb-3">
                                <span>₹{goal.savedAmount} saved</span>
                                <span>Target: ₹{goal.targetAmount}</span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                <div className="bg-pink-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>

                            <div className="flex gap-2">
                                <input id={`add-${goal._id}`} type="number" placeholder="Add ₹" className="w-24 px-2 py-1 text-sm border rounded" />
                                <button onClick={() => {
                                    const input = document.getElementById(`add-${goal._id}`);
                                    if (input.value) handleUpdateProgress(goal._id, goal.savedAmount + Number(input.value));
                                }} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200">Add</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Groups = () => {
    const { user } = useContext(AuthContext);
    const [myRooms, setMyRooms] = useState([]);
    const [groupId, setGroupId] = useState('');
    const [groupDetails, setGroupDetails] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('members');
    const [joinCode, setJoinCode] = useState('');

    // Modals
    const [showCreate, setShowCreate] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);
    const [memberEmail, setMemberEmail] = useState('');

    // Add Expense State
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [expenseData, setExpenseData] = useState({
        note: '',
        category: 'General',
        amount: '',
        paidBy: user?._id || '',
        splitType: 'equal',
    });
    const [customSplits, setCustomSplits] = useState({}); // { userId: amount/percentage }

    const fetchMyRooms = async () => {
        try {
            const res = await api.get('/groups');
            setMyRooms(res.data);
        } catch { /* silent */ }
    };

    const fetchGroupData = async (id) => {
        if (!id) return;
        try {
            setLoading(true);
            const [groupRes, expRes, balRes] = await Promise.all([
                api.get(`/groups/${id}`),
                api.get(`/groups/${id}/expenses`),
                api.get(`/groups/${id}/balances`)
            ]);
            setGroupDetails(groupRes.data.group);
            setExpenses(expRes.data);
            setBalances(balRes.data);
            setGroupId(id);
        } catch (error) {
            toast.error('Failed to load group details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyRooms(); }, []);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/groups', { name: groupName, roomType: 'roommate' });
            toast.success(`Room created! Invite code: ${res.data.inviteCode}`);
            setShowCreate(false);
            setGroupName('');
            fetchMyRooms();
            fetchGroupData(res.data._id);
        } catch (error) {
            toast.error('Error creating room');
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/groups/join', { inviteCode: joinCode });
            toast.success(res.data.message || 'Joined room!');
            setJoinCode('');
            fetchMyRooms();
            fetchGroupData(res.data._id || res.data.group?._id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid invite code');
        }
    };

    const handleSettleExpense = async (expId) => {
        try {
            await api.patch(`/groups/expenses/${expId}/settle`);
            toast.success('Marked as settled!');
            fetchGroupData(groupDetails._id);
        } catch { toast.error('Could not settle expense'); }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/groups/${groupDetails._id}/add-member`, { email: memberEmail });
            toast.success('Member added!');
            setShowAddMember(false);
            setMemberEmail('');
            fetchGroupData(groupDetails._id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding member');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            await api.delete(`/groups/${groupDetails._id}/members/${userId}`);
            toast.success('Member removed');
            fetchGroupData(groupDetails._id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error removing member');
        }
    }

    const handleAddExpense = async (e) => {
        e.preventDefault();
        // Construct splits array
        let finalSplits = [];
        const numMembers = groupDetails.members.length;
        const totalAmount = parseFloat(expenseData.amount);

        if (expenseData.splitType === 'equal') {
            const splitAmount = totalAmount / numMembers;
            finalSplits = groupDetails.members.map(m => ({
                userId: m.userId?._id || m.userId || null,
                email: m.email || '',
                amount: splitAmount
            }));
        } else if (expenseData.splitType === 'percentage') {
            let totalPct = 0;
            finalSplits = groupDetails.members.map(m => {
                const uid = m.userId?._id || m.userId || m.email; // Fallback to email as key
                const pct = parseFloat(customSplits[uid] || 0);
                totalPct += pct;
                return { userId: m.userId?._id || m.userId || null, email: m.email || '', amount: (totalAmount * pct) / 100 };
            });
            if (Math.abs(totalPct - 100) > 0.1) return toast.error("Percentages must add up to 100%");
        } else if (expenseData.splitType === 'fixed') {
            let totalFixed = 0;
            finalSplits = groupDetails.members.map(m => {
                const uid = m.userId?._id || m.userId || m.email; // Fallback to email as key
                const amt = parseFloat(customSplits[uid] || 0);
                totalFixed += amt;
                return { userId: m.userId?._id || m.userId || null, email: m.email || '', amount: amt };
            });
            if (Math.abs(totalFixed - totalAmount) > 0.1) return toast.error("Fixed amounts must equal the total expense");
        }

        try {
            await api.post(`/groups/${groupDetails._id}/expenses`, {
                note: expenseData.note,
                category: expenseData.category || 'General',
                amount: totalAmount,
                paidBy: expenseData.paidBy,
                splitType: expenseData.splitType,
                splits: finalSplits
            });
            toast.success('Expense added!');
            setShowAddExpense(false);
            setExpenseData({ note: '', category: 'General', amount: '', paidBy: user?._id || '', splitType: 'equal' });
            setCustomSplits({});
            fetchGroupData(groupDetails._id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding expense');
        }
    };

    if (!['roommate', 'family', 'trip'].includes(user?.role)) {
        return <div className="p-8 text-center text-red-500 font-bold">You don't have access to the Groups Module.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    {user?.role === 'roommate' ? 'My Rooms' : user?.role === 'family' ? 'My Family' : 'Shared Group Wallet'}
                </h1>
                <div className="flex gap-2">
                    {!groupDetails && (
                        <button onClick={() => setShowCreate(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            <MdGroupAdd className="mr-2" /> Create Room
                        </button>
                    )}
                    {groupDetails && (
                        <div className="flex gap-3">
                            <button onClick={() => { setExpenseData(prev => ({ ...prev, paidBy: user?._id || '' })); setShowAddExpense(true); }} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <MdAddShoppingCart className="mr-2" /> Add Expense
                            </button>
                            <button onClick={() => setGroupDetails(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700">← Rooms</button>
                        </div>
                    )}
                </div>
            </div>

            {/* My Rooms List (shown when no room selected) */}
            {!groupDetails && (
                <div className="space-y-4">
                    {myRooms.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myRooms.map(room => (
                                <div key={room._id} onClick={() => fetchGroupData(room._id)}
                                    className="bg-white rounded-xl shadow border border-gray-100 p-5 cursor-pointer hover:border-indigo-400 hover:shadow-md transition">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">{room.name}</h3>
                                            <p className="text-sm text-gray-500">{room.members.length} members</p>
                                        </div>
                                        <span className="bg-indigo-50 text-indigo-700 font-mono text-xs px-2 py-1 rounded font-semibold tracking-widest">
                                            {room.inviteCode}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Created by {room.createdBy?.name || 'You'}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Join Room by Invite Code */}
                    <div className="bg-white rounded-xl shadow p-6 border-2 border-dashed border-gray-300">
                        <h3 className="font-semibold text-gray-700 mb-3">🔑 Join a Room via Invite Code</h3>
                        <form onSubmit={handleJoinRoom} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter 6-char code e.g. A3F9B2"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                className="flex-1 px-3 py-2 border rounded-md font-mono tracking-widest uppercase text-center"
                            />
                            <button type="submit" className="px-5 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">Join</button>
                        </form>
                    </div>
                </div>
            )}

            {groupDetails && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow flex justify-between items-start border-l-4 border-indigo-500">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{groupDetails.name}</h2>
                            <p className="text-sm text-gray-500">{groupDetails.members.length} members</p>
                        </div>
                        {groupDetails.inviteCode && (
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-400 mb-1">Invite Code</span>
                                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg">
                                    <span className="font-mono font-bold text-indigo-700 text-lg tracking-widest">{groupDetails.inviteCode}</span>
                                    <button onClick={() => { navigator.clipboard.writeText(groupDetails.inviteCode); toast.success('Code copied!'); }}
                                        className="text-xs text-indigo-500 hover:text-indigo-700">📋 Copy</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex border-b">
                        {user?.role === 'family' ? (
                            <>
                                <button onClick={() => setActiveTab('members')} className={`px-6 py-3 font-medium ${activeTab === 'members' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>👨‍👩‍👧 Family Members</button>
                                <button onClick={() => setActiveTab('expenses')} className={`px-6 py-3 font-medium ${activeTab === 'expenses' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>Expenses</button>
                                <button onClick={() => setActiveTab('goals')} className={`px-6 py-3 font-medium ${activeTab === 'goals' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>🎯 Goals</button>
                                <button onClick={() => setActiveTab('balances')} className={`px-6 py-3 font-medium ${activeTab === 'balances' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>Balances</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setActiveTab('members')} className={`px-6 py-3 font-medium ${activeTab === 'members' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Members</button>
                                <button onClick={() => setActiveTab('expenses')} className={`px-6 py-3 font-medium ${activeTab === 'expenses' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Expenses</button>
                                <button onClick={() => setActiveTab('balances')} className={`px-6 py-3 font-medium ${activeTab === 'balances' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Balances &amp; Settlements</button>
                            </>
                        )}
                    </div>

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <div className="bg-white p-6 rounded-xl shadow">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">
                                    {user?.role === 'family' ? '👨‍👩‍👧 Family Members' : 'Members'} ({groupDetails.members.length})
                                </h3>
                                <button onClick={() => setShowAddMember(true)} className="flex items-center px-3 py-1 bg-pink-100 text-pink-700 rounded hover:bg-pink-200">
                                    <MdPersonAdd className="mr-1" /> Add Member
                                </button>
                            </div>
                            <ul className="divide-y divide-gray-200 border rounded-lg">
                                {groupDetails.members.map((m, idx) => {
                                    const mId = m.userId?._id || m.userId;
                                    return (
                                        <li key={idx} className="p-4 flex justify-between items-center bg-gray-50">
                                            <div>
                                                <span className="font-medium text-gray-900">
                                                    {user?.role === 'family' ? (m.name || m.userId?.name || 'Member') : (m.userId?.name || 'Pending User')}
                                                </span>
                                                {user?.role === 'family' && (
                                                    <div className="flex gap-2 mt-1">
                                                        {m.relation && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">{m.relation}</span>}
                                                        {m.familyRole && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded capitalize">{m.familyRole}</span>}
                                                        {m.age && <span className="text-xs text-gray-500">Age {m.age}</span>}
                                                    </div>
                                                )}
                                                {user?.role !== 'family' && <p className="text-sm text-gray-500">{m.email}</p>}
                                            </div>
                                            <button onClick={() => {
                                                if (user?.role === 'family') {
                                                    api.delete(`/groups/${groupDetails._id}/family-members/${m._id}`)
                                                        .then(() => { toast.success('Member removed'); fetchGroupData(groupDetails._id); })
                                                        .catch(() => toast.error('Error removing member'));
                                                } else {
                                                    handleRemoveMember(mId);
                                                }
                                            }} className="text-red-500 hover:text-red-700 p-2">
                                                <MdPersonRemove size={20} />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Goals Tab — family only */}
                    {activeTab === 'goals' && user?.role === 'family' && (
                        <GoalsTab groupDetails={groupDetails} fetchGroupData={fetchGroupData} api={api} toast={toast} />
                    )}

                    {/* Expenses Tab */}
                    {activeTab === 'expenses' && (
                        <div className="bg-white rounded-xl shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid By</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {expenses.map((exp) => (
                                        <tr key={exp._id} className={exp.isSettled ? 'opacity-50 bg-green-50' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(exp.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {exp.description} <br />
                                                <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded">{exp.splitType} split</span>
                                                {exp.isSettled && <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✓ Settled</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                    {exp.category || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exp.paidBy?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{Number(exp.amount).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {!exp.isSettled && (
                                                    <button onClick={() => handleSettleExpense(exp._id)}
                                                        className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200">Mark Settled</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No expenses recorded yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Balances Tab */}
                    {activeTab === 'balances' && balances && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-6 rounded-xl shadow">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><MdAccountBalanceWallet className="mr-2 text-indigo-500" /> Overall Balances</h3>
                                    <ul className="space-y-3">
                                        {balances.balances.map(b => (
                                            <li key={b.userId} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                                                <span className="font-medium text-gray-700">{b.name}</span>
                                                <span className={`font-bold ${b.netBalance > 0 ? 'text-green-600' : b.netBalance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {b.netBalance > 0 ? `Gets back ₹${b.netBalance.toLocaleString()}` : b.netBalance < 0 ? `Owes ₹${Math.abs(b.netBalance).toLocaleString()}` : 'Settled up'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-teal-500">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><MdReceipt className="mr-2 text-teal-500" /> Suggested Settlements</h3>
                                    {balances.debts.length > 0 ? (
                                        <ul className="space-y-4">
                                            {balances.debts.map((debt, idx) => (
                                                <li key={idx} className="flex flex-col p-3 bg-teal-50 border border-teal-100 rounded text-sm">
                                                    <span className="font-semibold text-gray-800">{debt.from.name} <span className="text-gray-500 font-normal">owes</span> {debt.to.name}</span>
                                                    <span className="text-2xl font-bold text-teal-700">₹{debt.amount.toLocaleString()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">Everyone is settled up!</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Group Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create New Room</h2>
                        <form onSubmit={handleCreateGroup} className="space-y-3">
                            <input type="text" required placeholder="Group Name" value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full px-3 py-2 border rounded border-gray-300 mb-4" />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 rounded text-gray-800">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded text-white">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{user?.role === 'family' ? '👪 Add Family Member' : 'Add Member'}</h2>
                        {user?.role === 'family' ? (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target;
                                try {
                                    await api.post(`/groups/${groupDetails._id}/family-members`, {
                                        name: form.name.value,
                                        age: form.age.value || null,
                                        relation: form.relation.value,
                                        familyRole: form.familyRole.value,
                                    });
                                    toast.success('Family member added!');
                                    setShowAddMember(false);
                                    fetchGroupData(groupDetails._id);
                                } catch { toast.error('Error adding member'); }
                            }} className="space-y-3">
                                <input name="name" type="text" required placeholder="Full Name" className="w-full px-3 py-2 border rounded border-gray-300" />
                                <input name="age" type="number" min="1" max="120" placeholder="Age (optional)" className="w-full px-3 py-2 border rounded border-gray-300" />
                                <input name="relation" type="text" placeholder="Relation (e.g. Spouse, Son)" className="w-full px-3 py-2 border rounded border-gray-300" />
                                <select name="familyRole" className="w-full px-3 py-2 border rounded border-gray-300">
                                    <option value="parent">Parent</option>
                                    <option value="child">Child</option>
                                    <option value="guardian">Guardian</option>
                                    <option value="other">Other</option>
                                </select>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setShowAddMember(false)} className="px-4 py-2 bg-gray-200 rounded text-gray-800">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-pink-600 rounded text-white">Add Member</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleAddMember}>
                                <input type="email" required placeholder="Member Email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} className="w-full px-3 py-2 border rounded border-gray-300 mb-4" />
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowAddMember(false)} className="px-4 py-2 bg-gray-200 rounded text-gray-800">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-teal-600 rounded text-white">Add</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Add Expense Modal */}
            {showAddExpense && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Add Group Expense</h2>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Note</label>
                                <input type="text" value={expenseData.note} onChange={e => setExpenseData({ ...expenseData, note: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="Optional" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select value={expenseData.category} onChange={e => setExpenseData({ ...expenseData, category: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md">
                                    {['General', 'Food', 'Rent', 'Utilities', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other'].map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                                <input type="number" step="0.01" required value={expenseData.amount} onChange={e => setExpenseData({ ...expenseData, amount: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Paid By</label>
                                <select value={expenseData.paidBy} onChange={e => setExpenseData({ ...expenseData, paidBy: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md">
                                    {groupDetails?.members.map((m, i) => {
                                        const keyId = m.userId?._id || m.userId || m._id || m.email || i;
                                        const valId = m.userId?._id || m.userId || m._id || '';
                                        return <option key={keyId} value={valId}>{m.userId?.name || m.name || m.email}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Split Config</label>
                                <select value={expenseData.splitType} onChange={e => setExpenseData({ ...expenseData, splitType: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded-md">
                                    <option value="equal">Equally (Auto)</option>
                                    <option value="percentage">By Percentage</option>
                                    <option value="fixed">Fixed Amounts</option>
                                </select>
                            </div>

                            {expenseData.splitType !== 'equal' && (
                                <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Enter {expenseData.splitType === 'percentage' ? '%' : '₹'} per member:</h4>
                                    {groupDetails?.members.map((m, i) => {
                                        const uid = m.userId?._id || m.userId || m._id || m.email || i;
                                        return (
                                            <div key={uid} className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 truncate w-1/2">{m.userId?.name || m.name || m.email}</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={customSplits[uid] || ''}
                                                    onChange={e => setCustomSplits({ ...customSplits, [uid]: e.target.value })}
                                                    className="w-1/3 px-2 py-1 border rounded text-sm text-right"
                                                    placeholder={expenseData.splitType === 'percentage' ? '0 %' : '0.00'}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                <button type="button" onClick={() => setShowAddExpense(false)} className="px-4 py-2 bg-gray-200 rounded text-gray-800">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 rounded text-white font-medium hover:bg-green-700">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;
