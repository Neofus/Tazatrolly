const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
            productTitle: {
                type: String,
                required: true,
                trim: true,
            },
            image: {
                type: [String],
                required: true
            },
            price: {
                type: Number,
                default: 0,
                min: 0,
            },
            quantity: {
                type: Number,
                min: 1,
                required: true,
            },
            total: {
                type: Number,
                required: true,
            },

        },
    ],
    cartTotal: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true
});

exports.Cart = mongoose.model("Cart", cartSchema);