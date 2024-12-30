const express = require("express");
const router = express.Router();
const {
    registerUser,
    verifyUser,
    loginUser,
    deleteUser,
    updateUser,
    writeReview,
    rateProduct,
    forgotPassword,
    resetPassword,
    getUserProfile
} = require("../controller/userController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/verify", verifyUser);
router.post("/login", loginUser);
router.delete("/:id", deleteUser);
router.put("/:id", updateUser);
router.post("/:id/review", writeReview);
router.post("/rate", rateProduct);
router.post("/forgotpassword", forgotPassword);
router.put("/passwordreset/:token", resetPassword);
router.get('/me', getUserProfile);


module.exports = router;