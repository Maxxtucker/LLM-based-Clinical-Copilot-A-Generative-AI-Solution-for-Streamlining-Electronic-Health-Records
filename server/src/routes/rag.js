// routes/rag.js
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { searchPatientsRAG } = require("../controllers/ragController");

const router = express.Router();

router.post("/search", asyncHandler(searchPatientsRAG));

module.exports = router;
