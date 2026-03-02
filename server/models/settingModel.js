import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
    {
        alertsEnabled: {
            type: Boolean,
            default: true,
        },
        aiPredictionsEnabled: {
            type: Boolean,
            default: true,
        },
        maxExpenseLimit: {
            type: Number,
            default: null, // Allow unbounded if null
        },
        systemNotifications: {
            type: String,
            default: '',
        },
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
