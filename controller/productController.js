const Product = require("../models/Products");
const { Category } = require("../models/Category");
const cloudinary = require("cloudinary").v2;
const config = require("../config/cloudinaryConfig");
const multer = require('multer');

cloudinary.config(config.cloudinary);

const storage = multer.memoryStorage(); 
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit for images

const getAllProducts = async (req, res) => {
    try {
        const category = req.query.category;
        let filter = {};

        if (category) {
            filter = { category };
        }

        const products = await Product.find(filter).populate("category", "name color");

        if (!products.length) {
            return res.status(404).json({
                success: false,
                message: "No products found",
            });
        }

        res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("category", "name color");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "No product found",
            });
        }
        console.log(product)
        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const createProduct = async (req, res) => {
    try {
        let category;
        if (req.body.category) {
            category = await Category.find({ name: req.body.category });
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: "Category not found",
                });
            }
        }

        const uploadStatus = await Promise.all(
            req.files.map(async (file) => {
                const result = await cloudinary.uploader.upload(file.path);
                return result.secure_url;
            })
        );

        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            brand: req.body.brand,
            category: req.body.category,
            stock: req.body.stock,
            price: req.body.price,
            discount: req.body.discount || 0,
            images: uploadStatus,
        });

        const savedProduct = await product.save();

        res.status(201).json({
            success: true,
            data: savedProduct,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const updateProduct = async (req, res) => {
    try {
        let category;
        if (req.body.category) {
            category = await Category.find({ name: req.body.category });
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: "Category not found",
                });
            }
        }

        const existingProduct = await Product.findById(req.params.id);

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        let imageUrls = existingProduct.images;

        if (req.files && req.files.length > 0) {
            const uploadedImages = await Promise.all(
                req.files.map(async (file) => {
                    const result = await cloudinary.uploader.upload(file.path);
                    return result.secure_url;
                })
            );
            imageUrls = [...imageUrls, ...uploadedImages];
        }

        existingProduct.name = req.body.name || existingProduct.name;
        existingProduct.description = req.body.description || existingProduct.description;
        existingProduct.price = req.body.price || existingProduct.price;
        existingProduct.discount = req.body.discount || existingProduct.discount;
        existingProduct.stock = req.body.stock || existingProduct.stock;
        existingProduct.images = imageUrls;
        existingProduct.brand = req.body.brand || existingProduct.brand;
        existingProduct.category = req.body.category || existingProduct.category;

        const updatedProduct = await existingProduct.save();
        
        res.status(200).json({
            success: true,
            data: updatedProduct,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



const deleteProduct = async (req, res) => {
    try {
        const deleteProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deleteProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete a specific image from a product
const deleteProductImage = async (req, res) => {
    const { id } = req.params;
    const { image } = req.body;

    try {
        // Find the product by ID
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Check if the image URL exists in the product's images array
        const imageIndex = product.images.indexOf(image);
        if (imageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Image not found in product',
            });
        }

        // Remove the image from Cloudinary
        const publicId = image.split('/').pop().split('.')[0]; // Extract the public ID from the URL
        await cloudinary.uploader.destroy(publicId);

        // Remove the image from the product's images array
        product.images.splice(imageIndex, 1);
        await product.save();

        res.status(200).json({
            success: true,
            message: 'Image removed successfully!',
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const searchProducts = async (req, res) => {
    console.log("Search request received");
    try {
        const { query } = req.query;
        console.log("Query:", query);

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Query parameter is required",
            });
        }

        const products = await Product.find({ name: { $regex: query, $options: 'i' } });

        console.log("Search results:", products);

        res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        console.error("Error during search:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch search results",
            error: error.message,
        });
    }
};

const getRelatedProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        let relatedProducts = [];
        if (product.category) {
            relatedProducts = await Product.find({
                category: product.category,
                _id: { $ne: id }, // Exclude the current product
            }).limit(5); // Limit the number of related products
        }

        res.status(200).json({
            success: true,
            data: {
                product,         // Searched product details
                relatedProducts, // List of related products
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductImage,
    searchProducts,
    getRelatedProducts
};
