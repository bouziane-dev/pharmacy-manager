const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const resolvePharmacyFromSlug = require("../middleware/resolvePharmacyFromSlug");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.use(requireAuth);
router.use(resolvePharmacyFromSlug);
router.use(requirePharmacyAccess(["owner", "staff"]));

router.get("/", orderController.listOrders);
router.post("/", orderController.createOrder);
router.patch(
  "/:orderId",
  orderController.updateOrder
);
router.delete(
  "/:orderId",
  orderController.deleteOrder
);
router.get(
  "/:orderId/actions",
  orderController.listOrderActions
);
router.post(
  "/:orderId/comments",
  orderController.addOrderComment
);
router.delete(
  "/:orderId/comments/:commentId",
  orderController.deleteOrderComment
);

module.exports = router;
