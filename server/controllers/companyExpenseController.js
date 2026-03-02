import CompanyExpense from '../models/companyExpenseModel.js';
import Project from '../models/projectModel.js';
import Company from '../models/companyModel.js';

// @desc    Submit a new company expense
// @route   POST /api/company-expenses
// @access  Private (Role: ROLE_BUSINESS)
const submitExpense = async (req, res, next) => {
    const { projectId, amount, description, invoiceUrl } = req.body;

    try {
        const company = await Company.findOne({ ownerId: req.user._id });
        if (!company) {
            res.status(404);
            throw new Error('Company not found');
        }

        const project = await Project.findOne({ _id: projectId, companyId: company._id });
        if (!project) {
            res.status(404);
            throw new Error('Project not found or does not belong to your company');
        }

        const expense = await CompanyExpense.create({
            projectId,
            companyId: company._id,
            submittedBy: req.user._id,
            amount,
            description,
            invoiceUrl,
            status: 'pending', // Default
        });

        res.status(201).json(expense);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all expenses for the company
// @route   GET /api/company-expenses
// @access  Private (Role: ROLE_BUSINESS)
const getCompanyExpenses = async (req, res, next) => {
    try {
        const company = await Company.findOne({ ownerId: req.user._id });
        if (!company) {
            res.status(404);
            throw new Error('Company not found');
        }

        const expenses = await CompanyExpense.find({ companyId: company._id })
            .populate('projectId', 'name budget spent status')
            .populate('submittedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(expenses);
    } catch (error) {
        next(error);
    }
};

// @desc    Update expense status (Approve/Reject)
// @route   PUT /api/company-expenses/:id/status
// @access  Private (Role: ROLE_BUSINESS / Manager Role equivalent)
const updateExpenseStatus = async (req, res, next) => {
    const { status } = req.body;

    try {
        if (!['approved', 'rejected'].includes(status)) {
            res.status(400);
            throw new Error('Invalid status update');
        }

        const company = await Company.findOne({ ownerId: req.user._id });
        if (!company) {
            res.status(404);
            throw new Error('Company not found');
        }

        const expense = await CompanyExpense.findOne({ _id: req.params.id, companyId: company._id });

        if (!expense) {
            res.status(404);
            throw new Error('Expense not found');
        }

        // Prevent modifying already approved expenses just for safety, or implement reversal logic mapped to project spent
        if (expense.status === 'approved' && status !== 'approved') {
            const projectToRefund = await Project.findById(expense.projectId);
            projectToRefund.spent -= expense.amount;
            await projectToRefund.save();
        }

        expense.status = status;
        const updatedExpense = await expense.save();

        // If approved, add to Project's spent amount
        if (status === 'approved') {
            const project = await Project.findById(expense.projectId);
            project.spent += expense.amount;
            await project.save();
        }

        res.json(updatedExpense);
    } catch (error) {
        next(error);
    }
};

export { submitExpense, getCompanyExpenses, updateExpenseStatus };
