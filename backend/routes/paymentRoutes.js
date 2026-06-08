const express = require('express');
const router = express.Router();
const {
  getCustomersWithPayments,
  createOrUpdateCustomer,
  updatePaymentStatus,
  createMonthlyRecords,
  sendReminder,
  deleteCustomer
} = require('../controllers/paymentController');

// Get all customers with their payment status
router.get('/customers', getCustomersWithPayments);

// Create or update customer
router.post('/customer', createOrUpdateCustomer);

// Update payment status
router.post('/payment/update-status', updatePaymentStatus);

// Create monthly payment records for all customers
router.post('/payment/create-monthly-records', createMonthlyRecords);

// Send payment reminder
router.post('/payment/send-reminder', sendReminder);

// Delete customer
router.delete('/customer/:customerId', deleteCustomer);

module.exports = router;
