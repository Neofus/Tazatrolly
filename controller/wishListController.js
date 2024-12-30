const Wishlist = require("../models/WishList");
const Product = require("../models/Products")

// Add or Update Wishlist Item
exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;

  try {
    const userId = req.user._id;

    let wishlist = await Wishlist.findOne({ userId });
    // Create a new wishlist if none exists
    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId,
        items: [{ productId }],
      });
      return res.status(201).json({
        success: true,
        message: "Wishlist created and product added.",
        wishlist,
      });
    }

    // Check if the product already exists in the wishlist
    const isProductInWishlist = wishlist.items.some(
      (item) => item.productId.toString() === productId
    );

    if (isProductInWishlist) {
      return res.status(400).json({
        success: false,
        message: "Product is already in the wishlist.",
      });
    }

    // Add the new product to the wishlist
    wishlist.items.push({ productId });
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Product added to wishlist.",
      wishlist,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Remove Product from Wishlist
exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  try {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found.",
      });
    }

    // Filter out the product to be removed
    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist.",
      wishlist,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Wishlist for a User
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ userId }).populate({
      path: 'items.productId',
      select: 'name price images', // Only fetch required fields
    });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found.",
        wishlist: []
      });
    }

    // Format response with only the needed fields
    const formattedWishlist = wishlist.items.map(item => ({
      id: item._id,
      name: item.productId ? item.productId.name : 'Deleted Product',
      price: item.productId ? item.productId.price : 0,
      image: item.productId && item.productId.images ? item.productId.images[0] : 'No Image',
      addedAt: item.addedAt,
    }));

    res.status(200).json({
      success: true,
      wishlist: formattedWishlist,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// Clear Wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found.",
      });
    }

    wishlist.items = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Wishlist cleared.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
