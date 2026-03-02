import Project from '../models/projectModel.js';
import Company from '../models/companyModel.js';

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Role: ROLE_BUSINESS)
const createProject = async (req, res, next) => {
    const { name, budget, startDate, endDate } = req.body;

    try {
        const company = await Company.findOne({ ownerId: req.user._id });
        if (!company) {
            res.status(404);
            throw new Error('Company profile not found. Please create one first.');
        }

        const project = await Project.create({
            name,
            companyId: company._id,
            budget,
            startDate,
            endDate,
        });

        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all projects for the company
// @route   GET /api/projects
// @access  Private (Role: ROLE_BUSINESS)
const getProjects = async (req, res, next) => {
    try {
        const company = await Company.findOne({ ownerId: req.user._id });
        if (!company) {
            res.status(404);
            throw new Error('Company profile not found.');
        }

        const projects = await Project.find({ companyId: company._id }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        next(error);
    }
};

// @desc    Update project status/budget
// @route   PUT /api/projects/:id
// @access  Private (Role: ROLE_BUSINESS)
const updateProject = async (req, res, next) => {
    try {
        const company = await Company.findOne({ ownerId: req.user._id });
        const project = await Project.findOne({ _id: req.params.id, companyId: company?._id });

        if (project) {
            project.name = req.body.name || project.name;
            project.budget = req.body.budget || project.budget;
            project.status = req.body.status || project.status;
            project.startDate = req.body.startDate || project.startDate;
            project.endDate = req.body.endDate || project.endDate;

            const updatedProject = await project.save();
            res.json(updatedProject);
        } else {
            res.status(404);
            throw new Error('Project not found');
        }
    } catch (error) {
        next(error);
    }
};

export { createProject, getProjects, updateProject };
