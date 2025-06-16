import asyncHandler from 'express-async-handler';
import Transaction from '../models/Transaction.js';

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
  try {
    const { type, amount, category, description, date, reference } = req.body;

    // Validate required fields
    if (!type || !['income', 'expense'].includes(type)) {
      res.status(400);
      throw new Error('Invalid transaction type. Must be income or expense');
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      res.status(400);
      throw new Error('Amount must be a positive number');
    }

    // Parse date or use current date
    const transactionDate = date ? new Date(date) : new Date();
    if (isNaN(transactionDate.getTime())) {
      res.status(400);
      throw new Error('Invalid date format');
    }

    const transaction = new Transaction({
      type,
      amount: parseFloat(amount).toFixed(2),
      category,
      description: description || '',
      date: transactionDate,
      reference: reference || '',
      createdBy: req.user._id,
    });

    const createdTransaction = await transaction.save();
    res.status(201).json(createdTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      message: error.message || 'Error creating transaction',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Get all transactions with filtering
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  try {
    const { 
      type, 
      category, 
      startDate, 
      endDate, 
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    const query = { createdBy: req.user._id };

    // Apply filters
    if (type) query.type = type;
    if (category) query.category = category;
    
    // Handle date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          res.status(400);
          throw new Error('Invalid startDate format. Use YYYY-MM-DD');
        }
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          res.status(400);
          throw new Error('Invalid endDate format. Use YYYY-MM-DD');
        }
        // Set to end of day
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const options = {
      sort,
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Limit max 100 items per page
      populate: 'createdBy',
      lean: true
    };

    // Execute query with pagination
    const transactions = await Transaction.paginate(query, options);
    
    res.json({
      data: transactions.docs,
      total: transactions.totalDocs,
      page: transactions.page,
      limit: transactions.limit,
      totalPages: transactions.totalPages
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      message: error.message || 'Error fetching transactions',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = asyncHandler(async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      message: error.message || 'Error fetching transaction',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
  try {
    const { type, amount, category, description, date, reference } = req.body;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    // Update transaction fields
    if (type) transaction.type = type;
    if (amount) transaction.amount = parseFloat(amount).toFixed(2);
    if (category) transaction.category = category;
    if (description) transaction.description = description;
    if (date) {
      const newDate = new Date(date);
      if (!isNaN(newDate.getTime())) {
        transaction.date = newDate;
      }
    }
    if (reference !== undefined) transaction.reference = reference;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      message: error.message || 'Error updating transaction',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      message: error.message || 'Error deleting transaction',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Get transaction summary
// @route   GET /api/transactions/summary
// @access  Private
const getTransactionSummary = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const match = { createdBy: req.user._id };
    
    // Handle date filtering
    if (startDate || endDate) {
      match.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          res.status(400);
          throw new Error('Invalid startDate format. Use YYYY-MM-DD');
        }
        match.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          res.status(400);
          throw new Error('Invalid endDate format. Use YYYY-MM-DD');
        }
        // Set to end of day
        end.setHours(23, 59, 59, 999);
        match.date.$lte = end;
      }
    }

    // Get total income and expenses
    const summary = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate summary
    const income = summary.find(s => s._id === 'income')?.total || 0;
    const expenses = summary.find(s => s._id === 'expense')?.total || 0;
    const totalTransactions = summary.reduce((acc, curr) => acc + curr.count, 0);

    // Get monthly data
    const monthlyData = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format monthly data
    const formattedMonthlyData = monthlyData.map(item => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      income: item.income || 0,
      expenses: item.expenses || 0
    }));

    // Get category data
    const categoryData = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            type: '$type',
            category: '$category'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          categories: {
            $push: {
              name: '$_id.category',
              value: '$total'
            }
          }
        }
      }
    ]);

    // Format category data
    const formattedCategoryData = [
      ...(categoryData.find(d => d._id === 'income')?.categories || []).map(c => ({
        ...c,
        type: 'income'
      })),
      ...(categoryData.find(d => d._id === 'expense')?.categories || []).map(c => ({
        ...c,
        type: 'expense'
      }))
    ];

    res.json({
      income,
      expenses,
      balance: income - expenses,
      totalTransactions,
      monthlyData: formattedMonthlyData,
      categoryData: formattedCategoryData
    });
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    res.status(500).json({
      message: error.message || 'Error fetching transaction summary',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary
};
