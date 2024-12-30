const express = require("express");
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  clearWishlist,
} = require("../controller/wishListController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, addToWishlist);
router.delete("/remove/:productId", protect, removeFromWishlist);
router.get("/", protect, getWishlist);
router.delete("/clear", protect, clearWishlist);

module.exports = router;
