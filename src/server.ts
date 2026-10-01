import "dotenv/config";
import express from "express";
import cors from "cors";

import { testDbConnection } from "./config/db.js";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin === true ? true : env.corsOrigin,
    credentials: true,
  })
);

app.use(express.json());

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await testDbConnection();

    console.log("Database connection successful.");
    console.log(`API listening on port ${env.port}`);
    console.log(`CORS origin: ${env.corsOrigin}`);

    app.listen(env.port, () => {
      console.log(`API listening on port ${env.port}`);
    });
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
}

start();