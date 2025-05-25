import { verifyJWT } from "../middleware/auth.middleware.js";
import { Router } from "express";
import {
  placeOrder,
  deliverOrder,
  createPaymentIntent,
} from "../controller/order.controller.js";

const router = Router();

router.route("/place-order").post(verifyJWT, placeOrder);
router.route("/deliverd-order/:orderId").post(deliverOrder);

router.route("/create-payment-intent").post(verifyJWT, createPaymentIntent);

export default router;
