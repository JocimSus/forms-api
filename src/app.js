import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import fs from "fs";

import { ZodError } from "zod";
import { corsConfig } from "./middleware/cors.js";
import { restrictInProd } from "./middleware/restrict.js";
import { authRouter } from "./routes/auth.js";
import { formsRouter } from "./routes/forms.js";
import { healthRouter } from "./routes/health.js";

const app = express();
const file = fs.readFileSync("swagger.yaml", "utf8");
const swaggerDocument = YAML.parse(file);
dotenv.config();

app.use(corsConfig);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  "/v1/docs",
  restrictInProd,
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument),
);
app.use("/v1/health", restrictInProd, healthRouter);
app.use("/v1/auth", authRouter);
app.use("/v1/forms", formsRouter);

app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ message: "Validation Error", errors: err.errors });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: "Internal Server Error" });
});

app.use((req, res) => {
  return res.status(404).json({ error: "Not Found" });
});

export default app;
