const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");

router.get("/reports/preview.pdf", async (req, res) => {
  const url = `${req.protocol}://${req.get("host")}/reports/preview`;
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "12mm", bottom:"12mm" } });
  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=report.pdf");
  res.send(pdf);
});

module.exports = router;
