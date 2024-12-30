const express = require("express");
const {
  placeOrder,
  getUserOrders,
  updateDeliveryStatus,
  getOrderStatus
} = require("../controller/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/place", placeOrder); 
router.get("/", protect, getUserOrders); 
router.put("/:orderId/delivery", protect, adminOnly, updateDeliveryStatus); 
router.get("/order-status/:orderId", getOrderStatus); 

module.exports = router;
