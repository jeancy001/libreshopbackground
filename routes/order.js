import express from "express"
import { createOrders, getAllOrders, getOrderById, deleteOrders} from "../controllers/orderController.js"
import { verifyToken, isAdmin } from "../middlewares/userAuthenticate.js";

const router = express.Router()


router.post("/",verifyToken, createOrders);
router.get("/", verifyToken, getAllOrders);
router.get("/:id",verifyToken, getOrderById);
router.delete("/:id",verifyToken, deleteOrders);



export {router as orderRouter}