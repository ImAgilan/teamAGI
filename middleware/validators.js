/**
 * Input Validation Rules (express-validator)
 */
const { body } = require('express-validator');

exports.registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
    .matches(/^[a-z0-9._]+$/).withMessage('Username can only contain lowercase letters, numbers, dots, underscores'),
  body('displayName')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Display name must be 1–50 characters'),
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
];

exports.loginValidation = [
  body('identifier').trim().notEmpty().withMessage('Email or username required'),
  body('password').notEmpty().withMessage('Password required'),
];

exports.postValidation = [
  body('content').optional().isLength({ max: 2200 }).withMessage('Content cannot exceed 2200 characters'),
  body('visibility').optional().isIn(['public', 'followers', 'private']),
];

exports.commentValidation = [
  body('content').trim().notEmpty().withMessage('Comment cannot be empty')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
];

exports.messageValidation = [
  body('recipientId').notEmpty().withMessage('Recipient required'),
  body('content').trim().notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];
