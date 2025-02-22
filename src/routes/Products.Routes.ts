import { Router } from "express";
import auth from "../middleware/auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  getProducts,
  getProductsByCategory
} from "../controllers/ProductsControllers";

const router = Router();

//private route
router.post("/products", auth, createProduct);
router.put("/products/:sku", auth, updateProduct);
router.delete("/products/:sku", auth, deleteProduct);
//public route
router.get("/products/:sku", getProduct);
router.get("/products", getProducts);
///category/Sample%20Category
router.get("/products/category/:category", getProductsByCategory);




export default router;
