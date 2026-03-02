import mongoose from 'mongoose';

const groupExpenseSchema = new mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: true,
        },
        note: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            default: 'General',
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0.01, 'Amount must be positive'],
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        splitType: {
            type: String,
            enum: ['equal', 'percentage', 'fixed', 'custom'],
            required: true,
        },
        splits: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                email: {
                    type: String,
                },
                amount: {
                    type: Number,
                    required: true,
                }
            }
        ],
        isSettled: {
            type: Boolean,
            default: false,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const GroupExpense = mongoose.model('GroupExpense', groupExpenseSchema);
export default GroupExpense;
