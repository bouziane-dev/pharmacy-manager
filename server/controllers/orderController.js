const Order = require("../models/Order");
const {
  cleanPhoneDigits,
  cleanSingleLine,
  cleanString,
  isValidObjectId,
} = require("../utils/input");
const phonePattern = /^\d+$/;
const arrivalDatePattern = /^\d{4}-\d{2}-\d{2}$/;

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
    const normalizedPatientName = cleanSingleLine(patientName);
    const normalizedPhone = cleanPhoneDigits(phone);
    const normalizedProductName = cleanSingleLine(productName);
    const normalizedArrivalDate = cleanString(arrivalDate);
    const normalizedUrgency = cleanSingleLine(urgency);

    if (!normalizedPatientName) {
      return res.status(400).json({ error: "Patient name is required" });
    }
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Phone is required" });
    }
    if (!phonePattern.test(normalizedPhone)) {
      return res.status(400).json({ error: "Phone must contain digits only" });
    }
    if (!normalizedProductName) {
      return res.status(400).json({ error: "Product name is required" });
    }
    if (!normalizedArrivalDate) {
      return res.status(400).json({ error: "Arrival date is required" });
    }
    if (!arrivalDatePattern.test(normalizedArrivalDate)) {
      return res.status(400).json({ error: "Arrival date must be YYYY-MM-DD" });
    }
    if (!normalizedUrgency) {
      return res.status(400).json({ error: "Urgency is required" });
    }
    if (!["Urgent", "Normal"].includes(normalizedUrgency)) {
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
      patientName: normalizedPatientName,
      phone: normalizedPhone,
      productName: normalizedProductName,
      arrivalDate: normalizedArrivalDate,
      urgency: normalizedUrgency,
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
    const orderId = cleanString(req.params.orderId);
    if (!orderId || !isValidObjectId(orderId)) {
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

      if (["patientName", "productName"].includes(field)) {
        const value = cleanSingleLine(req.body[field]);
        if (!value) {
          return res.status(400).json({ error: `${field} cannot be empty` });
        }
        order[field] = value;
        continue;
      }

      if (field === "phone") {
        const value = cleanPhoneDigits(req.body.phone);
        if (!value) {
          return res.status(400).json({ error: "phone cannot be empty" });
        }
        if (!phonePattern.test(value)) {
          return res.status(400).json({ error: "Phone must contain digits only" });
        }
        order.phone = value;
        continue;
      }

      if (field === "arrivalDate") {
        const value = cleanString(req.body.arrivalDate);
        if (!value) {
          return res.status(400).json({ error: "arrivalDate cannot be empty" });
        }
        if (!arrivalDatePattern.test(value)) {
          return res.status(400).json({ error: "Arrival date must be YYYY-MM-DD" });
        }
        order.arrivalDate = value;
        continue;
      }

      if (field === "urgency") {
        const normalizedUrgency = cleanSingleLine(req.body.urgency);
        if (!["Urgent", "Normal"].includes(normalizedUrgency)) {
          return res.status(400).json({ error: "Invalid urgency value" });
        }
        order.urgency = normalizedUrgency;
        continue;
      }

      if (field === "status") {
        const normalizedStatus = cleanSingleLine(req.body.status);
        if (!["Not Yet", "Ordered", "Arrived"].includes(normalizedStatus)) {
          return res.status(400).json({ error: "Invalid status value" });
        }
        order.status = normalizedStatus;
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
    const orderId = cleanString(req.params.orderId);
    const { text } = req.body;
    const normalizedText = cleanString(text);

    if (!orderId || !isValidObjectId(orderId)) {
      return res.status(400).json({ error: "Valid orderId is required" });
    }

    if (!normalizedText) {
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
      text: normalizedText,
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
