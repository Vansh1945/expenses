import mongoose from 'mongoose';
import crypto from 'crypto';

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        roomType: {
            type: String,
            enum: ['roommate', 'family', 'trip', 'general'],
            default: 'general',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        members: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                email: { type: String },
                income: { type: Number, default: 0 },
                // Family-specific member fields
                name: { type: String, trim: true },
                age: { type: Number },
                relation: { type: String, trim: true }, // e.g. Spouse, Son, Daughter
                familyRole: {
                    type: String,
                    enum: ['parent', 'child', 'guardian', 'other'],
                    default: 'other',
                },
            },
        ],
        // Family savings goals
        goals: [
            {
                title: { type: String, required: true, trim: true },
                targetAmount: { type: Number, required: true },
                savedAmount: { type: Number, default: 0 },
                deadline: { type: Date },
                type: {
                    type: String,
                    enum: ['education', 'emergency', 'festival', 'travel', 'other'],
                    default: 'other',
                },
            },
        ],
        inviteCode: {
            type: String,
            unique: true,
            default: () => crypto.randomBytes(3).toString('hex').toUpperCase(),
        },
    },
    {
        timestamps: true,
    }
);

const Group = mongoose.model('Group', groupSchema);
export default Group;
