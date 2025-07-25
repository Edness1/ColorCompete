const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User CRUD
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Password reset
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Login
router.post('/login', userController.login);

// User statistics
router.get('/user-stats/user', userController.getUserStats);

module.exports = router;