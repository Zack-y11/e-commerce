import { createPayment, getPayments, updatePayment, getPaymentById, getPaymentsByOrder, deletePayment} from "../controllers/PaymentsControllers";
import { Router} from "express";

import auth from "../middleware/auth";

const router = Router();

router.get("/payments", auth, getPayments);
router.post("/payments/:orderId", auth, createPayment);
router.get("/payments/:id", auth, getPaymentById);
router.put("/payments/:id", auth, updatePayment);
router.delete("/payments/:id", auth, deletePayment);
router.get("/payments/order/:orderId", auth, getPaymentsByOrder);





export default router;