const express = require("express");
const router = express.Router();
const multer = require('multer'); 
const upload = multer({ dest: 'uploads/'});
const { getCategoryList, createCategory, getCategoryById, deleteCategory, updateCategory, getCategoryProducts } = require("../controller/categoryController");

router.get("/", getCategoryList);
router.post("/create", upload.array('images'), createCategory);
router.get("/:id", getCategoryById);
router.delete("/:id", deleteCategory);
router.put("/:id", upload.array('images'), updateCategory);
router.get("/:id/products", getCategoryProducts);

module.exports = router;