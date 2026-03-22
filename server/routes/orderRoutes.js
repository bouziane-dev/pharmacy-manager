const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const resolvePharmacyFromSubdomain = require("../middleware/resolvePharmacyFromSubdomain");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.use(resolvePharmacyFromSubdomain);
router.use(requireAuth);
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
router.post(
  "/:orderId/comments",
  orderController.addOrderComment
);

module.exports = router;
