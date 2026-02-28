import { Router } from "express";
import { authRequired, authOptional } from "../middleware/auth.js";
import {
  getAllForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  submitResponse,
  getFormResponses,
} from "../controllers/formController.js";

export const formsRouter = Router();

formsRouter.get("/", authOptional, getAllForms);
formsRouter.get("/:id", authOptional, getFormById);
formsRouter.post("/", authRequired, createForm);
formsRouter.patch("/:id", authRequired, updateForm);
formsRouter.delete("/:id", authRequired, deleteForm);
formsRouter.post("/:id/responses", authOptional, submitResponse);
formsRouter.get("/:id/responses", authRequired, getFormResponses);
