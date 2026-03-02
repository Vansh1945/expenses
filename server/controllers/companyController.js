import Company from '../models/companyModel.js';
import User from '../models/userModel.js';

// @desc    Create a new company profile
// @route   POST /api/company
// @access  Private (Role: ROLE_BUSINESS)
const createCompany = async (req, res, next) => {
    const { name, industry, description } = req.body;

    try {
        const existingCompany = await Company.findOne({ ownerId: req.user._id });
        if (existingCompany) {
            res.status(400);
            throw new Error('User already has a registered company profile.');
        }

        const company = await Company.create({
            name,
            ownerId: req.user._id,
            industry,
            description,
        });

        res.status(201).json(company);
    } catch (error) {
        next(error);
    }
};

// @desc    Get company profile
// @route   GET /api/company
// @access  Private (Role: ROLE_BUSINESS)
const getCompany = async (req, res, next) => {
    try {
        const company = await Company.findOne({ ownerId: req.user._id });

        if (company) {
            res.json(company);
        } else {
            res.status(404);
            throw new Error('Company profile not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update company profile
// @route   PUT /api/company
// @access  Private (Role: ROLE_BUSINESS)
const updateCompany = async (req, res, next) => {
    try {
        const company = await Company.findOne({ ownerId: req.user._id });

        if (company) {
            company.name = req.body.name || company.name;
            company.industry = req.body.industry || company.industry;
            company.description = req.body.description || company.description;

            const updatedCompany = await company.save();
            res.json(updatedCompany);
        } else {
            res.status(404);
            throw new Error('Company profile not found');
        }
    } catch (error) {
        next(error);
    }
};

export { createCompany, getCompany, updateCompany };
