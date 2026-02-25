import { Router } from "express";
import { register, login, me } from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authRequired, me);
