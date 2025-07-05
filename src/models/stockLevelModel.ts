import mongoose, { Document, Schema } from 'mongoose';
import { IProduct } from './productModel';
import { ILocation } from './locationModel';

export interface IStockLevel extends Document {
  product: IProduct['_id'];
  location: ILocation['_id'];
  quantity: number;
  lastUpdated: Date;
}

const StockLevelSchema: Schema = new Schema({
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
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure unique product-location combination
StockLevelSchema.index({ product: 1, location: 1 }, { unique: true });

// Additional indexes for better query performance
StockLevelSchema.index({ product: 1 });
StockLevelSchema.index({ location: 1 });
StockLevelSchema.index({ quantity: 1 });

// Update lastUpdated on save
StockLevelSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

export default mongoose.model<IStockLevel>('StockLevel', StockLevelSchema);