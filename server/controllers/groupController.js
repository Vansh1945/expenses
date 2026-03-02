import Group from '../models/groupModel.js';
import User from '../models/userModel.js';
import GroupExpense from '../models/groupExpenseModel.js';

// @desc    Create a new group / room
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res, next) => {
    const { name, description, roomType, members } = req.body;

    try {
        if (!name) {
            res.status(400);
            return next(new Error('Room name is required'));
        }

        const group = await Group.create({
            name,
            description: description || '',
            roomType: roomType || 'general',
            createdBy: req.user._id,
            // Auto-include creator as first member
            members: [{ userId: req.user._id, email: req.user.email, income: 0 }, ...(members || [])],
        });

        res.status(201).json(group);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all groups the current user belongs to
// @route   GET /api/groups
// @access  Private
const getUserGroups = async (req, res, next) => {
    try {
        const groups = await Group.find({
            $or: [
                { createdBy: req.user._id },
                { 'members.userId': req.user._id },
            ]
        })
            .populate('createdBy', 'name email')
            .populate('members.userId', 'name email')
            .sort({ createdAt: -1 });

        res.json(groups);
    } catch (error) {
        next(error);
    }
};

// @desc    Join a room via invite code
// @route   POST /api/groups/join
// @access  Private
const joinRoom = async (req, res, next) => {
    const { inviteCode } = req.body;

    try {
        if (!inviteCode) {
            res.status(400);
            return next(new Error('Invite code is required'));
        }

        const group = await Group.findOne({ inviteCode: inviteCode.trim().toUpperCase() });

        if (!group) {
            res.status(404);
            return next(new Error('Invalid invite code. Room not found.'));
        }

        // Prevent duplicate member entry
        const alreadyMember = group.members.some(
            m => m.userId && m.userId.toString() === req.user._id.toString()
        );

        if (alreadyMember) {
            return res.status(200).json({ message: 'You are already a member of this room.', group });
        }

        group.members.push({ userId: req.user._id, email: req.user.email, income: 0 });
        await group.save();

        const populated = await Group.findById(group._id)
            .populate('createdBy', 'name email')
            .populate('members.userId', 'name email');

        res.status(200).json(populated);
    } catch (error) {
        next(error);
    }
};

// @desc    Add member to group
// @route   POST /api/groups/:id/add-member
// @access  Private
const addMember = async (req, res, next) => {
    const { email, income } = req.body;

    try {
        const group = await Group.findById(req.params.id);

        if (group) {
            if (group.createdBy.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized to add members to this group');
            }

            const user = await User.findOne({ email });

            const newMember = {
                userId: user ? user._id : null,
                email,
                income: income || 0,
            };

            group.members.push(newMember);
            const updatedGroup = await group.save();

            res.status(201).json(updatedGroup);
        } else {
            res.status(404);
            throw new Error('Group not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get group details & calculate splits
// @route   GET /api/groups/:id
// @access  Private
const getGroup = async (req, res, next) => {
    const { splitType, totalAmount } = req.query; // splitType: 'equal' or 'income'

    try {
        const group = await Group.findById(req.params.id).populate('members.userId', 'name email');

        if (group) {
            let splits = [];

            if (totalAmount) {
                const amount = parseFloat(totalAmount);

                if (splitType === 'income') {
                    // Income-based split
                    const totalIncome = group.members.reduce((acc, curr) => acc + (curr.income || 0), 0);

                    if (totalIncome > 0) {
                        splits = group.members.map(member => ({
                            email: member.email || (member.userId && member.userId.email),
                            amountToPay: (amount * (member.income / totalIncome)).toFixed(2),
                        }));
                    } else {
                        res.status(400);
                        throw new Error('Total income of members is 0, cannot perform income-based split');
                    }
                } else {
                    // Equal split
                    const count = group.members.length;
                    if (count > 0) {
                        const splitAmount = (amount / count).toFixed(2);
                        splits = group.members.map(member => ({
                            email: member.email || (member.userId && member.userId.email),
                            amountToPay: splitAmount,
                        }));
                    }
                }
            }

            res.json({
                group,
                splits,
            });
        } else {
            res.status(404);
            throw new Error('Group not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
const removeMember = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);

        if (group) {
            if (group.createdBy.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized to remove members');
            }

            // Remove by checking if userId matches, or email matches (for mock emails)
            group.members = group.members.filter(m =>
                (m.userId ? m.userId.toString() : m.email) !== req.params.userId
            );

            await group.save();
            res.json({ message: 'Member removed' });
        } else {
            res.status(404);
            throw new Error('Group not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Add group expense (equal or custom split)
// @route   POST /api/groups/:id/expenses
// @access  Private
const addGroupExpense = async (req, res, next) => {
    const { note, category, amount, splitType, splits, paidBy } = req.body;

    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            res.status(404);
            throw new Error('Group not found');
        }

        if (!amount || !splitType || !paidBy) {
            res.status(400);
            throw new Error('amount, splitType, and paidBy are required');
        }

        let finalSplits = splits || [];

        // Auto-compute equal split
        if (splitType === 'equal') {
            const memberCount = group.members.length;
            if (memberCount === 0) { res.status(400); throw new Error('Group has no members'); }
            const share = parseFloat((Number(amount) / memberCount).toFixed(2));
            finalSplits = group.members.map(m => ({
                userId: m.userId || null,
                email: m.email || '',
                amount: share,
            }));
        } else {
            // Validate custom split sum matches total
            const totalSplit = finalSplits.reduce((acc, curr) => acc + Number(curr.amount), 0);
            if (Math.abs(totalSplit - Number(amount)) > 0.05) {
                res.status(400);
                throw new Error(`Split amounts (${totalSplit}) do not add up to total (${amount})`);
            }
        }

        const cleanedSplits = finalSplits.map(s => {
            if (!s.userId) {
                const { userId, ...rest } = s;
                return rest;
            }
            return s;
        });

        const expense = await GroupExpense.create({
            groupId: group._id,
            note: note || '',
            category: category || 'General',
            amount: Number(amount),
            paidBy,
            splitType,
            splits: cleanedSplits
        });

        res.status(201).json(expense);
    } catch (error) {
        next(error);
    }
};

// @desc    Mark a group expense as settled
// @route   PATCH /api/groups/expenses/:expenseId/settle
// @access  Private
const settleExpense = async (req, res, next) => {
    try {
        const expense = await GroupExpense.findById(req.params.expenseId);
        if (!expense) {
            res.status(404);
            throw new Error('Expense not found');
        }

        expense.isSettled = true;
        await expense.save();

        res.json({ message: 'Expense marked as settled', expense });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all group expenses
// @route   GET /api/groups/:id/expenses
// @access  Private
const getGroupExpenses = async (req, res, next) => {
    try {
        const expenses = await GroupExpense.find({ groupId: req.params.id })
            .populate('paidBy', 'name email')
            .populate('splits.userId', 'name email')
            .sort({ date: -1 });

        res.json(expenses);
    } catch (error) {
        next(error);
    }
};

// @desc    Calculate who owes who (Debt Simplification)
// @route   GET /api/groups/:id/balances
// @access  Private
const getGroupBalances = async (req, res, next) => {
    try {
        const expenses = await GroupExpense.find({ groupId: req.params.id }).populate('splits.userId', 'name email').populate('paidBy', 'name email');
        const group = await Group.findById(req.params.id).populate('members.userId', 'name email');

        if (!group) {
            res.status(404);
            throw new Error('Group not found');
        }

        const balances = {};

        expenses.forEach(exp => {
            // Guard: skip if paidBy is missing
            if (!exp.paidBy) return;
            const payerId = exp.paidBy._id
                ? exp.paidBy._id.toString()
                : exp.paidBy.toString();
            if (!balances[payerId]) balances[payerId] = 0;
            balances[payerId] += Number(exp.amount) || 0;

            (exp.splits || []).forEach(split => {
                // Guard: skip email-only splits (no userId)
                if (!split.userId) return;
                const splitUserId = split.userId._id
                    ? split.userId._id.toString()
                    : split.userId.toString();
                if (!balances[splitUserId]) balances[splitUserId] = 0;
                balances[splitUserId] -= Number(split.amount) || 0;
            });
        });

        const userMap = {};
        group.members.forEach(m => {
            if (m.userId) {
                userMap[m.userId._id.toString()] = { name: m.userId.name, email: m.userId.email };
                if (balances[m.userId._id.toString()] === undefined) balances[m.userId._id.toString()] = 0;
            }
        });

        Object.keys(balances).forEach(id => {
            if (!userMap[id]) userMap[id] = { name: 'Unknown User', email: id };
        });

        const balancesWithNames = Object.keys(balances).map(id => ({
            userId: id,
            name: userMap[id].name,
            email: userMap[id].email,
            netBalance: parseFloat(balances[id].toFixed(2))
        }));

        // Greedy Debt Simplification
        const debtors = [];
        const creditors = [];

        Object.keys(balances).forEach(id => {
            const amount = balances[id];
            if (amount < -0.01) debtors.push({ id, amount: Math.abs(amount) });
            else if (amount > 0.01) creditors.push({ id, amount });
        });

        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const transactions = [];
        let i = 0, j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            const settlement = Math.min(debtor.amount, creditor.amount);

            transactions.push({
                from: { userId: debtor.id, name: userMap[debtor.id].name, email: userMap[debtor.id].email },
                to: { userId: creditor.id, name: userMap[creditor.id].name, email: userMap[creditor.id].email },
                amount: parseFloat(settlement.toFixed(2))
            });

            debtor.amount -= settlement;
            creditor.amount -= settlement;

            if (debtor.amount < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        res.json({
            balances: balancesWithNames,
            debts: transactions
        });

    } catch (error) {
        next(error);
    }
};

// ── FAMILY ROLE FUNCTIONS ──────────────────────────────────────────────────────

const addFamilyMember = async (req, res, next) => {
    const { name, age, relation, familyRole, email, income } = req.body;
    try {
        if (!name) { res.status(400); return next(new Error('Member name is required')); }
        const group = await Group.findById(req.params.id);
        if (!group) { res.status(404); return next(new Error('Group not found')); }
        if (group.createdBy.toString() !== req.user._id.toString()) {
            res.status(403); return next(new Error('Only the group creator can add members'));
        }
        group.members.push({ name, age: age || null, relation: relation || '', familyRole: familyRole || 'other', email: email || '', income: income || 0 });
        await group.save();
        const updated = await Group.findById(group._id).populate('members.userId', 'name email');
        res.status(201).json({ success: true, data: updated });
    } catch (error) { next(error); }
};

const removeFamilyMember = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) { res.status(404); return next(new Error('Group not found')); }
        if (group.createdBy.toString() !== req.user._id.toString()) {
            res.status(403); return next(new Error('Not authorized'));
        }
        group.members = group.members.filter(m => m._id.toString() !== req.params.memberId);
        await group.save();
        res.json({ success: true, message: 'Member removed' });
    } catch (error) { next(error); }
};

const addFamilyGoal = async (req, res, next) => {
    const { title, targetAmount, savedAmount, deadline, type } = req.body;
    try {
        if (!title || !targetAmount) { res.status(400); return next(new Error('title and targetAmount are required')); }
        const group = await Group.findById(req.params.id);
        if (!group) { res.status(404); return next(new Error('Group not found')); }
        group.goals.push({ title, targetAmount: Number(targetAmount), savedAmount: Number(savedAmount) || 0, deadline: deadline || null, type: type || 'other' });
        await group.save();
        const goal = group.goals[group.goals.length - 1];
        const progress = goal.targetAmount > 0 ? Math.min(100, parseFloat(((goal.savedAmount / goal.targetAmount) * 100).toFixed(1))) : 0;
        res.status(201).json({ success: true, data: { ...goal.toObject(), progress } });
    } catch (error) { next(error); }
};

const updateGoalSavings = async (req, res, next) => {
    const { savedAmount } = req.body;
    try {
        const group = await Group.findById(req.params.id);
        if (!group) { res.status(404); return next(new Error('Group not found')); }
        const goal = group.goals.id(req.params.goalId);
        if (!goal) { res.status(404); return next(new Error('Goal not found')); }
        goal.savedAmount = Number(savedAmount) >= 0 ? Number(savedAmount) : goal.savedAmount;
        await group.save();
        const progress = goal.targetAmount > 0 ? Math.min(100, parseFloat(((goal.savedAmount / goal.targetAmount) * 100).toFixed(1))) : 0;
        res.json({ success: true, data: { ...goal.toObject(), progress } });
    } catch (error) { next(error); }
};

const getFamilyReport = async (req, res, next) => {
    const { month, year } = req.query;
    try {
        const group = await Group.findById(req.params.id).populate('members.userId', 'name email');
        if (!group) { res.status(404); return next(new Error('Group not found')); }

        const Expense = (await import('../models/expenseModel.js')).default;
        const Income = (await import('../models/incomeModel.js')).default;

        const matchBase = { groupId: group._id };
        if (month && year) {
            const start = new Date(Number(year), Number(month) - 1, 1);
            const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
            matchBase.date = { $gte: start, $lte: end };
        }

        const expAgg = await Expense.aggregate([
            { $match: matchBase },
            { $group: { _id: '$paidByMember', totalExpense: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);
        const totalExpense = expAgg.reduce((s, e) => s + (e.totalExpense || 0), 0);

        const catAgg = await Expense.aggregate([
            { $match: matchBase },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } }
        ]);

        const incomeMatch = { userId: group.createdBy };
        if (month && year) { incomeMatch.month = Number(month); incomeMatch.year = Number(year); }
        const incomeAgg = await Income.aggregate([
            { $match: incomeMatch },
            { $group: { _id: null, totalIncome: { $sum: '$amount' } } }
        ]);
        const totalIncome = incomeAgg.length > 0 ? incomeAgg[0].totalIncome : 0;

        const memberReport = group.members.map(m => {
            const mId = m._id.toString();
            const mExp = expAgg.find(e => e._id && e._id.toString() === mId);
            return {
                memberId: mId,
                name: m.name || m.userId?.name || m.email || 'Unknown',
                relation: m.relation || '',
                familyRole: m.familyRole || 'other',
                totalExpense: mExp ? parseFloat(mExp.totalExpense.toFixed(2)) : 0,
                expenseCount: mExp ? mExp.count : 0,
            };
        });

        const goals = (group.goals || []).map(g => ({
            ...g.toObject(),
            progress: g.targetAmount > 0 ? Math.min(100, parseFloat(((g.savedAmount / g.targetAmount) * 100).toFixed(1))) : 0
        }));

        res.json({
            success: true,
            data: {
                totalIncome,
                totalExpense,
                netSavings: parseFloat((totalIncome - totalExpense).toFixed(2)),
                categoryWise: catAgg.map(c => ({ category: c._id, total: parseFloat(c.total.toFixed(2)) })),
                memberContributions: memberReport,
                goals,
            }
        });
    } catch (error) { next(error); }
};

export { createGroup, getUserGroups, joinRoom, addMember, getGroup, removeMember, addGroupExpense, getGroupExpenses, getGroupBalances, settleExpense, addFamilyMember, removeFamilyMember, addFamilyGoal, updateGoalSavings, getFamilyReport };
