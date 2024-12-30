const express = require('express');
const router = express.Router();
const { getDashboardStats,
    getAllUsers,
    updateUser,
    deleteUser,
    addUser,
    getAllOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    sendResetCode,
    resetPassword,
    loginAdmin,
    getAdmin

} = require('../controller/dashboardController');

// Route to get dashboard statistics
router.get('/stats', getDashboardStats);
router.get('/all-users', getAllUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/add', addUser);
router.get('/all-orders', getAllOrders);
router.post('/create-order', createOrder);
router.put('/update-order/:id', updateOrder);
router.delete('/delete-order/:id', deleteOrder);

router.post('/send-reset-code', sendResetCode);
router.post('/reset-password', resetPassword);
router.post('/login', loginAdmin);
router.get('/getAdmin', getAdmin);

module.exports = router;