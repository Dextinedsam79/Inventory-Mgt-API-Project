import mongoose, { Document, Schema } from 'mongoose';
import { IProduct } from './productModel';
import { ILocation } from './locationModel';

export interface IStockAdjustment extends Document {
  product: IProduct['_id'];
  location: ILocation['_id'];
  type: 'add' | 'remove' | 'damage' | 'loss' | 'initial';
  quantityChange: number;
  currentStock: number;
  reason?: string;
  timestamp: Date;
  adjustedBy?: string;
}

const StockAdjustmentSchema: Schema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  location: {
    type: Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location reference is required']
  },
  type: {
    type: String,
    required: [true, 'Adjustment type is required'],
    enum: {
      values: ['add', 'remove', 'damage', 'loss', 'initial'],
      message: 'Type must be one of: add, remove, damage, loss, initial'
    }
  },
  quantityChange: {
    type: Number,
    required: [true, 'Quantity change is required']
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Current stock cannot be negative']
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  adjustedBy: {
    type: String,
    trim: true,
    maxlength: [100, 'Adjusted by cannot exceed 100 characters']
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
StockAdjustmentSchema.index({ product: 1, timestamp: -1 });
StockAdjustmentSchema.index({ location: 1, timestamp: -1 });
StockAdjustmentSchema.index({ timestamp: -1 });
StockAdjustmentSchema.index({ type: 1 });

export default mongoose.model<IStockAdjustment>('StockAdjustment', StockAdjustmentSchema);