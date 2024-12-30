const { Category } = require("../models/Category");
const cloudinary = require("cloudinary").v2;
const config = require("../config/cloudinaryConfig");
const multer = require('multer');
const Product = require('../models/Products');

cloudinary.config(config.cloudinary);

const storage = multer.memoryStorage(); 
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Helper Function: Upload Images to Cloudinary
const uploadImagesToCloudinary = async (images, batchSize = 2) => {
    const results = [];
    
    for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch.map(image => cloudinary.uploader.upload(image)));
        
        batchResults.forEach(result => {
            if (result.status === "fulfilled") {
                results.push(result.value.secure_url);
            } else {
                console.error(`Failed to upload image: ${result.reason}`);
            }
        });
    }
    
    return results;
};

// Fetch All Categories
const getCategoryList = async (req, res) => {
    try {
        const categoryList = await Category.find();
        if (!categoryList.length) {
            return res.status(404).json({ success: false, message: "No categories found" });
        }
        res.status(200).json({ success: true, data: categoryList });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch categories", error: error.message });
    }
};

// Create Category
const uploadImageToCloudinary = async (files) => {
    // Map each file to its Cloudinary upload result
    return Promise.all(
        files.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path, { folder: 'categories' });
            return result.secure_url;
        })
    );
};

const createCategory = async (req, res) => {
    try {
        const { name, color } = req.body;

        // Check if files are attached
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Images are required' });
        }

        // Check if the name is provided
        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        // Upload images to Cloudinary
        const imageUrls = await uploadImageToCloudinary(req.files);

        // Create a new category
        const category = new Category({
            name,
            color,
            images: imageUrls,
        });

        // Save category to the database
        const savedCategory = await category.save();

        res.status(201).json({ success: true, data: savedCategory, message: 'Category created successfully!' });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
            error: error.message,
        });
    }
};
// Get Category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch category", error: error.message });
    }
};

// Update Category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color, images } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        let imageUrls = category.images;
        if (images && images.length) {
            imageUrls = await uploadImagesToCloudinary(images);
        }

        category.name = name || category.name;
        category.color = color || category.color;
        category.images = imageUrls;

        const updatedCategory = await category.save();

        res.status(200).json({ success: true, data: updatedCategory, message: "Category updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update category", error: error.message });
    }
};

// Delete Category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, data: deletedCategory, message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete category", error: error.message });
    }
};

const getCategoryProducts = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const products = await Product.find({ category: category.name }).populate("category", "name color");

        res.status(200).json({
            success: true,
            data: { category, products },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch category products",
            error: error.message,
        });
    }
};

module.exports = {
    getCategoryList,
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getCategoryProducts
};
