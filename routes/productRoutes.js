const express = require("express");
const router = express.Router();
const { 
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductImage,
    searchProducts,
    getRelatedProducts
} = require("../controller/productController");
const multer = require('multer'); 
const upload = multer({ dest: 'uploads/'});

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", upload.array('images'), createProduct); 
router.put("/:id", upload.array('images'), updateProduct);
router.delete("/:id", deleteProduct); 
router.delete("/:id/images", deleteProductImage); 
router.get("/search", searchProducts);
router.get("/:id/related", getRelatedProducts);


module.exports = router;
