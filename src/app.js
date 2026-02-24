import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import YAML from "yaml";
import fs from "fs";

import { corsConfig } from "./middleware/cors.js";
import { restrictInProd } from "./middleware/restrict.js";

const app = express();
const file = fs.readFileSync("swagger.yaml", "utf8");
const swaggerDocument = YAML.parse(file);
dotenv.config();

app.use(corsConfig);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())

app.use('/v1/docs', restrictInProd, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" })
})

export default app;