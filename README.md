# Inventory-Mgt-API-Project
# Inventory Management Backend

This is a backend API for a basic Inventory Management System built with Node.js and TypeScript. It integrates with MongoDB using Mongoose for database operations.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/dextinedsam79/Inventory-Mgt-API-Project.git
   ```

2. Navigate to the project directory:
   ```
   cd Inventory-API
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

## Usage

To start the application, run:
```
npm run dev
```

The server will start on `http://localhost:4000`.

## API Endpoints

- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update an existing product
- `GET /api/products` -gets all products
- `POST /api/locations` - Create a new location
- `GET /api/locations` - Gets all locations
- `PUT /api/locations/:id` Updates a location info
- `POST /api/stocklevels/initial` - Set initial stock level for a product
- `POST /api/stockadjustments` - Record a stock adjustment
- `POST /api/stockTransfers` - Initiate a stock transfer




