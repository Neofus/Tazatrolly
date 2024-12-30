const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Products");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use", success: false });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedVerificationCode = crypto.createHash("sha256").update(verificationCode).digest("hex");

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, 
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Verification Code",
            text: `Your verification code is ${verificationCode}`,
        };

        transporter.sendMail(mailOptions, async (err, info) => {
            if (err) {
                console.error("Error sending email: ", err);
                return res.status(500).json({ success: false, message: "Could not send email" });
            }

            const newUser = new User({
                name,
                email,
                password,
                verificationCode: hashedVerificationCode,
                isVerified: false,
                IsAdmin: false
            });

            await newUser.save();

            res.status(200).json({
                success: true,
                message: "Verification code sent to email. Please verify to complete registration.",
                userId: newUser._id,
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.verifyUser = async (req, res) => {
    const { userId, verificationCode } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "User already verified", success: false });
        }

        const hashedVerificationCode = crypto.createHash("sha256").update(verificationCode).digest("hex");

        if (hashedVerificationCode !== user.verificationCode) {
            return res.status(400).json({ message: "Invalid verification code", success: false });
        }

        user.isVerified = true;
        user.verificationCode = undefined; 
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email }, 
            process.env.SECRET_CODE, 
            { expiresIn: '30d' } 
        );


        res.status(200).json({
            success: true,
            message: "User verified successfully. Registration complete.",
            token
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email }, 
            process.env.SECRET_CODE, 
            { expiresIn: '30d' } 
        );
        res.status(200).json({ success: true, message: "Logged in successfully", id: user._id, name: user.name, email: user.email, phone: user.phone, token: token, });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User Not Found", success: false });
        }

        res.status(200).json({ message: "User Deleted successfully", success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User Not Found", success: false });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            message: "Updated successfully",
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

exports.writeReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { userName, comment, rating, productId } = req.body;
console.log(productId)
        if (!userName || !comment || !rating) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        console.log("Incoming data:", req.body);
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Add the new review
        const newReview = { userName, comment, rating };
        product.reviews.push(newReview);

        // Update rating and number of reviews
        product.numOfReviews = product.reviews.length;
        product.rating =
            product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.numOfReviews;

        await product.save();

        res.status(201).json({ success: true, message: "Review submitted successfully", product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

exports.rateProduct = async (req, res) => {
    const { productId, rating } = req.body;

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product Not Found", success: false });
        }

        product.rating = ((product.rating * product.numOfReviews) + rating) / (product.numOfReviews + 1);

        const updatedProduct = await product.save();

        res.status(200).json({ success: true, message: "Product rated", rating: updatedProduct.rating });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
}


exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist", success: false });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hash = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.resetPasswordToken = hash;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour

        await user.save();

        const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;

        const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password:</p>
            <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
        `;

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: "Password Reset Request",
            html: message,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Error sending email: ", err);
                return res.status(500).json({ success: false, message: "Email could not be sent" });
            }
            res.status(200).json({ success: true, message: "Email sent successfully", info });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const hash = crypto.createHash("sha256").update(token).digest("hex");

    try {
        const user = await User.findOne({
            resetPasswordToken: hash,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.getUserProfile = async (req, res) => {
console.log(req.headers.authorization)
try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET_CODE);
        // Find the user by ID
        const user = await User.findById(decoded.userId);

        if (!user) {
            console.log("User not found");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Disable caching
        res.set('Cache-Control', 'no-store');

        // Send user info without password and other sensitive info
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
