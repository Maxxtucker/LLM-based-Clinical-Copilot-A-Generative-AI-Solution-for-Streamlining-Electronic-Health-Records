const express = require("express");
const router = express.Router();
router.all("*", (_, res) => {
  res.status(410).json({ error: "Legacy /api/visits route removed. Use /api/patients/:id/visits." });
});
module.exports = router;
