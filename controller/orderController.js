const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");
const Order = require("../models/Order");
const User = require("../models/User"); const jwt = require("jsonwebtoken");

exports.placeOrder = async (req, res) => {
  let token = req.headers.authorization; 
  try {
    let isPaid = false;
    let paidAt = null;

    const {
      items,
      totalAmount,
      paymentMethod,
      shippingAddress,
      contactNumber,
      guestInfo
    } = req.body;

    if (token) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.SECRET_CODE);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      if (paymentMethod === "CARD") {
        return res.status(400).json({
          success: false,
          message: "Card payment is not available at the moment. Please select Cash on Delivery.",
        });
      }

      const order = await Order.create({
        userId: user._id,
        items,
        totalAmount,
        paymentMethod,
        isPaid,
        paidAt,
        shippingAddress,
        contactNumber,
      });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"Your Store" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Order Confirmation",
        text: `Thank you for your order! Your order ID is ${order._id}.`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(201).json({
        success: true,
        message: "Order placed successfully.",
        order,
      });

    } else {
      const order = await Order.create({
        items,
        totalAmount,
        paymentMethod,
        isPaid,
        paidAt,
        shippingAddress,
        contactNumber,
        guestInfo
      });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"Your Store" <${process.env.SMTP_USER}>`,
        to: guestInfo.email,
        subject: "Order Confirmation",
        text: `Thank you for your order! Your order ID is ${order._id}.`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(201).json({
        success: true,
        message: "Order placed successfully.",
        order,
      });
    }


  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get User Orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId});

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update Order Delivery Status (Admin)
exports.updateDeliveryStatus = async (req, res) => {
  const { orderId } = req.params;
  const { isDelivered } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    order.isDelivered = isDelivered;
    order.deliveredAt = isDelivered ? new Date() : null;

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order delivery status updated to ${isDelivered ? "delivered" : "not delivered"
        }.`,
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  console.log(orderId)

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
