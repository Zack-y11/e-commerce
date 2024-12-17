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

router.post("/order", auth, createOrder);
router.put("/order/:id", auth, updateOrder);
router.get("/order/:id", auth, getOrderById);
router.get("/order", auth, getOrders);
router.delete("/order/:id", auth, deleteOrder);
router.post("/order/:idOrder", auth, addItemsToOrder);
router.delete("/order/remove/:idOrder", auth, removeItemsFromOrder);

//test
router.get("/order/info/:id", auth, getOrderWithInfo);

export default router;