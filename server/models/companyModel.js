import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        industry: {
            type: String,
        },
        description: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Company = mongoose.model('Company', companySchema);
export default Company;
