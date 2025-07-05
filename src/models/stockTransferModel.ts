import mongoose, { Document, Schema } from 'mongoose';
import { IProduct } from './productModel';
import { ILocation } from './locationModel';

export interface IStockTransfer extends Document {
  product: IProduct['_id'];
  fromLocation: ILocation['_id'];
  toLocation: ILocation['_id'];
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  requestTimestamp: Date;
  completionTimestamp?: Date;
  requestedBy?: string;
}

const StockTransferSchema: Schema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  fromLocation: {
    type: Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'From location reference is required']
  },
  toLocation: {
    type: Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'To location reference is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['pending', 'completed', 'cancelled'],
      message: 'Status must be one of: pending, completed, cancelled'
    },
    default: 'pending'
  },
  requestTimestamp: {
    type: Date,
    default: Date.now
  },
  completionTimestamp: {
    type: Date
  },
  requestedBy: {
    type: String,
    trim: true,
    maxlength: [100, 'Requested by cannot exceed 100 characters']
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
StockTransferSchema.index({ product: 1, requestTimestamp: -1 });
StockTransferSchema.index({ fromLocation: 1, requestTimestamp: -1 });
StockTransferSchema.index({ toLocation: 1, requestTimestamp: -1 });
StockTransferSchema.index({ status: 1 });
StockTransferSchema.index({ requestTimestamp: -1 });

// Validation to ensure fromLocation and toLocation are different
StockTransferSchema.pre('validate', function(next) {
  if (this.fromLocation && this.toLocation && this.fromLocation.toString() === this.toLocation.toString()) {
    next(new Error('From location and to location cannot be the same'));
  } else {
    next();
  }
});

// Set completion timestamp when status changes to completed or cancelled
StockTransferSchema.pre('save', function(next) {
  if (this.isModified('status') && (this.status === 'completed' || this.status === 'cancelled')) {
    this.completionTimestamp = new Date();
  }
  next();
});

export default mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);