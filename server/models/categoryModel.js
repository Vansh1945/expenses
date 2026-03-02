import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        type: {
            type: String,
            enum: ['expense', 'income'],
            default: 'expense',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Category = mongoose.model('Category', categorySchema);
export default Category;
