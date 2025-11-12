import express from "express"
import { createContact, deleteContact, getContacts } from "../controllers/contactController.js"
const router = express.Router()



router.post("/",createContact)
router.get("/",getContacts)
router.delete("/:id",deleteContact)





export{router as  contactRouter}