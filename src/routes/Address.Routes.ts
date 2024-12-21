import { Router } from "express";
import auth from "../middleware/auth";
import {
  createShippingAddress,
  getShippingAddresses,
  updateShippingAddress,
  deleteShippingAddress,
} from "../controllers/AddressControllers";

const router = Router();

//user id is required
router.get("/shipping-addresses/:id", auth, getShippingAddresses);
router.post("/shipping-addresses", auth, createShippingAddress);
router.put("/shipping-addresses/:id", auth, updateShippingAddress);
router.delete("/shipping-addresses/:id", auth, deleteShippingAddress);

export default router;