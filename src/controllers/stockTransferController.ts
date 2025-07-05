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


// POST /api/stocktransfers - Initiate Stock Transfer
export const initiateStockTransfer = asyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  const { productId, fromLocationId, toLocationId, quantity, requestedBy } = req.validatedBody;

  // Verify product and locations exist
  const [product, fromLocation, toLocation] = await Promise.all([
    Product.findById(productId),
    Location.findById(fromLocationId),
    Location.findById(toLocationId)
  ]);

  if (!product) {
    return next(createError('Product not found', 404));
  }
  if (!fromLocation) {
    return next(createError('From location not found', 404));
  }
  if (!toLocation) {
    return next(createError('To location not found', 404));
  }

  // Find source stock level
  const sourceStockLevel = await StockLevel.findOne({
    product: productId,
    location: fromLocationId
  });

  if (!sourceStockLevel) {
    return next(createError('No stock found at source location', 404));
  }

  // Check sufficient quantity
  if (sourceStockLevel.quantity < quantity) {
    return next(createError(`Insufficient stock. Available: ${sourceStockLevel.quantity}`, 400));
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Create stock transfer record
      const stockTransfer = new StockTransfer({
        product: productId,
        fromLocation: fromLocationId,
        toLocation: toLocationId,
        quantity,
        status: 'completed', // Completing immediately as per requirements
        requestedBy,
        completionTimestamp: new Date()
      });

      await stockTransfer.save({ session });

      // Update source location stock level
      await StockLevel.findByIdAndUpdate(
        sourceStockLevel._id,
        { $inc: { quantity: -quantity } },
        { session }
      );

      // Find or create destination stock level
      let destinationStockLevel = await StockLevel.findOne({
        product: productId,
        location: toLocationId
      }).session(session);

      if (destinationStockLevel) {
        // Update existing destination stock level
        await StockLevel.findByIdAndUpdate(
          destinationStockLevel._id,
          { $inc: { quantity: quantity } },
          { session }
        );
      } else {
        // Create new destination stock level
        destinationStockLevel = new StockLevel({
          product: productId,
          location: toLocationId,
          quantity
        });
        await destinationStockLevel.save({ session });
      }
    });

    // Fetch the created transfer with populated fields
    const createdTransfer = await StockTransfer.findOne({
      product: productId,
      fromLocation: fromLocationId,
      toLocation: toLocationId
    }).sort({ requestTimestamp: -1 }).populate([
      { path: 'product', select: 'name sku' },
      { path: 'fromLocation', select: 'name' },
      { path: 'toLocation', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Stock transfer completed successfully',
      data: createdTransfer
    });

  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});