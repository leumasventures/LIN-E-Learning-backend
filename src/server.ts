import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ==============================
// MIDDLEWARE
// ==============================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// API ROUTES
// ==============================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ==============================
// HOME ROUTE
// ==============================

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Leumas Empire Academy API is running"
  });
});

// ==============================
// 404 ROUTE
// ==============================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});