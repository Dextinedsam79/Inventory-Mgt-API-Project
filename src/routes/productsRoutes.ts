import { Router } from 'express';
import {
  createProduct,
  updateProduct,
  getProductStockLevels,
  getLowStockProducts,
  getProductHistory,
  getAllProducts,
  getProductById,
  deleteProduct,
} from '../controllers/productController';

import {
  validateBody,
  validateParams,
  validateQuery
} from '../middlewares/validation';

import {
  createProductSchema,
  updateProductSchema,
  lowStockQuerySchema,
  mongoIdParamSchema,
  productIdParamSchema
} from '../validations/schemas';

const router = Router();

router.post('/', validateBody(createProductSchema), createProduct);

router.put(
  '/:id',
  validateParams(mongoIdParamSchema),
  validateBody(updateProductSchema),
  updateProduct
);

router.get('/low-stock', validateQuery(lowStockQuerySchema), getLowStockProducts);
router.get('/', getAllProducts);

router.get('/:productId/stock', validateParams(productIdParamSchema ), getProductStockLevels);

router.get('/:productId/history', validateParams(productIdParamSchema ), getProductHistory);
router.get(
  "/:productId",
  validateParams(mongoIdParamSchema),
  getProductById
);

router.delete(
  "/:productId",
  validateParams(mongoIdParamSchema),
  deleteProduct
);
export default router;
