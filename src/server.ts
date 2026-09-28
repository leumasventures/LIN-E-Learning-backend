import { testDbConnection } from "./config/db.js";
import express from "express";
import cors from "cors";
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

app.listen(env.port, () => {
  console.log(`API listening on https://elerning.leumasitnexus.com:${env.port}`);
  console.log("Demo (password: Password123!):");
  console.log("  student:  chinedu.okafor@student.edu | CSC/2023/041");
  console.log("  admin:    admin@school.edu");
  console.log("  lecturer: a.obi@school.edu");
});

async function start() {
  try {
    await testDbConnection();
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`API listening on https://elerning.leumasitnexus.com:${env.port}`);
  });
}

start();