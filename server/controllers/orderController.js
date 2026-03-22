const Order = require("../models/Order");
const {
  cleanPhoneDigits,
  cleanSingleLine,
  cleanString,
  isValidObjectId,
} = require("../utils/input");
const { logActivity } = require("../services/activityLogger");
const phonePattern = /^\d+$/;
const arrivalDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const statusAliases = {
  "not yet": "pending",
  ordered: "ordered",
  arrived: "finished",
  pending: "pending",
  done: "finished",
  finished: "finished",
};

function normalizeProductsInput(productsInput, fallbackProductName = null) {
  if (Array.isArray(productsInput)) {
    return productsInput
      .map((item) => cleanSingleLine(item))
      .filter((item) => Boolean(item));
  }

  const fallback = cleanSingleLine(fallbackProductName);
  return fallback ? [fallback] : [];
}

function normalizeVersementInput(inputValue) {
  if (inputValue === undefined || inputValue === null || inputValue === "") {
    return 0;
  }

  const normalized = Number(inputValue);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return null;
  }

  return normalized;
}

function normalizeStatusInput(inputValue) {
  const normalized = cleanSingleLine(inputValue);
  if (!normalized) return null;
  return statusAliases[String(normalized).toLowerCase()] || null;
}

function toClientOrder(orderDoc) {
  const mappedProducts = Array.isArray(orderDoc.products)
    ? orderDoc.products
    : [];
  const fallbackProductName = cleanSingleLine(orderDoc.productName);
  const products =
    mappedProducts.length > 0
      ? mappedProducts
      : fallbackProductName
      ? [fallbackProductName]
      : [];

  return {
    id: String(orderDoc._id),
    pharmacyId: String(orderDoc.pharmacyId),
    createdBy: orderDoc.createdBy ? String(orderDoc.createdBy) : null,
    patientName: orderDoc.patientName,
    phone: orderDoc.phone,
    products,
    status: normalizeStatusInput(orderDoc.status) || "pending",
    versement: Number(orderDoc.versement || 0),
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
    const { patientName, phone, products, productName, arrivalDate, versement, comment } =
      req.body;
    const normalizedPatientName = cleanSingleLine(patientName);
    const normalizedPhone = cleanPhoneDigits(phone);
    const normalizedProducts = normalizeProductsInput(products, productName);
    const normalizedArrivalDate = cleanString(arrivalDate);
    const normalizedVersement = normalizeVersementInput(versement);

    if (!normalizedPatientName) {
      return res.status(400).json({ error: "Patient name is required" });
    }
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Phone is required" });
    }
    if (!phonePattern.test(normalizedPhone)) {
      return res.status(400).json({ error: "Phone must contain digits only" });
    }
    if (normalizedProducts.length === 0) {
      return res.status(400).json({ error: "At least one product is required" });
    }
    if (!normalizedArrivalDate) {
      return res.status(400).json({ error: "Arrival date is required" });
    }
    if (!arrivalDatePattern.test(normalizedArrivalDate)) {
      return res.status(400).json({ error: "Arrival date must be YYYY-MM-DD" });
    }
    if (normalizedVersement === null) {
      return res
        .status(400)
        .json({ error: "Versement must be a valid non-negative number" });
    }

    const comments = [];
    if (comment && String(comment).trim()) {
      comments.push({
        authorUserId: req.user._id,
        authorName: req.user.displayName || req.user.name || req.user.email || "Staff",
        text: String(comment).trim(),
      });
    }

    const order = await Order.create({
      pharmacyId: req.pharmacyId,
      createdBy: req.user._id,
      patientName: normalizedPatientName,
      phone: normalizedPhone,
      products: normalizedProducts,
      arrivalDate: normalizedArrivalDate,
      versement: normalizedVersement,
      status: "pending",
      comments,
    });

    await logActivity({
      action: "CREATE_ORDER",
      description: `Created order for ${normalizedPatientName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        orderId: String(order._id),
        patientName: order.patientName,
        status: normalizeStatusInput(order.status) || "pending",
      },
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

    const previousStatus = normalizeStatusInput(order.status) || "pending";

    const allowedFields = [
      "patientName",
      "phone",
      "products",
      "arrivalDate",
      "versement",
      "status",
    ];

    for (const field of allowedFields) {
      if (req.body[field] === undefined) continue;

      if (field === "patientName") {
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

      if (field === "products") {
        const value = normalizeProductsInput(req.body.products, null);
        if (value.length === 0) {
          return res
            .status(400)
            .json({ error: "At least one product is required" });
        }
        order.products = value;
        continue;
      }

      if (field === "versement") {
        const value = normalizeVersementInput(req.body.versement);
        if (value === null) {
          return res
            .status(400)
            .json({ error: "Versement must be a valid non-negative number" });
        }
        order.versement = value;
        continue;
      }

      if (field === "status") {
        const normalizedStatus = normalizeStatusInput(req.body.status);
        if (!normalizedStatus) {
          return res.status(400).json({ error: "Invalid status value" });
        }
        order.status = normalizedStatus;
      }
    }

    await order.save();

    const nextStatus = normalizeStatusInput(order.status) || "pending";
    const statusChanged = previousStatus !== nextStatus;
    await logActivity({
      action: statusChanged ? "UPDATE_STATUS" : "UPDATE_ORDER",
      description: statusChanged
        ? `Updated order ${orderId} status from ${previousStatus} to ${nextStatus}`
        : `Updated order ${orderId}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        orderId: String(order._id),
        oldStatus: previousStatus,
        newStatus: nextStatus,
      },
    });

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
      authorName: req.user.displayName || req.user.name || req.user.email || "Staff",
      text: normalizedText,
    });

    await order.save();

    await logActivity({
      action: "ADD_ORDER_COMMENT",
      description: `Added comment on order ${orderId}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        orderId,
      },
    });

    return res.status(200).json({
      message: "Comment added successfully",
      order: toClientOrder(order),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function deleteOrder(req, res) {
  try {
    const orderId = cleanString(req.params.orderId);
    if (!orderId || !isValidObjectId(orderId)) {
      return res.status(400).json({ error: "Valid orderId is required" });
    }

    const order = await Order.findOneAndDelete({
      _id: orderId,
      pharmacyId: req.pharmacyId,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await logActivity({
      action: "DELETE_ORDER",
      description: `Deleted order ${orderId}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        orderId,
        patientName: order.patientName,
      },
    });

    return res.status(200).json({
      message: "Order deleted successfully",
      orderId,
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
  deleteOrder,
};
