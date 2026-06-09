const Customer = require('../models/Customer');
const Payment = require('../models/Payment');

// Get all customers with their current month payment status
exports.getCustomersWithPayments = async (req, res) => {
  try {
    const { filter, month, year } = req.query;
    
    const currentDate = new Date();
    const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const currentYear = year ? parseInt(year) : currentDate.getFullYear();

    let customers = await Customer.find({ isActive: true }).sort({ name: 1 });

    // Get payments for the specified month/year
    const payments = await Payment.find({
      month: currentMonth,
      year: currentYear
    });

    const paymentMap = {};
    payments.forEach(payment => {
      paymentMap[payment.customerId.toString()] = payment;
    });

    // Attach payment status to each customer
    const customersWithPayments = customers.map(customer => {
      const payment = paymentMap[customer._id.toString()];
      return {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        sports: customer.sports,
        paymentStatus: payment ? payment.status : 'Unpaid',
        paymentId: payment ? payment._id : null,
        reminderSent: payment ? payment.reminderSent : false,
        amount: payment ? payment.amount : 500
      };
    });

    // Apply filters
    let filteredCustomers = customersWithPayments;
    if (filter === 'Paid') {
      filteredCustomers = customersWithPayments.filter(c => c.paymentStatus === 'Paid');
    } else if (filter === 'Unpaid') {
      filteredCustomers = customersWithPayments.filter(c => c.paymentStatus === 'Unpaid');
    }

    // Calculate stats
    const totalPaid = customersWithPayments.filter(c => c.paymentStatus === 'Paid').length;
    const totalUnpaid = customersWithPayments.filter(c => c.paymentStatus === 'Unpaid').length;

    res.json({
      success: true,
      customers: filteredCustomers,
      stats: {
        totalCustomers: customersWithPayments.length,
        totalPaid,
        totalUnpaid,
        month: currentMonth,
        year: currentYear
      }
    });
  } catch (error) {
    console.error('Error fetching customers with payments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create or update customer
exports.createOrUpdateCustomer = async (req, res) => {
  try {
    const { name, phone, sports, customerId } = req.body;

    if (!name || !phone || !sports || sports.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, phone, and sports are required'
      });
    }

    let customer;
    if (customerId) {
      customer = await Customer.findByIdAndUpdate(
        customerId,
        { name, phone, sports },
        { new: true }
      );
    } else {
      customer = await Customer.create({ name, phone, sports });
    }

    res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { customerId, status, month, year } = req.body;

    if (!customerId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID and status are required'
      });
    }

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Find or create payment record
    let payment = await Payment.findOne({
      customerId,
      month: targetMonth,
      year: targetYear
    });

    if (payment) {
      payment.status = status;
      payment.updatedAt = new Date();
      await payment.save();
    } else {
      payment = await Payment.create({
        customerId,
        month: targetMonth,
        year: targetYear,
        status
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create monthly payment records for all active customers
exports.createMonthlyRecords = async (req, res) => {
  try {
    const { month, year } = req.body;

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const customers = await Customer.find({ isActive: true });

    let createdCount = 0;
    for (const customer of customers) {
      const existingPayment = await Payment.findOne({
        customerId: customer._id,
        month: targetMonth,
        year: targetYear
      });

      if (!existingPayment) {
        await Payment.create({
          customerId: customer._id,
          month: targetMonth,
          year: targetYear,
          status: 'Unpaid'
        });
        createdCount++;
      }
    }

    res.json({
      success: true,
      message: `Created ${createdCount} payment records for ${targetMonth}/${targetYear}`
    });
  } catch (error) {
    console.error('Error creating monthly records:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Send payment reminder SMS
exports.sendReminder = async (req, res) => {
  try {
    const { customerId, month, year } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const payment = await Payment.findOne({
      customerId,
      month: targetMonth,
      year: targetYear
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    // Generate WhatsApp message URL
    const message = `Hi ${customer.name}, your sports booking payment for this month is pending. Please complete the payment.`;
    const whatsappUrl = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;

    // Update reminder status
    payment.reminderSent = true;
    payment.reminderSentAt = new Date();
    await payment.save();

    res.json({
      success: true,
      whatsappUrl,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    await Customer.findByIdAndUpdate(customerId, { isActive: false });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update payment amount
exports.updatePaymentAmount = async (req, res) => {
  try {
    const { customerId, amount, month, year } = req.body;

    if (!customerId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID and amount are required'
      });
    }

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Find or create payment record
    let payment = await Payment.findOne({
      customerId,
      month: targetMonth,
      year: targetYear
    });

    if (payment) {
      payment.amount = parseFloat(amount);
      payment.updatedAt = new Date();
      await payment.save();
    } else {
      payment = await Payment.create({
        customerId,
        month: targetMonth,
        year: targetYear,
        status: 'Unpaid',
        amount: parseFloat(amount)
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Error updating payment amount:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get payment statistics
exports.getPaymentStats = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Get all payments for the specified year
    const payments = await Payment.find({ year: currentYear });

    // Calculate month-wise statistics (only for Paid payments)
    const monthlyStats = {};
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalAmount = 0;

    for (let month = 1; month <= 12; month++) {
      monthlyStats[month] = {
        month: month,
        monthName: new Date(0, month - 1).toLocaleString('default', { month: 'long' }),
        paid: 0,
        unpaid: 0,
        totalAmount: 0,
        revenue: 0
      };
    }

    payments.forEach(payment => {
      const month = payment.month;
      if (monthlyStats[month]) {
        if (payment.status === 'Paid') {
          monthlyStats[month].paid += 1;
          totalPaid += payment.amount;
          monthlyStats[month].revenue += payment.amount;
        } else {
          monthlyStats[month].unpaid += 1;
          totalUnpaid += payment.amount;
        }
        monthlyStats[month].totalAmount += payment.amount;
        totalAmount += payment.amount;
      }
    });

    res.json({
      success: true,
      stats: {
        year: currentYear,
        totalPaid,
        totalUnpaid,
        totalAmount,
        monthlyStats: Object.values(monthlyStats)
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get revenue statistics
exports.getRevenueStats = async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    let query = { status: 'Paid' };

    // Apply filters
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (year) {
      query.year = parseInt(year);
    } else {
      query.year = currentYear;
    }

    if (month && !startDate) {
      query.month = parseInt(month);
    }

    // Get filtered payments
    const payments = await Payment.find(query);

    // Calculate revenue
    let totalRevenue = 0;
    const monthlyRevenue = {};
    const yearlyRevenue = {};

    payments.forEach(payment => {
      totalRevenue += payment.amount;

      // Monthly revenue
      const monthKey = `${payment.year}-${payment.month}`;
      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = {
          year: payment.year,
          month: payment.month,
          monthName: new Date(0, payment.month - 1).toLocaleString('default', { month: 'long' }),
          revenue: 0
        };
      }
      monthlyRevenue[monthKey].revenue += payment.amount;

      // Yearly revenue
      if (!yearlyRevenue[payment.year]) {
        yearlyRevenue[payment.year] = {
          year: payment.year,
          revenue: 0
        };
      }
      yearlyRevenue[payment.year].revenue += payment.amount;
    });

    // Calculate current month and year revenue
    const currentMonthPayments = await Payment.find({
      status: 'Paid',
      month: currentMonth,
      year: currentYear
    });
    const currentMonthRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);

    const currentYearPayments = await Payment.find({
      status: 'Paid',
      year: currentYear
    });
    const currentYearRevenue = currentYearPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate all-time revenue
    const allTimePayments = await Payment.find({ status: 'Paid' });
    const allTimeRevenue = allTimePayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate growth statistics
    const monthlyRevenueArray = Object.values(monthlyRevenue).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    let growthRate = 0;
    if (monthlyRevenueArray.length >= 2) {
      const lastMonth = monthlyRevenueArray[monthlyRevenueArray.length - 1];
      const previousMonth = monthlyRevenueArray[monthlyRevenueArray.length - 2];
      if (previousMonth.revenue > 0) {
        growthRate = ((lastMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
      }
    }

    res.json({
      success: true,
      stats: {
        totalRevenue: totalRevenue,
        currentMonthRevenue: currentMonthRevenue,
        currentYearRevenue: currentYearRevenue,
        allTimeRevenue: allTimeRevenue,
        monthlyRevenue: Object.values(monthlyRevenue).sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        }),
        yearlyRevenue: Object.values(yearlyRevenue).sort((a, b) => a.year - b.year),
        growthRate: growthRate.toFixed(2),
        currentMonth: currentMonth,
        currentYear: currentYear
      }
    });
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
