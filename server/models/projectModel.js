import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        budget: {
            type: Number,
            required: true,
        },
        spent: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active',
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
