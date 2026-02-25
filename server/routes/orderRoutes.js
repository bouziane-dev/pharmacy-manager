const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireMembership = require("../middleware/requireMembership");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.get("/", requireAuth, requireMembership(), orderController.listOrders);
router.post("/", requireAuth, requireMembership(), orderController.createOrder);
router.patch(
  "/:orderId",
  requireAuth,
  requireMembership(),
  orderController.updateOrder
);
router.post(
  "/:orderId/comments",
  requireAuth,
  requireMembership(),
  orderController.addOrderComment
);

module.exports = router;
