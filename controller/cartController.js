const { Cart } = require("../models/Cart");
const cloudinary = require("cloudinary").v2;
const config = require("../config/cloudinaryConfig");
const multer = require('multer');

cloudinary.config(config.cloudinary);

const storage = multer.memoryStorage(); 
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit for images


exports.addorUpdateCartItem = async (req, res) => {
    const { productTitle, price, quantity, productId, images } = req.body;

    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId });
        const itemTotal = price * quantity;

        // Handle image upload
        let imageUrls = [];
        if (images && images.length > 0) {
            imageUrls = await Promise.all(
                images.map(async (image) => {
                    const result = await cloudinary.uploader.upload(image);
                    return result.secure_url;
                })
            );
        }

        if (!cart) {
            // Create new cart
            const newCart = await Cart.create({
                userId,
                items: [
                    {
                        productTitle,
                        image: imageUrls.length > 0 ? imageUrls[0] : null, // Use the first image or null
                        price,
                        quantity,
                        productId,
                        total: itemTotal,
                    },
                ],
                cartTotal: itemTotal,
            });
            return res.status(201).json({ message: "Cart created", success: true, cart: newCart });
        }

        // Update existing cart
        const existingCartIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );

        if (existingCartIndex > -1) {
            cart.items[existingCartIndex].quantity += quantity;
            cart.items[existingCartIndex].total += itemTotal;

            if (imageUrls.length > 0) {
                cart.items[existingCartIndex].image = imageUrls[0];
            }
        } else {
            cart.items.push({
                productTitle,
                image: imageUrls.length > 0 ? imageUrls[0] : null,
                price,
                quantity,
                productId,
                total: itemTotal,
            });
        }

        cart.cartTotal = cart.items.reduce((sum, item) => sum + item.total, 0);
        await cart.save();

        res.status(200).json({ message: "Cart updated", success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId });

        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ success: false, message: "Your cart is empty" });
        }

        const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

        res.status(200).json({ success: false, cart, totalItems });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", });
    }
}

exports.removeCartItems = async (req, res) => {
    const { productId } = req.body;
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
        cart.cartTotal = cart.items.reduce((sum, item) => sum + item.total, 0);

        await cart.save();

        res.status(200).json({ success: false, cart, message: "Item removed from cart" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", });
    }
}

exports.clearCart = async (req, res) => {
    const { productId } = req.body;
    console.log(123)

    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        cart.items = [];
        cart.cartTotal = 0;

        await cart.save();

        res.status(200).json({ success: false, cart, message: "Cart cleared successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", });
    }
}