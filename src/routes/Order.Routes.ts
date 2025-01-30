import { Router } from "express";
import {
  createOrder,
  updateOrder,
  getOrderById,
  deleteOrder,
  addItemsToOrder,
  removeItemsFromOrder,
  getOrders,
  getOrderWithInfo
} from "../controllers/OrdersControllers";
import auth from "../middleware/auth";

const router = Router();

router.post("/orders", auth, createOrder);
router.put("/orders/:id", auth, updateOrder);
router.get("/orders/:id", auth, getOrderById);
router.get("/orders", auth, getOrders);
router.delete("/orders/:id", auth, deleteOrder);
router.post("/orders/:idOrder", auth, addItemsToOrder);
router.delete("/ordes/remove/:idOrder", auth, removeItemsFromOrder);

//test
router.get("/order/info/:id", auth, getOrderWithInfo);

export default router;