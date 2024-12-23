import { Router } from "express";
import { getCarts, createCart, deleteCart, getCartById, addProductToCart, deleteProductFromCart, getCartItems} from "../controllers/CartsControllers";
import auth from "../middleware/auth";

const router = Router();

//private

router.get("/carts",auth, getCarts);
router.post("/carts",auth, createCart);
router.delete("/carts/:id",auth, deleteCart);
//this is by userId
router.get("/carts/:id",auth, getCartById);
router.get("/carts/:id/items",auth, getCartItems);
//product on cart
router.post("/carts/:id/add-item", auth, addProductToCart);
router.delete("/carts/:id/remove-item/:productId", auth, deleteProductFromCart);


export default router