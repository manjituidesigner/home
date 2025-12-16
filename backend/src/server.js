const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// ================= LOAD ENV =================
dotenv.config();

// ================= APP INIT =================
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ================= SAFETY CHECK =================
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in .env");
  process.exit(1);
}

// ================= CORS CONFIG =================
const CORS_ALLOW_ALL =
  String(process.env.CORS_ALLOW_ALL || "").toLowerCase() === "true";

const envOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      const allowlist = [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
      ];

      if (envOrigins.length) allowlist.push(...envOrigins);
      if (!origin) return callback(null, true);
      if (CORS_ALLOW_ALL) return callback(null, true);
      if (allowlist.includes(origin)) return callback(null, true);

      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
  })
);

// ================= BODY PARSERS =================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ================= ROUTES =================
const propertyRoutes = require("./routes/propertyRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const offerRoutes = require("./routes/offerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const rentRoutes = require("./routes/rentRoutes");
const agreementRoutes = require("./routes/agreementRoutes");

app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/rents", rentRoutes);
app.use("/api/agreements", agreementRoutes);

// ================= HEALTH CHECK =================
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ================= DB + SERVER START =================
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ================= GLOBAL ERROR HANDLERS =================
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
