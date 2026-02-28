import cors from "cors";

export const corsConfig = cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
});
