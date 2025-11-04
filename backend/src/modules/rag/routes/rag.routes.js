// routes/rag.js
const express = require("express");
const asyncHandler = require("../../../core/utils/asyncHandler");
const { searchPatientsRAG } = require("../controllers/rag.controller");

const router = express.Router();

router.post("/search", asyncHandler(searchPatientsRAG));

module.exports = router;
