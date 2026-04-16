const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const resolvePharmacyFromSlug = require("../middleware/resolvePharmacyFromSlug");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.use(requireAuth);
router.use(resolvePharmacyFromSlug);
router.use(requirePharmacyAccess(["owner", "staff"]));

router.get("/", taskController.listTasks);
router.post("/", taskController.createTask);
router.patch("/:taskId", taskController.updateTask);
router.delete("/:taskId", taskController.deleteTask);
router.post("/:taskId/comments", taskController.addTaskComment);

module.exports = router;
