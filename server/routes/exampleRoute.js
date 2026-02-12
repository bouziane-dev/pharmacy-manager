const express = require("express");
const router = express.Router();
const exampleController = require("../controllers/exampleController");

//GET request
router.get("/", exampleController.get_function);

module.exports = router;
