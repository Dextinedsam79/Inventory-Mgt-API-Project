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

// POST /api/stocklevels/initial - Set Initial Stock Level
export const setInitialStockLevel = asyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  const { productId, locationId, quantity } = req.validatedBody;

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

  // Start a session for transaction
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Find existing stock level
      let stockLevel = await StockLevel.findOne({ 
        product: productId, 
        location: locationId 
      }).session(session);

      let oldQuantity = 0;
      let isCreated = false;

      if (stockLevel) {
        // Update existing stock level
        oldQuantity = stockLevel.quantity;
        stockLevel.quantity = quantity;
        await stockLevel.save({ session });
      } else {
        // Create new stock level
        stockLevel = new StockLevel({
          product: productId,
          location: locationId,
          quantity
        });
        await stockLevel.save({ session });
        isCreated = true;
      }

      // Create stock adjustment record
      const quantityChange = quantity - oldQuantity;
      const stockAdjustment = new StockAdjustment({
        product: productId,
        location: locationId,
        type: 'initial',
        quantityChange,
        currentStock: quantity,
        reason: 'Initial stock level setup'
      });

      await stockAdjustment.save({ session });

      // Populate the stock level for response
      await stockLevel.populate([
        { path: 'product', select: 'name sku' },
        { path: 'location', select: 'name' }
      ]);

      return { stockLevel, stockAdjustment, isCreated };
    });

    // Re-fetch the updated stock level with populated fields
    const updatedStockLevel = await StockLevel.findOne({
      product: productId,
      location: locationId
    }).populate([
      { path: 'product', select: 'name sku' },
      { path: 'location', select: 'name' }
    ]);

    const latestAdjustment = await StockAdjustment.findOne({
      product: productId,
      location: locationId,
      type: 'initial'
    }).sort({ timestamp: -1 }).populate([
      { path: 'product', select: 'name sku' },
      { path: 'location', select: 'name' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Initial stock level set successfully',
      data: {
        stockLevel: updatedStockLevel,
        stockAdjustment: latestAdjustment
      }
    });

  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

