import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { validateBody } from '../middlewares/validation';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import Product from '../models/productModel';
import Location from '../models/locationModel';
import StockLevel from '../models/stockLevelModel';
import StockAdjustment from '../models/stockAdjustmentModel';
import StockTransfer from '../models/stockTransferModel';
import { ValidatedRequest } from '../middlewares/validation';


// POST /api/stockadjustments - Record Stock Adjustment
export const recordStockAdjustment = asyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  const { productId, locationId, type, quantityChange, reason, adjustedBy } = req.validatedBody;

  // Verify product and location exist
  const [product, location] = await Promise.all([
    Product.findById(productId),
    Location.findById(locationId)
  ]);

  if (!product) {
    return next(createError('Product not found', 404));
  }
  if (!location) {
    return next(createError('Location not found', 404));
  }

  // Find existing stock level
  const stockLevel = await StockLevel.findOne({ 
    product: productId, 
    location: locationId 
  });

  if (!stockLevel) {
    return next(createError('Stock level entry not found for this product and location', 404));
  }

  // Calculate new stock quantity
  const newQuantity = stockLevel.quantity + quantityChange;

  // Check for negative stock
  if (newQuantity < 0) {
    return next(createError('Insufficient stock. Current quantity: ' + stockLevel.quantity, 400));
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Update stock level
      await StockLevel.findByIdAndUpdate(
        stockLevel._id,
        { quantity: newQuantity },
        { session }
      );

      // Create stock adjustment record
      const stockAdjustment = new StockAdjustment({
        product: productId,
        location: locationId,
        type,
        quantityChange,
        currentStock: newQuantity,
        reason,
        adjustedBy
      });

      await stockAdjustment.save({ session });
    });

    // Fetch the created adjustment with populated fields
    const createdAdjustment = await StockAdjustment.findOne({
      product: productId,
      location: locationId
    }).sort({ timestamp: -1 }).populate([
      { path: 'product', select: 'name sku' },
      { path: 'location', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Stock adjustment recorded successfully',
      data: createdAdjustment
    });

  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

