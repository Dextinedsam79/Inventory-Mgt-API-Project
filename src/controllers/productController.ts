import { Response, NextFunction } from 'express';
import { validateBody } from '../middlewares/validation';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import Product from '../models/productModel';
import StockLevel from '../models/stockLevelModel';
import StockAdjustment from '../models/stockAdjustmentModel';
import StockTransfer from '../models/stockTransferModel';
import { ValidatedRequest } from '../middlewares/validation';

// POST /api/products - Create New Product
export const createProduct = asyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  const { name, sku, description, category, unitOfMeasurement, price } = req.validatedBody;

  // Check if product with same SKU already exists
  const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
  if (existingProduct) {
      next(res.status(400).json({ error: 'Product with this SKU already exists' }));
    return
  }

  const product = new Product({
    name,
    sku: sku.toUpperCase(),
    description,
    category,
    unitOfMeasurement,
    price
  });

  await product.save();

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

// PUT /api/products/:id - Update Product Details
export const updateProduct = asyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.validatedParams;
  const updateData = req.validatedBody;

  const product = await Product.findById(id);
  if (!product) {
    return next(createError('Product not found', 404));
  }

  // Update allowed fields only
  const allowedFields = ['name', 'description', 'category', 'unitOfMeasurement', 'price'];
  const filteredData: any = {};
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    filteredData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
});
//getAllProducts
// GET /api/products - Get All Products
export const getAllProducts = asyncHandler(
  async (_req: ValidatedRequest, res: Response, _next: NextFunction) => {
    const products = await Product.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  }
);

// Get a single product by ID
export const getProductById = asyncHandler(
  async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    const { productId } = req.validatedParams;
    const product = await Product.findById(productId);
    if (!product) {
      return next(createError('Product not found', 404));
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  }
);

// Delete a product by ID
export const deleteProduct = asyncHandler(
  async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    const { productId } = req.validatedParams;
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return next(createError('Product not found', 404));
    }
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  }
);

// GET /api/products/:productId/stock - Get Stock Levels for Product Across Locations
export const getProductStockLevels = asyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  const { productId } = req.validatedParams;

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(createError('Product not found', 404));
  }

  const stockLevels = await StockLevel.find({ product: productId })
    .populate('location', 'name address contactPerson')
    .sort({ 'location.name': 1 });

  res.status(200).json({
    success: true,
    message: 'Product stock levels retrieved successfully',
    data: stockLevels
  });
});

// GET /api/products/low-stock - Get Products Below Threshold Across Locations
export const getLowStockProducts = asyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  const { threshold } = req.validatedQuery;

  // Option 1: Explicitly type as any[]
  const pipeline: any[] = [
    // Stage 1: Match stock levels for active products
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    {
      $unwind: '$productDetails'
    },
    {
      $match: {
        'productDetails.isActive': true
      }
    },
    // Stage 2: Group by product and sum quantities
    {
      $group: {
        _id: '$product',
        totalStock: { $sum: '$quantity' },
        productDetails: { $first: '$productDetails' }
      }
    },
    // Stage 3: Match products below threshold
    {
      $match: {
        totalStock: { $lt: threshold }
      }
    },
    // Stage 4: Project final structure
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: '$productDetails.name',
        sku: '$productDetails.sku',
        category: '$productDetails.category',
        price: '$productDetails.price',
        totalStock: 1
      }
    },
    {
      $sort: { totalStock: 1, name: 1 }
    }
  ];

  const lowStockProducts = await StockLevel.aggregate(pipeline);

  res.status(200).json({
    success: true,
    message: 'Low stock products retrieved successfully',
    data: lowStockProducts
  });
});

// GET /api/products/:productId/history - Get Stock Movement History for Product
export const getProductHistory = asyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  const { productId } = req.validatedParams;

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(createError('Product not found', 404));
  }

  // Get stock adjustments
  const adjustments = await StockAdjustment.find({ product: productId })
    .populate('location', 'name')
    .lean();

  // Get stock transfers
  const transfers = await StockTransfer.find({ product: productId })
    .populate('fromLocation', 'name')
    .populate('toLocation', 'name')
    .lean();

  // Combine and format the results
  const history = [
    ...adjustments.map((adj: any) => ({
      type: 'adjustment',
      id: adj._id,
      adjustmentType: adj.type,
      location: adj.location,
      quantityChange: adj.quantityChange,
      currentStock: adj.currentStock,
      reason: adj.reason,
      timestamp: adj.timestamp,
      adjustedBy: adj.adjustedBy
    })),
    ...transfers.map((transfer: any) => ({
      type: 'transfer',
      id: transfer._id,
      fromLocation: transfer.fromLocation,
      toLocation: transfer.toLocation,
      quantity: transfer.quantity,
      status: transfer.status,
      timestamp: transfer.requestTimestamp,
      completionTimestamp: transfer.completionTimestamp,
      requestedBy: transfer.requestedBy
    }))
  ];

  // Sort by timestamp (most recent first)
  history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.status(200).json({
    success: true,
    message: 'Product history retrieved successfully',
    data: history
  });
});