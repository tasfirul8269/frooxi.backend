import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Define valid categories for expenses and income
const EXPENSE_CATEGORIES = [
  'housing', 'utilities', 'food', 'transportation', 
  'healthcare', 'entertainment', 'shopping', 'education', 
  'travel', 'other'
];

const INCOME_CATEGORIES = [
  'salary', 'freelance', 'investment', 'gift', 'other_income'
];

const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['expense', 'income'],
        message: 'Transaction type must be either expense or income'
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      set: v => parseFloat(v).toFixed(2)
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [3, 'Description must be at least 3 characters'],
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      validate: {
        validator: function(v) {
          return v instanceof Date && !isNaN(v);
        },
        message: props => `${props.value} is not a valid date!`
      }
    },
    reference: {
      type: String,
      trim: true,
      maxlength: [100, 'Reference cannot exceed 100 characters']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add indexes for better query performance
transactionSchema.index({ createdBy: 1, date: -1 });
transactionSchema.index({ createdBy: 1, type: 1, category: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return this.amount.toFixed(2);
});

// Pre-save hook - category validation removed to allow any category
transactionSchema.pre('save', function(next) {
  // Convert category to lowercase and trim
  if (this.category) {
    this.category = this.category.trim();
  }
  next();
});

// Static method to get all valid categories
transactionSchema.statics.getCategories = function(type = null) {
  if (type === 'expense') return EXPENSE_CATEGORIES;
  if (type === 'income') return INCOME_CATEGORIES;
  return ALL_CATEGORIES;
};

// Add pagination plugin
transactionSchema.plugin(mongoosePaginate);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
