const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");

const app = express();

const helmet = require('helmet');
app.use(helmet());

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware
app.use(cors());
app.options("*", cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

// Route Imports
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishListRoutes = require("./routes/wishListRoutes");
const dashboard = require("./routes/dashboardRoutes");


const morgan = require("morgan");
app.use(morgan("dev")); 

// API Routes
app.use("/api/category", categoryRoutes);
app.use("/api/products", productRoutes); 
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes); 
app.use("/api/wishlist", wishListRoutes);
app.use("/api/dashboard", dashboard);


// Fallback for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found",
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// Database Connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Database connection successful!");
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
