import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        email: {
            type: String,
        },
        actionType: {
            type: String,
            required: true,
            enum: ['failed_login', 'successful_login', 'role_change', 'expense_deleted', 'account_blocked', 'account_unblocked', 'password_reset'],
        },
        ipAddress: {
            type: String,
        },
        description: {
            type: String,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        }
    }
);

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);
export default SecurityLog;
