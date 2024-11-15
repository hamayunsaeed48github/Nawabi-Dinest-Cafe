import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { tableBooked, completeTable } from "../controller/table.controller.js";

const router = Router();

router.route("/book-table").post(verifyJWT, tableBooked);
router.route("/complete-table/:tableId").post(completeTable);

export default router;
