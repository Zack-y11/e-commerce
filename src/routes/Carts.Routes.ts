import { Router } from "express";
import { getCarts, createCart, deleteCart, getCartById } from "../controllers/CartsControllers";
import auth from "../middleware/auth";

const router = Router();

//private
router.get("/carts",auth, getCarts);
router.post("/carts",auth, createCart);
router.delete("/carts/:id",auth, deleteCart);
router.get("/carts/:id",auth, getCartById);

export default router