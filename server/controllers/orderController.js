const Order = require("../models/Order");
const ActivityLog = require("../models/ActivityLog");
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
  called: "called",
  arrived: "arrived",
  pending: "pending",
  done: "finished",
  finished: "finished",
};
const allowedCategories = new Set([
  "general",
  "orthopedie",
  "caba",
  "medicament",
  "parapharmacie",
  "dermo-cosmetique",
]);

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

function normalizeCategoryInput(inputValue) {
  const normalized = cleanSingleLine(inputValue);
  if (!normalized) return "general";
  const slug = String(normalized).toLowerCase();
  return allowedCategories.has(slug) ? slug : null;
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
    createdByName:
      orderDoc.createdBy?.displayName ||
      orderDoc.createdBy?.name ||
      orderDoc.createdBy?.email ||
      null,
    patientName: orderDoc.patientName,
    phone: orderDoc.phone,
    products,
    category: normalizeCategoryInput(orderDoc.category) || "general",
    status: normalizeStatusInput(orderDoc.status) || "pending",
    versement: Number(orderDoc.versement || 0),
    arrivalDate: orderDoc.arrivalDate,
    createdAt: orderDoc.createdAt,
    comments: (orderDoc.comments || []).map((item) => ({
      id: String(item._id),
      author: item.authorName,
      authorUserId: item.authorUserId ? String(item.authorUserId) : null,
      text: item.text,
      createdAt: item.createdAt,
    })),
  };
}

async function listOrders(req, res) {
  try {
    const orders = await Order.find({ pharmacyId: req.pharmacyId })
      .populate("createdBy", "name displayName email")
      .sort({
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
    const {
      patientName,
      phone,
      products,
      productName,
      arrivalDate,
      versement,
      comment,
      category,
    } =
      req.body;
    const normalizedPatientName = cleanSingleLine(patientName);
    const normalizedPhone = cleanPhoneDigits(phone);
    const normalizedProducts = normalizeProductsInput(products, productName);
    const normalizedArrivalDate = cleanString(arrivalDate);
    const normalizedVersement = normalizeVersementInput(versement);
    const normalizedCategory = normalizeCategoryInput(category);

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
    if (normalizedArrivalDate && !arrivalDatePattern.test(normalizedArrivalDate)) {
      return res.status(400).json({ error: "Arrival date must be YYYY-MM-DD" });
    }
    if (normalizedVersement === null) {
      return res
        .status(400)
        .json({ error: "Versement must be a valid non-negative number" });
    }
    if (!normalizedCategory) {
      return res.status(400).json({ error: "Invalid category value" });
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
      category: normalizedCategory,
      arrivalDate: normalizedArrivalDate || "",
      versement: normalizedVersement,
      status: "pending",
      comments,
    });
    await order.populate("createdBy", "name displayName email");

    await logActivity({
      action: "CREATE_ORDER",
      description: `Created order for ${normalizedPatientName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        orderId: String(order._id),
        patientName: order.patientName,
        category: normalizedCategory,
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
    }).populate("createdBy", "name displayName email");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const previousStatus = normalizeStatusInput(order.status) || "pending";

    const allowedFields = [
      "patientName",
      "phone",
      "products",
      "category",
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
        if (value && !arrivalDatePattern.test(value)) {
          return res.status(400).json({ error: "Arrival date must be YYYY-MM-DD" });
        }
        order.arrivalDate = value || "";
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

      if (field === "category") {
        const value = normalizeCategoryInput(req.body.category);
        if (!value) {
          return res.status(400).json({ error: "Invalid category value" });
        }
        order.category = value;
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
    }).populate("createdBy", "name displayName email");

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
        commentId: String(order.comments[order.comments.length - 1]?._id || ""),
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

async function deleteOrderComment(req, res) {
  try {
    const orderId = cleanString(req.params.orderId);
    const commentId = cleanString(req.params.commentId);

    if (!orderId || !isValidObjectId(orderId)) {
      return res.status(400).json({ error: "Valid orderId is required" });
    }
    if (!commentId || !isValidObjectId(commentId)) {
      return res.status(400).json({ error: "Valid commentId is required" });
    }

    const order = await Order.findOne({
      _id: orderId,
      pharmacyId: req.pharmacyId,
    }).populate("createdBy", "name displayName email");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const comment = order.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (String(comment.authorUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }

    comment.deleteOne();
    await order.save();

    await logActivity({
      action: "DELETE_ORDER_COMMENT",
      description: `Deleted comment on order ${orderId}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        orderId,
        commentId,
      },
    });

    return res.status(200).json({
      message: "Comment deleted successfully",
      order: toClientOrder(order),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function listOrderActions(req, res) {
  try {
    const orderId = cleanString(req.params.orderId);
    if (!orderId || !isValidObjectId(orderId)) {
      return res.status(400).json({ error: "Valid orderId is required" });
    }

    const order = await Order.exists({
      _id: orderId,
      pharmacyId: req.pharmacyId,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const items = await ActivityLog.find({
      pharmacyId: req.pharmacyId,
      "metadata.orderId": orderId,
    })
      .populate("userId", "name displayName email")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      actions: items.map((item) => ({
        id: String(item._id),
        action: item.action,
        description: item.description || "",
        user: {
          id: item.userId?._id ? String(item.userId._id) : null,
          name:
            item.userId?.displayName ||
            item.userId?.name ||
            item.userId?.email ||
            "Unknown",
        },
        createdAt: item.createdAt,
      })),
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
  deleteOrderComment,
  deleteOrder,
  listOrderActions,
};
