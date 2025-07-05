import { Response, NextFunction } from 'express';
import { validateBody } from '../middlewares/validation';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import Location from '../models/locationModel';
import StockLevel from '../models/stockLevelModel';
import { ValidatedRequest } from '../middlewares/validation';

// POST /api/locations - Create New Location
export const createLocation = asyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  const { name, address, contactPerson } = req.validatedBody;

  // Check if location with same name already exists
  const existingLocation = await Location.findOne({ name });
  if (existingLocation) {
    return next(createError('Location with this name already exists', 400));
  }

  const location = new Location({
    name,
    address,
    contactPerson
  });

  await location.save();

  res.status(201).json({
    success: true,
    message: 'Location created successfully',
    data: location
  });
});

export const updateLocation = asyncHandler(
  async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    // 1) Pull validated params & body
    const { locationId } = req.validatedParams!;
    const updateData = req.validatedBody!;

    // 2) Filter out only the fields your Location schema allows
    const allowedFields = ['name', 'address', 'city', 'state', 'zip'];
    const filteredData: Partial<Record<typeof allowedFields[number], any>> = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    // 3) Perform the update in one step
    const updated = await Location.findByIdAndUpdate(
      locationId,
      filteredData,
      { new: true, runValidators: true }
    );

    // 4) Handle not‑found
    if (!updated) {
      return next(createError(`Location with id ${locationId} not found`, 404));
    }

    // 5) Success response
    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: updated,
    });
  }
);

//getAllLocation
// GET /api/locations - Get All Locations
export const getAllLocations = asyncHandler(
  async (_req: ValidatedRequest, res: Response, _next: NextFunction) => {
    // Fetch & sort alphabetically by name
    const locations = await Location.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations,
    });
  }
);

// GET /api/locations/:locationId/stock - Get Stock Levels for Location
export const getLocationStockLevels = asyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  const { locationId } = req.validatedParams;

  // Verify location exists
  const location = await Location.findById(locationId);
  if (!location) {
    return next(createError('Location not found', 404));
  }

  const stockLevels = await StockLevel.find({ location: locationId })
    .populate('product', 'name sku price category unitOfMeasurement')
    .sort({ 'product.name': 1 });

  res.status(200).json({
    success: true,
    message: 'Location stock levels retrieved successfully',
    data: stockLevels
  });
});

// GET /api/locations/:locationId - Get Location by ID
// This endpoint retrieves a single location by its ID.
export const getLocationById = asyncHandler(
  async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    const { locationId } = req.validatedParams;
    const location = await Location.findById(locationId);
    if (!location) {
      return next(createError('Location not found', 404));
    }
    res.status(200).json({
      success: true,
      data: location,
    });
  }
);

export const deleteLocation = asyncHandler(
  async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    const { locationId } = req.validatedParams;
    const location = await Location.findByIdAndDelete(locationId);
    if (!location) {
      return next(createError('Location not found', 404));
    }
    res.status(200).json({
      success: true,
      message: 'Location deleted successfully',
    });
  }
);