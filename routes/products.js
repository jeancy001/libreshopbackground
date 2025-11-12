import express from "express"
import { upload } from "../middlewares/uploadImage.js"
import { createProducts, deleteProduct, getAllproducts,getProductId, updateProducts} from "../controllers/productController.js"
import {verifyToken,  isAdmin } from "../middlewares/userAuthenticate.js"
const router  = express.Router()


router.post("/create",verifyToken, isAdmin, upload.array('imageUrl'),createProducts )
router.get("/", getAllproducts);
router.get("/byId/:id",getProductId)
router.delete("/delete/:id", verifyToken, isAdmin, deleteProduct)
router.put("/update/:id", verifyToken, isAdmin, upload.array("imageUrl"), updateProducts)






export {router as  productRouter}