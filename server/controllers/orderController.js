const mongoose = require("mongoose");
const Order = require("../models/Order");

function toClientOrder(orderDoc) {
  return {
    id: String(orderDoc._id),
    pharmacyId: String(orderDoc.pharmacyId),
    patientName: orderDoc.patientName,
    phone: orderDoc.phone,
    productName: orderDoc.productName,
    status: orderDoc.status,
    urgency: orderDoc.urgency,
    arrivalDate: orderDoc.arrivalDate,
    createdAt: orderDoc.createdAt,
    comments: (orderDoc.comments || []).map((item) => ({
      id: String(item._id),
      author: item.authorName,
      text: item.text,
      createdAt: item.createdAt,
    })),
  };
}

async function listOrders(req, res) {
  try {
    const orders = await Order.find({ pharmacyId: req.pharmacyId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      orders: orders.map(toClientOrder),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createOrder(req, res) {
  try {
    const { patientName, phone, productName, arrivalDate, urgency, comment } =
      req.body;

    if (!patientName || !String(patientName).trim()) {
      return res.status(400).json({ error: "Patient name is required" });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ error: "Phone is required" });
    }
    if (!productName || !String(productName).trim()) {
      return res.status(400).json({ error: "Product name is required" });
    }
    if (!arrivalDate || !String(arrivalDate).trim()) {
      return res.status(400).json({ error: "Arrival date is required" });
    }
    if (urgency && !["Urgent", "Normal"].includes(urgency)) {
      return res.status(400).json({ error: "Invalid urgency value" });
    }

    const comments = [];
    if (comment && String(comment).trim()) {
      comments.push({
        authorUserId: req.user._id,
        authorName: req.user.displayName || req.user.email,
        text: String(comment).trim(),
      });
    }

    const order = await Order.create({
      pharmacyId: req.pharmacyId,
      patientName: String(patientName).trim(),
      phone: String(phone).trim(),
      productName: String(productName).trim(),
      arrivalDate: String(arrivalDate).trim(),
      urgency: urgency || "Normal",
      status: "Not Yet",
      comments,
    });

    return res.status(201).json({
      message: "Order created successfully",
      order: toClientOrder(order),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updateOrder(req, res) {
  try {
    const { orderId } = req.params;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Valid orderId is required" });
    }

    const order = await Order.findOne({
      _id: orderId,
      pharmacyId: req.pharmacyId,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const allowedFields = [
      "patientName",
      "phone",
      "productName",
      "arrivalDate",
      "urgency",
      "status",
    ];

    for (const field of allowedFields) {
      if (req.body[field] === undefined) continue;

      if (["patientName", "phone", "productName", "arrivalDate"].includes(field)) {
        const value = String(req.body[field]).trim();
        if (!value) {
          return res.status(400).json({ error: `${field} cannot be empty` });
        }
        order[field] = value;
        continue;
      }

      if (field === "urgency") {
        if (!["Urgent", "Normal"].includes(req.body.urgency)) {
          return res.status(400).json({ error: "Invalid urgency value" });
        }
        order.urgency = req.body.urgency;
        continue;
      }

      if (field === "status") {
        if (!["Not Yet", "Ordered", "Arrived"].includes(req.body.status)) {
          return res.status(400).json({ error: "Invalid status value" });
        }
        order.status = req.body.status;
      }
    }

    await order.save();

    return res.status(200).json({
      message: "Order updated successfully",
      order: toClientOrder(order),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function addOrderComment(req, res) {
  try {
    const { orderId } = req.params;
    const { text } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Valid orderId is required" });
    }

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const order = await Order.findOne({
      _id: orderId,
      pharmacyId: req.pharmacyId,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.comments.push({
      authorUserId: req.user._id,
      authorName: req.user.displayName || req.user.email,
      text: String(text).trim(),
    });

    await order.save();

    return res.status(200).json({
      message: "Comment added successfully",
      order: toClientOrder(order),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listOrders,
  createOrder,
  updateOrder,
  addOrderComment,
};
