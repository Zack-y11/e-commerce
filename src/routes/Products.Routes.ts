import { Router } from "express";
import auth from "../middleware/auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  getProducts,
} from "../controllers/ProductsControllers";

const router = Router();

//private route
router.post("/products", auth, createProduct);
router.put("/products/:sku", auth, updateProduct);
router.delete("/products/:sku", auth, deleteProduct);
//public route
router.get("/products/:sku", auth, getProduct);
router.get("/products", auth, getProducts);

export default router;
