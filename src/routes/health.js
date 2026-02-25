import { Router } from "express";
import { prisma } from "../prisma.js";

export const healthRouter = Router();

healthRouter.get("/", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "healthy", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
    });
  }
});
