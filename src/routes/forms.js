import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import {
  getAllForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
} from "../controllers/formController.js";

export const formsRouter = Router();

formsRouter.get("/", getAllForms);
formsRouter.get("/:id", getFormById);
formsRouter.post("/", authRequired, createForm);
formsRouter.patch("/:id", authRequired, updateForm);
formsRouter.delete("/:id", authRequired, deleteForm);
