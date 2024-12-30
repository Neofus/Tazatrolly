const express = require("express");
const {
    addorUpdateCartItem,
    getCart,
    removeCartItems,
    clearCart,
    
} = require("../controller/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, addorUpdateCartItem); 
router.get("/", protect, getCart); 
router.delete("/remove", protect, removeCartItems);  
router.delete("/clear", protect, clearCart);  

module.exports = router;
