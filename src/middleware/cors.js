import cors from "cors";

export const corsConfig = cors({
  origin: "https://forms.224668.xyz",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
});
