/**
 * Firebase Cloud Functions
 * Node.js 20
 * Express + MongoDB Atlas
 * Folder structure aware
 */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Firebase Functions v2
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// ================= SECRETS =================
const MONGODB_URI_SECRET = defineSecret("MONGODB_URI_SECRET");
const JWT_SECRET_SECRET = defineSecret("JWT_SECRET_SECRET");
const CLOUDINARY_CLOUD_NAME_SECRET = defineSecret("CLOUDINARY_CLOUD_NAME_SECRET");
const CLOUDINARY_API_KEY_SECRET = defineSecret("CLOUDINARY_API_KEY_SECRET");
const CLOUDINARY_API_SECRET_SECRET = defineSecret("CLOUDINARY_API_SECRET_SECRET");

// ================= APP INIT =================
const app = express();

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ================= SECRETS LOAD =================
function ensureRuntimeSecrets() {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = JWT_SECRET_SECRET.value();
  if (!process.env.CLOUDINARY_CLOUD_NAME) process.env.CLOUDINARY_CLOUD_NAME = CLOUDINARY_CLOUD_NAME_SECRET.value();
  if (!process.env.CLOUDINARY_API_KEY) process.env.CLOUDINARY_API_KEY = CLOUDINARY_API_KEY_SECRET.value();
  if (!process.env.CLOUDINARY_API_SECRET) process.env.CLOUDINARY_API_SECRET = CLOUDINARY_API_SECRET_SECRET.value();
}

let routesMounted = false;
function ensureRoutesMounted() {
  if (routesMounted) return;

  // ================= ROUTES =================
  // NOTE: index.js is inside /functions
  // routes are inside /src/routes
  app.use("/properties", require("./src/routes/propertyRoutes"));
  app.use("/property-drafts", require("./src/routes/propertyDraftRoutes"));
  app.use("/auth", require("./src/routes/authRoutes"));
  app.use("/users", require("./src/routes/userRoutes"));
  app.use("/offers", require("./src/routes/offerRoutes"));
  app.use("/payments", require("./src/routes/paymentRoutes"));
  app.use("/rents", require("./src/routes/rentRoutes"));
  app.use("/agreements", require("./src/routes/agreementRoutes"));

  routesMounted = true;
}

// ================= DB CONNECTION =================
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const uri = MONGODB_URI_SECRET.value();
  if (!uri) {
    throw new Error("❌ MONGODB_URI is not defined");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = true;
  console.log("✅ MongoDB connected");
}

// Ensure DB connection before routes
app.use(async (req, res, next) => {
  try {
    ensureRuntimeSecrets();
    ensureRoutesMounted();
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ================= EXPORT FUNCTION =================
exports.apiV2 = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [
      MONGODB_URI_SECRET,
      JWT_SECRET_SECRET,
      CLOUDINARY_CLOUD_NAME_SECRET,
      CLOUDINARY_API_KEY_SECRET,
      CLOUDINARY_API_SECRET_SECRET,
    ],
  },
  app
);
