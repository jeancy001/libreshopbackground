import express from "express"
import { createPub, deletePub, getPub } from "../controllers/pubController.js"
import { upload } from "../middlewares/uploadImage.js"
const router = express.Router()

router.post("/create-pub",upload.single("imageUrl"),createPub)
router.get("/",getPub)
router.delete("/:id",deletePub)








export{router as pubRouter}