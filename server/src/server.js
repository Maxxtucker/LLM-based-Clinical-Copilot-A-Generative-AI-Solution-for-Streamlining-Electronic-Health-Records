// server/src/server.js
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const { connectToDB } = require("./config/db");
const { connection } = require("mongoose");

// View engine for HTML report preview
const exphbs = require("express-handlebars");

// --- ROUTES (modules)
const checkupRoutes      = require("./routes/checkup_route");
const reportApiRoutes    = require("./routes/report_routes");
const reportRenderRoutes = require("./routes/report_render_routes");
const pdfRoutes          = require("./routes/pdf_routes");
const aiReportRoutes     = require("./routes/ai_report_routes");
const patientRoutes      = require("./routes/patient_route");

(async function start() {
  try {
    // ----------------------------
    // DB connection (Atlas or in-memory)
    // ----------------------------
    const useInMemory = String(process.env.USE_IN_MEMORY || "").toLowerCase() === "true";
    let uri = process.env.MONGO_URI;

    if (useInMemory) {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log("[DB] Using in-memory MongoDB for development. Data resets on restart.");
    }

    if (!uri) throw new Error("MONGO_URI not set (or USE_IN_MEMORY=true not configured)");

    await connectToDB(uri);
    console.log("✅ DB connected to:", connection.name);

    // ----------------------------
    // Build Express app + middleware
    // ----------------------------
    const app = express();

    // If behind a proxy (local dev via some tools / future deployment)
    app.set("trust proxy", true);

    // Security & performance basics
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(compression());

    // CORS (allow your frontend)
    const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
    app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

    // Body parsers
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));

    // View engine for the HTML report preview
    app.engine("hbs", exphbs.engine({ extname: ".hbs" }));
    app.set("view engine", "hbs");
    app.set("views", path.join(__dirname, "views"));

    // ----------------------------
    // Health check
    // ----------------------------
    app.get("/healthz", (_req, res) => res.json({ ok: true, db: connection?.name || null }));

    // ----------------------------
    // Mount routes
    // ----------------------------
    // Historical vitals + snapshot updates
    app.use("/api/checkups", checkupRoutes);

    // Aggregation APIs used by the preview
    app.use("/api/reports", reportApiRoutes);

    // Server-rendered report preview (HTML)
    app.use("/reports", reportRenderRoutes);

    // PDF export (e.g., /reports/preview.pdf)
    app.use("/", pdfRoutes);

    // Prompt → plan → data (used by your frontend prompt box)
    app.use("/api/ai", aiReportRoutes);

    // Patient CRUD (existing)
    app.use("/api/patients", patientRoutes);

    // 404 fallback (optional)
    app.use((req, res, next) => {
      if (res.headersSent) return next();
      res.status(404).json({ error: "Not found", path: req.originalUrl });
    });

    // Central error handler (optional but helpful)
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, _next) => {
      console.error("Unhandled error:", err);
      res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
    });

    // ----------------------------
    // Start server
    // ----------------------------
    const port = process.env.PORT || 5000;
    const server = app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down…");
      try { await connection.close(); } catch {}
      server.close(() => process.exit(0));
    });
    process.on("SIGTERM", async () => {
      console.log("\n🛑 Shutting down…");
      try { await connection.close(); } catch {}
      server.close(() => process.exit(0));
    });

  } catch (err) {
    console.error("\n[Startup] API failed to start.");
    console.error("Reason:", err?.message || err);
    console.error("Tips:");
    console.error("- If using MongoDB Atlas, whitelist your IP or allow 0.0.0.0/0 for testing.");
    console.error("- Verify MONGO_URI + credentials.");
    console.error("- Or set USE_IN_MEMORY=true in server/.env to run an in-memory DB for local dev.");
    process.exit(1);
  }
})();
