import { Router } from "express";
import auth from "../middleware/auth";
import { createCategory, updateCategory, deleteCategory, getCategory, getCategories } from "../controllers/CategoryControllers";

const router = Router();

//private routes
router.post("/categories", auth, createCategory);
router.put("/categories/:id", auth, updateCategory);
router.delete("/categories/:id", auth, deleteCategory);

//public routes
router.get("/categories/:id", auth, getCategory);
router.get("/categories", auth, getCategories);

export default router