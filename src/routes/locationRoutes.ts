import { Router } from "express";
import {
  createLocation,
  getAllLocations,
  getLocationStockLevels,
  updateLocation,
  getLocationById,
  deleteLocation,
} from "../controllers/locationController";
import {
  validateBody,
  validateMongoId,
  validateParams,
} from "../middlewares/validation";
import {
  createLocationSchema,
  locationIdParamSchema,
  updateLocationSchema,
} from "../validations/schemas";

const router = Router();

router.post("/", validateBody(createLocationSchema), createLocation);

router.get("/", getAllLocations);

router.get(
  "/:locationId/stock",
  validateMongoId("locationId"),
  getLocationStockLevels
);
router.get(
  "/:locationId",
  validateParams(locationIdParamSchema),
  getLocationById
);

router.put(
  "/:locationId",
  validateParams(locationIdParamSchema), // attaches req.validatedParams.locationId
  validateBody(updateLocationSchema), // attaches req.validatedBody
  updateLocation
);

router.delete(
  "/:locationId",
  validateParams(locationIdParamSchema),
  deleteLocation
);

export default router;
