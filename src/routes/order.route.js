import { verifyJWT } from "../middleware/auth.middleware.js";
import { Router } from "express";
import { placeOrder, deliverOrder } from "../controller/order.controller.js";

const router = Router();

router.route("/place-order").post(verifyJWT, placeOrder);
router.route("/deliverd-order/:orderId").post(deliverOrder);

export default router;
