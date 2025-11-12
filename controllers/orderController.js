import { Order } from "../models/order.model.js";
import { Products } from "../models/product.model.js";
import createError from "http-errors";
import nodemailer from "nodemailer";

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Create a new order
export const createOrders = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    const username = req.user?.username;

    const adminEmail = process.env.USER_EMAIL || "ttelectronicsapril2025@gmail.com";

    if (!userId) {
      throw createError.Unauthorized("Authentication required");
    }

    const { products: items, shippingAddress, deliveryOption, paymentMethod } = req.body;

    if (!items?.length || !shippingAddress || !deliveryOption || !paymentMethod) {
      throw createError.BadRequest("Missing required fields");
    }

    // Process each product
    let totalAmount = 0;
    const detailedProducts = await Promise.all(
      items.map(async ({ product: prodId, quantity }) => {
        const prod = await Products.findById(prodId);
        if (!prod) throw createError.NotFound(`Product not found: ${prodId}`);
        if (quantity < 1) throw createError.BadRequest(`Invalid quantity for product: ${prod.name}`);
        if (prod.stock < quantity) throw createError.BadRequest(`Insufficient stock for product: ${prod.name}`);

        const price = prod.priceAfterDiscount ?? prod.price;
        totalAmount += price * quantity;

        prod.stock -= quantity;
        await prod.save();

        return {
          product: prod._id,
          quantity,
          priceAtPurchase: price,
        };
      })
    );

    const newOrder = await Order.create({
      user: userId,
      products: detailedProducts,
      shippingAddress,
      deliveryOption,
      paymentMethod,
      totalAmount,
    });

    // Prepare email text content
    const productList = detailedProducts
      .map((p) => `- ${p.quantity} x ${p.product} @ $${p.priceAtPurchase}`)
      .join("\n");

    const emailContent = `
Hello ${username},

🛍️ Your order has been placed successfully!

🧾 Order Summary:
${productList}

📦 Delivery: ${deliveryOption}
💳 Payment: ${paymentMethod}
📍 Shipping: ${shippingAddress.street}, ${shippingAddress.city}

💰 Total: $${totalAmount.toFixed(2)}

Thank you for choosing T.T. Electronics!
    `;

    // Email options
    const mailOptions = {
      from: "ttelectronicsapril2025@gmail.com",
      to: [userEmail, userRole !== "admin" ? adminEmail : null].filter(Boolean),
      subject: "🛒 Order Confirmation - T.T. Electronics",
      text: emailContent,
    };

    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Email error:", err);
        return next(createError(500, "Failed to send confirmation email"));
      }

      return res.status(201).json({
        success: true,
        message: "Order placed successfully. Confirmation email sent.",
        order: newOrder,
      });
    });
  } catch (err) {
    next(err);
  }
};

// Get all orders
export const getAllOrders = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      throw createError.Unauthorized("Authentication required");
    }

    const query = userRole === "admin" ? {} : { user: userId };

    const orders = await Order.find(query)
      .populate("products.product", "name price brand")
      .populate("user", "username email tel")
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (err) {
    next(err);
  }
};

// Get single order
export const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createError.Unauthorized("Authentication required");
    }

    const { id } = req.params;
    const order = await Order.findById(id).populate("products.product", "name price brand");

    if (!order) throw createError.NotFound("Order not found");
    if (!order.user.equals(userId)) {
      throw createError.Forbidden("Not authorized to view this order");
    }

    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
};

// Delete order
export const deleteOrders = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      throw createError.Unauthorized("Authentication required");
    }

    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) throw createError.NotFound("Order not found");

    if (userRole !== "admin" && !order.user.equals(userId)) {
      throw createError.Forbidden("Not authorized to delete this order");
    }

    await order.deleteOne();
    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    next(err);
  }
};
