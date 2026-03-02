import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Setting from '../models/settingModel.js';

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401);
            next(new Error('Not authorized, token failed'));
        }
    }

    if (!token) {
        res.status(401);
        next(new Error('Not authorized, no token'));
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401);
        next(new Error('Not authorized as an admin'));
    }
};

const businessOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'company' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(401);
        next(new Error('Not authorized as a business account'));
    }
};

// Guard for personal routes — allow personal, family + admin
const personalOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'personal' || req.user.role === 'family' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403);
        next(new Error('This feature is only available for personal and family accounts'));
    }
};

// Guard for roommate role routes — allow roommate + admin
const roommateOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'roommate' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403);
        next(new Error('This feature is only available for roommate accounts'));
    }
};

// Guard for family role routes — allow family + admin
const familyOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'family' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403);
        next(new Error('This feature is only available for family accounts'));
    }
};

const checkMaintenance = async (req, res, next) => {
    try {
        const settings = await Setting.findOne();
        if (settings && settings.maintenanceMode) {
            // Allow bypassing for auth login to let admins log in
            if (req.path === '/api/auth/login') {
                return next();
            }

            // If they happen to have a token attached, we decode to see if they are admin bypassing
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const user = await User.findById(decoded.id);
                    if (user && user.role === 'admin') {
                        return next();
                    }
                } catch (e) { /* ignore invalid token for maintenance check */ }
            }

            res.status(503);
            throw new Error('System is currently under maintenance. Please try again later.');
        }
        next();
    } catch (error) {
        next(error);
    }
}

export { protect, admin, businessOnly, personalOnly, roommateOnly, familyOnly, checkMaintenance };
