import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { handleError, notFound } from "./middlewares/errorHandler";

// Import routes
import productRoutes from "./routes/productsRoutes";
import locationRoutes from "./routes/locationRoutes";
import stockRoutes from "./routes/stockRoutes";

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies

// API Routes
const apiPrefix = process.env.API_PREFIX || "/api";

app.use(`${apiPrefix}/products`, productRoutes);
app.use(`${apiPrefix}/locations`, locationRoutes);
app.use(`${apiPrefix}`, stockRoutes);

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Inventory Management API is running",
    version: "1.0.0",
    endpoints: {
      products: `${apiPrefix}/products`,
      locations: `${apiPrefix}/locations`,
      stockLevels: `${apiPrefix}/stocklevels`,
      stockAdjustments: `${apiPrefix}/stockadjustments`,
      stockTransfers: `${apiPrefix}/stocktransfers`,
    },
  });
});

// API info endpoint
app.get(`${apiPrefix}`, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Inventory Management API",
    version: "1.0.0",
    documentation: "Check the Postman collection for API documentation",
    endpoints: [
      {
        method: "POST",
        path: `${apiPrefix}/products`,
        description: "Create a new product",
      },
      {
        method: "PUT",
        path: `${apiPrefix}/products/:id`,
        description: "Update product details",
      },
      {
        method: "POST",
        path: `${apiPrefix}/locations`,
        description: "Create a new location",
      },
      {
        method: "POST",
        path: `${apiPrefix}/stocklevels/initial`,
        description: "Set initial stock level",
      },
      {
        method: "POST",
        path: `${apiPrefix}/stockadjustments`,
        description: "Record stock adjustment",
      },
      {
        method: "POST",
        path: `${apiPrefix}/stocktransfers`,
        description: "Initiate stock transfer",
      },
      {
        method: "GET",
        path: `${apiPrefix}/products/:productId/stock`,
        description: "Get stock levels for product across locations",
      },
      {
        method: "GET",
        path: `${apiPrefix}/locations/:locationId/stock`,
        description: "Get stock levels for location",
      },
      {
        method: "GET",
        path: `${apiPrefix}/products/low-stock?threshold=X`,
        description: "Get products below threshold across locations",
      },
      {
        method: "GET",
        path: `${apiPrefix}/products/:productId/history`,
        description: "Get stock movement history for product",
      },
    ],
  });
});

// Error handling middleware
app.use(notFound);
app.use(handleError);

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `API endpoints available at: http://localhost:${PORT}${apiPrefix}`
  );
  console.log(`Health check: http://localhost:${PORT}/`);
});

export default app;
